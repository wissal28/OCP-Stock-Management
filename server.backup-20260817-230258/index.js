import http from "node:http";
import { changePassword, createUser, deleteUser, getUserByMatricule, listUsers, updateUser, verifyLogin } from "./userRepository.js";
import {
  createSession,
  destroySession,
  getCurrentUser,
  getSessionToken,
  requireAuth,
  requireModuleWrite,
  requireUserManagement,
  sessionCookieHeader,
  clearSessionCookieHeader
} from "./authMiddleware.js";
import {
  createArretTrain,
  createDechargement,
  createTrain,
  deleteArretTrain,
  deleteDechargement,
  deleteTrain,
  importTrainsFromCsv,
  listArretsTrain,
  listDechargements,
  listTrains,
  updateArretTrain,
  updateDechargement,
  updateTrain
} from "./trainRepository.js";
import {
  createArret,
  createChargement,
  createChargementsBulk,
  createNavire,
  deleteArret,
  deleteChargement,
  deleteNavire,
  importNaviresFromCsv,
  listArrets,
  listChargements,
  listNavires,
  updateArret,
  updateChargement,
  updateNavire
} from "./navireRepository.js";
import { listSnapshots, upsertSnapshot } from "./stockRepository.js";
import { listAuditForEntity } from "./auditRepository.js";
import {
  backfillStockSnapshots,
  computeSnapshotForDay,
  getCelluleSiloMovements,
  recomputeAllStockSnapshots
} from "./stockCalculationService.js";
import { getEquipmentLiveStatus } from "./equipmentStatusService.js";
import {
  createAction,
  createIncident,
  createInspection,
  deleteAction,
  deleteIncident,
  deleteInspection,
  listActions,
  listIncidents,
  listInspections,
  updateAction,
  updateIncident,
  updateInspection
} from "./hseRepository.js";
import { exportNaviresToCsv, exportTrainsToCsv } from "./csvExport.js";
import { runMigrations } from "./migrate.js";
import { scheduleStockRollover } from "./stockRolloverJob.js";
import { loadEnvFile } from "./loadEnv.js";
import { chatWithAssistant } from "./assistantChatService.js";
import { createMaintenance, deleteMaintenance, listMaintenance, updateMaintenance } from "./maintenanceRepository.js";

loadEnvFile();
runMigrations();
scheduleStockRollover();
// Les CSV database/trains.csv et database/navires.csv sont ensuite tenus à jour automatiquement à
// chaque écriture (voir trainRepository.js / navireRepository.js) — génération initiale ici pour
// qu'ils reflètent l'état actuel dès le démarrage, sans attendre la première modification.
Promise.all([listTrains(), listNavires()]).then(([trains, navires]) => {
  exportTrainsToCsv(trains);
  exportNaviresToCsv(navires);
});

const port = Number(process.env.API_PORT || 3001);

function sendJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extraHeaders
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
    // --- Santé / auth ---
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true, database: "sqlite" });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readBody(request);
      const user = await verifyLogin(body.identifier, body.password);
      if (!user) {
        sendJson(response, 401, { message: "Identifiants invalides ou compte bloqué." });
        return;
      }
      const { token, expiresAt } = createSession(user.matricule);
      sendJson(response, 200, { user }, { "Set-Cookie": sessionCookieHeader(token, expiresAt) });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/auth/logout") {
      destroySession(getSessionToken(request));
      sendJson(response, 200, { ok: true }, { "Set-Cookie": clearSessionCookieHeader() });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/auth/me") {
      const user = await getCurrentUser(request);
      if (!user) {
        sendJson(response, 401, { message: "Non authentifié." });
        return;
      }
      sendJson(response, 200, { user });
      return;
    }

    // --- Utilisateurs ---
    if (request.method === "GET" && url.pathname === "/api/users") {
      const requester = await requireAuth(request);
      requireUserManagement(requester, { action: "list" });
      sendJson(response, 200, { users: await listUsers() });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/users") {
      // Inscription publique : reste volontairement non authentifiée (comportement existant).
      const user = await createUser(await readBody(request));
      sendJson(response, 201, { user });
      return;
    }

    if (parts[0] === "api" && parts[1] === "users" && parts[2]) {
      const matricule = parts[2];

      if (request.method === "GET" && parts.length === 3) {
        const requester = await requireAuth(request);
        const isSelf = requester.matricule.toUpperCase() === matricule.toUpperCase();
        if (!isSelf) requireUserManagement(requester, { action: "list" });
        const user = await getUserByMatricule(matricule);
        if (!user) {
          sendJson(response, 404, { message: "Utilisateur introuvable." });
          return;
        }
        sendJson(response, 200, { user });
        return;
      }

      if (request.method === "PATCH" && parts.length === 3) {
        const requester = await requireAuth(request);
        const body = await readBody(request);
        const isSelf = requester.matricule.toUpperCase() === matricule.toUpperCase();
        const managesRoleOrStatus = Object.prototype.hasOwnProperty.call(body, "role") || Object.prototype.hasOwnProperty.call(body, "statut");

        if (!isSelf || managesRoleOrStatus) {
          const target = await getUserByMatricule(matricule);
          requireUserManagement(requester, { targetMatricule: matricule, targetCurrentRole: target?.role, action: "update" });
        }

        const user = await updateUser(matricule, body);
        sendJson(response, 200, { user });
        return;
      }

      if (request.method === "PATCH" && parts[3] === "password") {
        const requester = await requireAuth(request);
        if (requester.matricule.toUpperCase() !== matricule.toUpperCase()) {
          sendJson(response, 403, { message: "Vous ne pouvez changer que votre propre mot de passe." });
          return;
        }
        const body = await readBody(request);
        const user = await changePassword(matricule, body.oldPassword, body.newPassword);
        sendJson(response, 200, { user });
        return;
      }

      if (request.method === "DELETE" && parts.length === 3) {
        const requester = await requireAuth(request);
        requireUserManagement(requester, { targetMatricule: matricule, action: "delete" });
        sendJson(response, 200, await deleteUser(matricule));
        return;
      }
    }

    // --- Trains / déchargements ---
    if (request.method === "GET" && url.pathname === "/api/trains") {
      await requireAuth(request);
      sendJson(response, 200, { trains: await listTrains() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/trains") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const train = await createTrain(await readBody(request), user.matricule);
      sendJson(response, 201, { train });
      return;
    }
    if (parts[0] === "api" && parts[1] === "trains" && parts[2]) {
      const id = parts[2];
      if (request.method === "PATCH") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        const train = await updateTrain(id, await readBody(request), user.matricule);
        sendJson(response, 200, { train });
        return;
      }
      if (request.method === "DELETE") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        sendJson(response, 200, await deleteTrain(id, user.matricule));
        return;
      }
    }
    if (request.method === "POST" && url.pathname === "/api/trains/import-csv") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      sendJson(response, 200, await importTrainsFromCsv(user.matricule));
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/dechargements") {
      await requireAuth(request);
      sendJson(response, 200, { dechargements: await listDechargements() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/dechargements") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const dechargement = await createDechargement(await readBody(request), user.matricule);
      sendJson(response, 201, { dechargement });
      return;
    }
    if (parts[0] === "api" && parts[1] === "dechargements" && parts[2]) {
      const id = parts[2];
      if (request.method === "PATCH") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        const dechargement = await updateDechargement(id, await readBody(request), user.matricule);
        sendJson(response, 200, { dechargement });
        return;
      }
      if (request.method === "DELETE") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        sendJson(response, 200, await deleteDechargement(id, user.matricule));
        return;
      }
    }

    if (request.method === "GET" && url.pathname === "/api/arrets-train") {
      await requireAuth(request);
      sendJson(response, 200, { arrets: await listArretsTrain() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/arrets-train") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const arret = await createArretTrain(await readBody(request), user.matricule);
      sendJson(response, 201, { arret });
      return;
    }
    if (parts[0] === "api" && parts[1] === "arrets-train" && parts[2] && request.method === "PATCH") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const arret = await updateArretTrain(parts[2], await readBody(request), user.matricule);
      sendJson(response, 200, { arret });
      return;
    }
    if (parts[0] === "api" && parts[1] === "arrets-train" && parts[2] && request.method === "DELETE") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      sendJson(response, 200, await deleteArretTrain(parts[2], user.matricule));
      return;
    }

    // --- Navires / chargements / arrêts ---
    if (request.method === "GET" && url.pathname === "/api/navires") {
      await requireAuth(request);
      sendJson(response, 200, { navires: await listNavires() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/navires") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const navire = await createNavire(await readBody(request), user.matricule);
      sendJson(response, 201, { navire });
      return;
    }
    if (parts[0] === "api" && parts[1] === "navires" && parts[2]) {
      const id = parts[2];
      if (request.method === "PATCH") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        const navire = await updateNavire(id, await readBody(request), user.matricule);
        sendJson(response, 200, { navire });
        return;
      }
      if (request.method === "DELETE") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        sendJson(response, 200, await deleteNavire(id, user.matricule));
        return;
      }
    }

    if (request.method === "POST" && url.pathname === "/api/navires/import-csv") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      sendJson(response, 200, await importNaviresFromCsv(user.matricule));
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/chargements") {
      await requireAuth(request);
      sendJson(response, 200, { chargements: await listChargements() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/chargements") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const chargement = await createChargement(await readBody(request), user.matricule);
      sendJson(response, 201, { chargement });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/chargements/bulk") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const body = await readBody(request);
      const chargements = await createChargementsBulk(Array.isArray(body.chargements) ? body.chargements : [], user.matricule);
      sendJson(response, 201, { chargements });
      return;
    }
    if (parts[0] === "api" && parts[1] === "chargements" && parts[2]) {
      const id = parts[2];
      if (request.method === "PATCH") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        const chargement = await updateChargement(id, await readBody(request), user.matricule);
        sendJson(response, 200, { chargement });
        return;
      }
      if (request.method === "DELETE") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        sendJson(response, 200, await deleteChargement(id, user.matricule));
        return;
      }
    }

    if (request.method === "GET" && url.pathname === "/api/arrets") {
      await requireAuth(request);
      sendJson(response, 200, { arrets: await listArrets() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/arrets") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const arret = await createArret(await readBody(request), user.matricule);
      sendJson(response, 201, { arret });
      return;
    }
    if (parts[0] === "api" && parts[1] === "arrets" && parts[2] && request.method === "PATCH") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const arret = await updateArret(parts[2], await readBody(request), user.matricule);
      sendJson(response, 200, { arret });
      return;
    }
    if (parts[0] === "api" && parts[1] === "arrets" && parts[2] && request.method === "DELETE") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      sendJson(response, 200, await deleteArret(parts[2], user.matricule));
      return;
    }

    // --- Stock ---
    if (request.method === "GET" && url.pathname === "/api/stock/snapshots") {
      await requireAuth(request);
      sendJson(response, 200, { snapshots: await listSnapshots() });
      return;
    }
    if (request.method === "PUT" && url.pathname === "/api/stock/snapshots") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const snapshot = await upsertSnapshot(await readBody(request), user.matricule);
      sendJson(response, 200, { snapshot });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/stock/snapshots/compute") {
      await requireAuth(request);
      const day = url.searchParams.get("date");
      if (!day) {
        sendJson(response, 400, { message: "Paramètre 'date' requis." });
        return;
      }
      sendJson(response, 200, { snapshot: await computeSnapshotForDay(day) });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/stock/snapshots/backfill") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      sendJson(response, 200, await backfillStockSnapshots(user.matricule));
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/stock/snapshots/recompute-all") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      sendJson(response, 200, await recomputeAllStockSnapshots(user.matricule));
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/stock/movements") {
      await requireAuth(request);
      const day = url.searchParams.get("date");
      if (!day) {
        sendJson(response, 400, { message: "Paramètre 'date' requis." });
        return;
      }
      sendJson(response, 200, { movements: await getCelluleSiloMovements(day) });
      return;
    }

    // --- HSE : incidents / accidents ---
    if (request.method === "GET" && url.pathname === "/api/hse/incidents") {
      await requireAuth(request);
      sendJson(response, 200, { incidents: await listIncidents() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/hse/incidents") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const incident = await createIncident(await readBody(request), user.matricule);
      sendJson(response, 201, { incident });
      return;
    }
    if (parts[0] === "api" && parts[1] === "hse" && parts[2] === "incidents" && parts[3]) {
      const id = parts[3];
      if (request.method === "PATCH") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        const incident = await updateIncident(id, await readBody(request), user.matricule);
        sendJson(response, 200, { incident });
        return;
      }
      if (request.method === "DELETE") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        sendJson(response, 200, await deleteIncident(id, user.matricule));
        return;
      }
    }

    // --- HSE : inspections / checklists sécurité ---
    if (request.method === "GET" && url.pathname === "/api/hse/inspections") {
      await requireAuth(request);
      sendJson(response, 200, { inspections: await listInspections() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/hse/inspections") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const inspection = await createInspection(await readBody(request), user.matricule);
      sendJson(response, 201, { inspection });
      return;
    }
    if (parts[0] === "api" && parts[1] === "hse" && parts[2] === "inspections" && parts[3]) {
      const id = parts[3];
      if (request.method === "PATCH") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        const inspection = await updateInspection(id, await readBody(request), user.matricule);
        sendJson(response, 200, { inspection });
        return;
      }
      if (request.method === "DELETE") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        sendJson(response, 200, await deleteInspection(id, user.matricule));
        return;
      }
    }

    // --- HSE : plan d'actions correctives ---
    if (request.method === "GET" && url.pathname === "/api/hse/actions") {
      await requireAuth(request);
      sendJson(response, 200, { actions: await listActions() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/hse/actions") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const action = await createAction(await readBody(request), user.matricule);
      sendJson(response, 201, { action });
      return;
    }
    if (parts[0] === "api" && parts[1] === "hse" && parts[2] === "actions" && parts[3]) {
      const id = parts[3];
      if (request.method === "PATCH") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        const action = await updateAction(id, await readBody(request), user.matricule);
        sendJson(response, 200, { action });
        return;
      }
      if (request.method === "DELETE") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        sendJson(response, 200, await deleteAction(id, user.matricule));
        return;
      }
    }

    // --- Maintenance : interventions préventives / correctives ---
    if (request.method === "GET" && url.pathname === "/api/maintenance") {
      await requireAuth(request);
      sendJson(response, 200, { interventions: await listMaintenance() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/maintenance") {
      const user = await requireAuth(request);
      requireModuleWrite(user);
      const intervention = await createMaintenance(await readBody(request), user.matricule);
      sendJson(response, 201, { intervention });
      return;
    }
    if (parts[0] === "api" && parts[1] === "maintenance" && parts[2]) {
      const id = parts[2];
      if (request.method === "PATCH") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        const intervention = await updateMaintenance(id, await readBody(request), user.matricule);
        sendJson(response, 200, { intervention });
        return;
      }
      if (request.method === "DELETE") {
        const user = await requireAuth(request);
        requireModuleWrite(user);
        sendJson(response, 200, await deleteMaintenance(id, user.matricule));
        return;
      }
    }

    // --- Assistant IA : chatbot (Claude, si ANTHROPIC_API_KEY configurée) ---
    if (request.method === "POST" && url.pathname === "/api/assistant/chat") {
      await requireAuth(request);
      const body = await readBody(request);
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const result = await chatWithAssistant(messages);
      sendJson(response, 200, result);
      return;
    }

    // --- Audit ---
    if (request.method === "GET" && url.pathname === "/api/audit") {
      await requireAuth(request);
      const entityType = url.searchParams.get("entityType") || "";
      const entityId = url.searchParams.get("entityId") || "";
      sendJson(response, 200, { entries: await listAuditForEntity(entityType, entityId) });
      return;
    }

    // --- Schéma de manutention (statut live) ---
    if (request.method === "GET" && url.pathname === "/api/equipment-status") {
      await requireAuth(request);
      sendJson(response, 200, { equipment: await getEquipmentLiveStatus() });
      return;
    }

    sendJson(response, 404, { message: "Route API introuvable." });
  } catch (error) {
    sendJson(response, error.status || 500, { message: error.message || "Erreur serveur." });
  }
}

http.createServer(handleRequest).listen(port, () => {
  console.log(`API SQLite listening on http://localhost:${port}`);
});
