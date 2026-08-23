import { randomBytes, createHash } from "node:crypto";
import { db } from "./db.js";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function normalizeMatricule(matricule) {
  return String(matricule ?? "").trim().toUpperCase();
}

function hashPassword(password, salt) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function createPasswordRecord(password) {
  const salt = randomBytes(12).toString("hex");
  return { passwordSalt: salt, passwordHash: hashPassword(password, salt) };
}

function withoutPassword(user) {
  const { passwordSalt, passwordHash, ...safeUser } = user;
  return { ...safeUser, id: user.matricule };
}

const selectByMatricule = db.prepare("SELECT * FROM users WHERE matricule = ?");
const selectByEmail = db.prepare("SELECT * FROM users WHERE email = ?");
const selectAll = db.prepare("SELECT * FROM users ORDER BY createdAt ASC");
const insertUser = db.prepare(`
  INSERT INTO users (matricule, email, fullName, phone, filiale, fonction, departement, statut, role, photoUrl, passwordSalt, passwordHash, createdAt, updatedAt)
  VALUES (@matricule, @email, @fullName, @phone, @filiale, @fonction, @departement, @statut, @role, @photoUrl, @passwordSalt, @passwordHash, @createdAt, @updatedAt)
`);
const updateUserStmt = db.prepare(`
  UPDATE users SET fullName = @fullName, phone = @phone, filiale = @filiale, fonction = @fonction,
    departement = @departement, statut = @statut, role = @role, photoUrl = @photoUrl, updatedAt = @updatedAt
  WHERE matricule = @matricule
`);
const updatePasswordStmt = db.prepare(`
  UPDATE users SET passwordSalt = @passwordSalt, passwordHash = @passwordHash, updatedAt = @updatedAt WHERE matricule = @matricule
`);
const deleteUserStmt = db.prepare("DELETE FROM users WHERE matricule = ?");

export async function listUsers() {
  return selectAll.all().map(withoutPassword);
}

export async function getUserByMatricule(matricule) {
  const user = selectByMatricule.get(normalizeMatricule(matricule));
  return user ? withoutPassword(user) : null;
}

export async function createUser(input) {
  const matricule = normalizeMatricule(input.matricule);
  const email = normalizeEmail(input.email);

  if (!matricule) {
    const error = new Error("Le matricule est obligatoire.");
    error.status = 400;
    throw error;
  }
  if (!email) {
    const error = new Error("L'email est obligatoire.");
    error.status = 400;
    throw error;
  }
  if (!input.password || String(input.password).length < 6) {
    const error = new Error("Le mot de passe doit contenir au moins 6 caractères.");
    error.status = 400;
    throw error;
  }
  if (selectByMatricule.get(matricule)) {
    const error = new Error("Ce matricule existe déjà.");
    error.status = 409;
    throw error;
  }
  if (selectByEmail.get(email)) {
    const error = new Error("Cet email existe déjà.");
    error.status = 409;
    throw error;
  }

  const now = new Date().toISOString();
  const passwordRecord = createPasswordRecord(input.password);
  const user = {
    matricule,
    email,
    fullName: String(input.fullName ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    filiale: String(input.filiale ?? "").trim(),
    fonction: String(input.fonction ?? "").trim(),
    departement: String(input.departement ?? "").trim(),
    statut: "actif",
    role: "Lecture seule",
    photoUrl: "",
    ...passwordRecord,
    createdAt: now,
    updatedAt: now
  };

  insertUser.run(user);
  return withoutPassword(user);
}

export async function verifyLogin(identifier, password) {
  const value = String(identifier ?? "").trim().toLowerCase();
  const user = selectByEmail.get(value) ?? selectByMatricule.get(value.toUpperCase());

  if (!user || user.statut === "bloque") return null;

  const incomingHash = hashPassword(password, user.passwordSalt);
  if (incomingHash !== user.passwordHash) return null;
  return withoutPassword(user);
}

export async function updateUser(matricule, patch) {
  const normalized = normalizeMatricule(matricule);
  const existing = selectByMatricule.get(normalized);
  if (!existing) {
    const error = new Error("Utilisateur introuvable.");
    error.status = 404;
    throw error;
  }

  const allowed = ["fullName", "phone", "filiale", "fonction", "departement", "statut", "role", "photoUrl"];
  const next = { ...existing };
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      next[key] = String(patch[key] ?? "").trim();
    }
  }
  next.updatedAt = new Date().toISOString();
  updateUserStmt.run(next);
  return withoutPassword(next);
}

export async function changePassword(matricule, oldPassword, newPassword) {
  const normalized = normalizeMatricule(matricule);
  const existing = selectByMatricule.get(normalized);
  if (!existing) {
    const error = new Error("Utilisateur introuvable.");
    error.status = 404;
    throw error;
  }

  if (hashPassword(oldPassword, existing.passwordSalt) !== existing.passwordHash) {
    const error = new Error("L'ancien mot de passe est incorrect.");
    error.status = 401;
    throw error;
  }
  if (!newPassword || String(newPassword).length < 6) {
    const error = new Error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
    error.status = 400;
    throw error;
  }

  const passwordRecord = createPasswordRecord(newPassword);
  const updatedAt = new Date().toISOString();
  updatePasswordStmt.run({ matricule: normalized, ...passwordRecord, updatedAt });
  return withoutPassword({ ...existing, ...passwordRecord, updatedAt });
}

export async function deleteUser(matricule) {
  const normalized = normalizeMatricule(matricule);
  const result = deleteUserStmt.run(normalized);
  if (result.changes === 0) {
    const error = new Error("Utilisateur introuvable.");
    error.status = 404;
    throw error;
  }
  return { ok: true };
}
