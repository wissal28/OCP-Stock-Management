import { randomBytes, createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const databaseDir = path.join(rootDir, "database");
const userCsvPath = path.join(databaseDir, "utilisateur.csv");

const headers = [
  "matricule",
  "email",
  "fullName",
  "phone",
  "filiale",
  "fonction",
  "departement",
  "statut",
  "role",
  "photoUrl",
  "passwordSalt",
  "passwordHash",
  "createdAt",
  "updatedAt"
];

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

function escapeCell(value) {
  const cell = String(value ?? "");
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replaceAll('"', '""')}"`;
  }
  return cell;
}

function parseCsv(text) {
  const lines = text.trim() ? text.replace(/^\uFEFF/, "").split(/\r?\n/) : [];
  if (lines.length === 0) return [];
  const csvHeaders = parseCsvLine(lines[0]);
  return lines.slice(1).filter(Boolean).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(csvHeaders.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function stringifyCsv(rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCell(row[header])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

async function ensureDatabase() {
  await mkdir(databaseDir, { recursive: true });
  try {
    await readFile(userCsvPath, "utf8");
  } catch {
    await writeFile(userCsvPath, stringifyCsv([]), "utf8");
  }
}

async function readUsersRaw() {
  await ensureDatabase();
  const csv = await readFile(userCsvPath, "utf8");
  return parseCsv(csv);
}

async function writeUsersRaw(users) {
  await ensureDatabase();
  await writeFile(userCsvPath, stringifyCsv(users), "utf8");
}

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

export async function listUsers() {
  const users = await readUsersRaw();
  return users.map(withoutPassword);
}

export async function getUserByMatricule(matricule) {
  const normalized = normalizeMatricule(matricule);
  const users = await readUsersRaw();
  const user = users.find((item) => normalizeMatricule(item.matricule) === normalized);
  return user ? withoutPassword(user) : null;
}

export async function createUser(input) {
  const users = await readUsersRaw();
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
  if (users.some((user) => normalizeMatricule(user.matricule) === matricule)) {
    const error = new Error("Ce matricule existe déjà.");
    error.status = 409;
    throw error;
  }
  if (users.some((user) => normalizeEmail(user.email) === email)) {
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

  users.push(user);
  await writeUsersRaw(users);
  return withoutPassword(user);
}

export async function verifyLogin(identifier, password) {
  const value = String(identifier ?? "").trim().toLowerCase();
  const users = await readUsersRaw();
  const user = users.find((item) => normalizeEmail(item.email) === value || normalizeMatricule(item.matricule).toLowerCase() === value);

  if (!user || user.statut === "bloque") return null;

  const incomingHash = hashPassword(password, user.passwordSalt);
  if (incomingHash !== user.passwordHash) return null;
  return withoutPassword(user);
}

export async function updateUser(matricule, patch) {
  const normalized = normalizeMatricule(matricule);
  const users = await readUsersRaw();
  const index = users.findIndex((user) => normalizeMatricule(user.matricule) === normalized);
  if (index === -1) {
    const error = new Error("Utilisateur introuvable.");
    error.status = 404;
    throw error;
  }

  const allowed = ["fullName", "phone", "filiale", "fonction", "departement", "statut", "role", "photoUrl"];
  const next = { ...users[index] };
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      next[key] = String(patch[key] ?? "").trim();
    }
  }
  next.updatedAt = new Date().toISOString();
  users[index] = next;
  await writeUsersRaw(users);
  return withoutPassword(next);
}

export async function changePassword(matricule, oldPassword, newPassword) {
  const normalized = normalizeMatricule(matricule);
  const users = await readUsersRaw();
  const index = users.findIndex((user) => normalizeMatricule(user.matricule) === normalized);
  if (index === -1) {
    const error = new Error("Utilisateur introuvable.");
    error.status = 404;
    throw error;
  }

  const user = users[index];
  if (hashPassword(oldPassword, user.passwordSalt) !== user.passwordHash) {
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
  users[index] = { ...user, ...passwordRecord, updatedAt: new Date().toISOString() };
  await writeUsersRaw(users);
  return withoutPassword(users[index]);
}

export async function deleteUser(matricule) {
  const normalized = normalizeMatricule(matricule);
  const users = await readUsersRaw();
  const nextUsers = users.filter((user) => normalizeMatricule(user.matricule) !== normalized);
  if (nextUsers.length === users.length) {
    const error = new Error("Utilisateur introuvable.");
    error.status = 404;
    throw error;
  }
  await writeUsersRaw(nextUsers);
  return { ok: true };
}
