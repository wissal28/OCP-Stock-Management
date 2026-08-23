import { randomBytes } from "node:crypto";
import { db } from "./db.js";
import { getUserByMatricule } from "./userRepository.js";

const SESSION_COOKIE = "ocp_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

const insertSession = db.prepare("INSERT INTO sessions (token, matricule, createdAt, expiresAt) VALUES (?, ?, ?, ?)");
const selectSession = db.prepare("SELECT * FROM sessions WHERE token = ?");
const deleteSessionStmt = db.prepare("DELETE FROM sessions WHERE token = ?");
const deleteExpiredStmt = db.prepare("DELETE FROM sessions WHERE expiresAt < ?");

export function createSession(matricule) {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  insertSession.run(token, matricule, now.toISOString(), expiresAt.toISOString());
  return { token, expiresAt };
}

export function destroySession(token) {
  if (token) deleteSessionStmt.run(token);
}

export function parseCookies(request) {
  const header = request.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (!key) continue;
    cookies[key] = decodeURIComponent(rest.join("="));
  }
  return cookies;
}

export function sessionCookieHeader(token, expiresAt) {
  const expires = expiresAt.toUTCString();
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`;
}

export function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/** Résout l'utilisateur courant à partir du cookie de session, ou null si absent/expiré. */
export async function getCurrentUser(request) {
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;

  deleteExpiredStmt.run(new Date().toISOString());
  const session = selectSession.get(token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    deleteSessionStmt.run(token);
    return null;
  }
  return getUserByMatricule(session.matricule);
}

export function getSessionToken(request) {
  return parseCookies(request)[SESSION_COOKIE];
}

function authError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/** Lève une erreur 401 si personne n'est connecté, ou 403 si le compte est bloqué. */
export async function requireAuth(request) {
  const user = await getCurrentUser(request);
  if (!user) throw authError(401, "Authentification requise.");
  if (user.statut === "bloque") throw authError(403, "Compte bloqué.");
  return user;
}

/** Rôles autorisés à lire/écrire les modules métier (train/navire/stock). Lecture seule = lecture uniquement. */
export function requireModuleWrite(user) {
  if (user.role === "Lecture seule") {
    throw authError(403, "Votre rôle ne permet que la lecture.");
  }
}

/** Rôles autorisés à gérer les autres utilisateurs (page Admin). */
export function requireUserManagement(user, { targetMatricule, targetCurrentRole, action } = {}) {
  if (user.role === "Administrateur") return;

  if (user.role === "Superviseur") {
    if (action === "delete") throw authError(403, "Seul un administrateur peut supprimer un compte.");
    if (targetCurrentRole === "Administrateur") throw authError(403, "Seul un administrateur peut modifier un compte administrateur.");
    return;
  }

  throw authError(403, "Votre rôle ne permet pas de gérer les utilisateurs.");
}
