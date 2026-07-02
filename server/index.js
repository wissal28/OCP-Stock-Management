import http from "node:http";
import {
  changePassword,
  createUser,
  deleteUser,
  getUserByMatricule,
  listUsers,
  updateUser,
  verifyLogin
} from "./userRepository.js";

const port = Number(process.env.API_PORT || 3001);

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function routeParts(url) {
  return url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
}

async function handleRequest(request, response) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const parts = routeParts(url);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true, database: "csv" });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readBody(request);
      const user = await verifyLogin(body.identifier, body.password);
      if (!user) {
        sendJson(response, 401, { message: "Identifiants invalides ou compte bloqué." });
        return;
      }
      sendJson(response, 200, { user });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/users") {
      sendJson(response, 200, { users: await listUsers() });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/users") {
      const user = await createUser(await readBody(request));
      sendJson(response, 201, { user });
      return;
    }

    if (parts[0] === "api" && parts[1] === "users" && parts[2]) {
      const matricule = parts[2];

      if (request.method === "GET" && parts.length === 3) {
        const user = await getUserByMatricule(matricule);
        if (!user) {
          sendJson(response, 404, { message: "Utilisateur introuvable." });
          return;
        }
        sendJson(response, 200, { user });
        return;
      }

      if (request.method === "PATCH" && parts.length === 3) {
        const user = await updateUser(matricule, await readBody(request));
        sendJson(response, 200, { user });
        return;
      }

      if (request.method === "PATCH" && parts[3] === "password") {
        const body = await readBody(request);
        const user = await changePassword(matricule, body.oldPassword, body.newPassword);
        sendJson(response, 200, { user });
        return;
      }

      if (request.method === "DELETE" && parts.length === 3) {
        sendJson(response, 200, await deleteUser(matricule));
        return;
      }
    }

    sendJson(response, 404, { message: "Route API introuvable." });
  } catch (error) {
    sendJson(response, error.status || 500, { message: error.message || "Erreur serveur." });
  }
}

http.createServer(handleRequest).listen(port, () => {
  console.log(`CSV API listening on http://localhost:${port}`);
});
