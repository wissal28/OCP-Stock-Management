import type { ArretTrain, Dechargement, Train } from "./components/train/trainData";
import type { ArretNavire, ChargementPortique, Navire } from "./components/navire/navireData";
import type { StockSnapshot } from "./components/stock/stockData";
import type { HSEAction, HSEIncident, HSEInspection } from "./components/hse/hseData";
import type { MaintenanceIntervention } from "./components/maintenance/maintenanceData";

export type CsvUser = {
  id: string;
  matricule: string;
  email: string;
  fullName: string;
  phone: string;
  filiale: string;
  fonction: string;
  departement: string;
  statut: "actif" | "inactif" | "bloque";
  role: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Erreur API.");
  }
  return payload as T;
}

// --- Authentification ---

export async function logoutUser() {
  await requestJson<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<CsvUser | null> {
  try {
    const payload = await requestJson<{ user: CsvUser }>("/api/auth/me");
    return payload.user;
  } catch {
    return null;
  }
}

export async function loginUser(identifier: string, password: string) {
  const payload = await requestJson<{ user: CsvUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password })
  });
  return payload.user;
}

export async function createUser(input: {
  fullName: string;
  matricule: string;
  email: string;
  phone?: string;
  filiale: string;
  fonction: string;
  departement: string;
  password: string;
}) {
  const payload = await requestJson<{ user: CsvUser }>("/api/users", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return payload.user;
}

export async function listUsers() {
  const payload = await requestJson<{ users: CsvUser[] }>("/api/users");
  return payload.users;
}

export async function getUser(matricule: string) {
  const payload = await requestJson<{ user: CsvUser }>(`/api/users/${encodeURIComponent(matricule)}`);
  return payload.user;
}

export async function updateUser(matricule: string, patch: Partial<CsvUser>) {
  const payload = await requestJson<{ user: CsvUser }>(`/api/users/${encodeURIComponent(matricule)}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
  return payload.user;
}

export async function changeUserPassword(matricule: string, oldPassword: string, newPassword: string) {
  const payload = await requestJson<{ user: CsvUser }>(`/api/users/${encodeURIComponent(matricule)}/password`, {
    method: "PATCH",
    body: JSON.stringify({ oldPassword, newPassword })
  });
  return payload.user;
}

// --- Gestion de train ---

export async function listTrains() {
  return (await requestJson<{ trains: Train[] }>("/api/trains")).trains;
}

export async function createTrain(train: Train) {
  return (await requestJson<{ train: Train }>("/api/trains", { method: "POST", body: JSON.stringify(train) })).train;
}

export async function updateTrain(id: string, patch: Partial<Train>) {
  return (await requestJson<{ train: Train }>(`/api/trains/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) })).train;
}

export async function deleteTrain(id: string) {
  await requestJson<{ ok: boolean }>(`/api/trains/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Relit database/trains.csv (potentiellement modifié à la main dans un tableur) et réconcilie
 * chaque ligne avec la base — crée les trains absents, met à jour ceux qui existent déjà (par id). */
export async function importTrainsFromCsv() {
  return requestJson<{ created: number; updated: number; total: number }>("/api/trains/import-csv", { method: "POST" });
}

export async function listDechargements() {
  return (await requestJson<{ dechargements: Dechargement[] }>("/api/dechargements")).dechargements;
}

export async function createDechargement(dechargement: Dechargement) {
  return (await requestJson<{ dechargement: Dechargement }>("/api/dechargements", { method: "POST", body: JSON.stringify(dechargement) }))
    .dechargement;
}

export async function updateDechargement(id: string, patch: Partial<Dechargement>) {
  return (
    await requestJson<{ dechargement: Dechargement }>(`/api/dechargements/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    })
  ).dechargement;
}

export async function deleteDechargement(id: string) {
  await requestJson<{ ok: boolean }>(`/api/dechargements/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listArretsTrain() {
  return (await requestJson<{ arrets: ArretTrain[] }>("/api/arrets-train")).arrets;
}

export async function createArretTrain(arret: ArretTrain) {
  return (await requestJson<{ arret: ArretTrain }>("/api/arrets-train", { method: "POST", body: JSON.stringify(arret) })).arret;
}

export async function updateArretTrain(id: string, patch: Partial<ArretTrain>) {
  return (
    await requestJson<{ arret: ArretTrain }>(`/api/arrets-train/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) })
  ).arret;
}

export async function deleteArretTrain(id: string) {
  await requestJson<{ ok: boolean }>(`/api/arrets-train/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Gestion de navires ---

export async function listNavires() {
  return (await requestJson<{ navires: Navire[] }>("/api/navires")).navires;
}

export async function createNavire(navire: Navire) {
  return (await requestJson<{ navire: Navire }>("/api/navires", { method: "POST", body: JSON.stringify(navire) })).navire;
}

export async function updateNavire(id: string, patch: Partial<Navire>) {
  return (
    await requestJson<{ navire: Navire }>(`/api/navires/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) })
  ).navire;
}

export async function deleteNavire(id: string) {
  await requestJson<{ ok: boolean }>(`/api/navires/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Relit database/navires.csv (potentiellement modifié à la main dans un tableur) et réconcilie
 * chaque ligne avec la base — crée les navires absents, met à jour ceux qui existent déjà (par id). */
export async function importNaviresFromCsv() {
  return requestJson<{ created: number; updated: number; total: number }>("/api/navires/import-csv", { method: "POST" });
}

export async function listChargements() {
  return (await requestJson<{ chargements: ChargementPortique[] }>("/api/chargements")).chargements;
}

export async function createChargement(chargement: ChargementPortique) {
  return (await requestJson<{ chargement: ChargementPortique }>("/api/chargements", { method: "POST", body: JSON.stringify(chargement) }))
    .chargement;
}

export async function createChargementsBulk(chargements: ChargementPortique[]) {
  return (
    await requestJson<{ chargements: ChargementPortique[] }>("/api/chargements/bulk", {
      method: "POST",
      body: JSON.stringify({ chargements })
    })
  ).chargements;
}

export async function updateChargement(id: string, patch: Partial<ChargementPortique>) {
  return (
    await requestJson<{ chargement: ChargementPortique }>(`/api/chargements/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    })
  ).chargement;
}

export async function deleteChargement(id: string) {
  await requestJson<{ ok: boolean }>(`/api/chargements/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listArrets() {
  return (await requestJson<{ arrets: ArretNavire[] }>("/api/arrets")).arrets;
}

export async function createArret(arret: ArretNavire) {
  return (await requestJson<{ arret: ArretNavire }>("/api/arrets", { method: "POST", body: JSON.stringify(arret) })).arret;
}

export async function updateArret(id: string, patch: Partial<ArretNavire>) {
  return (await requestJson<{ arret: ArretNavire }>(`/api/arrets/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) })).arret;
}

export async function deleteArret(id: string) {
  await requestJson<{ ok: boolean }>(`/api/arrets/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Gestion de stock ---

export async function listStockSnapshots() {
  return (await requestJson<{ snapshots: StockSnapshot[] }>("/api/stock/snapshots")).snapshots;
}

export async function saveStockSnapshot(snapshot: StockSnapshot) {
  return (await requestJson<{ snapshot: StockSnapshot }>("/api/stock/snapshots", { method: "PUT", body: JSON.stringify(snapshot) }))
    .snapshot;
}

/** Calcule le snapshot d'une journée d'exploitation à partir des mouvements réels (entrées trains −
 * sorties navires), sans l'enregistrer — sert de base au premier enregistrement du jour. */
export async function computeStockSnapshot(date: string) {
  return (await requestJson<{ snapshot: StockSnapshot }>(`/api/stock/snapshots/compute?date=${encodeURIComponent(date)}`)).snapshot;
}

/** Calcule et enregistre un snapshot pour chaque journée d'exploitation ayant une activité réelle
 * (train/navire) et n'en ayant pas encore — remplit l'historique complet en une fois. */
export async function backfillStockSnapshots() {
  return requestJson<{ totalDaysWithActivity: number; created: string[] }>("/api/stock/snapshots/backfill", { method: "POST" });
}

/** Recalcule et réenregistre TOUTES les journées déjà connues (Lot 1+2), du plus ancien au plus
 * récent, à partir des données de déchargement/chargement actuellement en base — utile après une
 * correction des données sources pour que l'historique déjà calculé reflète les chiffres corrigés.
 * Préserve l'écart manuel, les zones, l'état des silos et les notes de poste déjà saisis. */
export async function recomputeAllStockSnapshots() {
  return requestJson<{ totalDays: number; recomputed: string[] }>("/api/stock/snapshots/recompute-all", { method: "POST" });
}

export interface CelluleMovement {
  celluleId: string;
  lotId: string;
  entrant: number;
  sortant: number;
  existant: number;
  /** "officiel" = stock persisté (Lot 1/2, corrigible via écart manuel) ; "cumul" = calculé depuis
   * la première journée d'activité connue (Lot 3, pas de snapshot officiel par cellule). */
  existantSource: "officiel" | "cumul";
  /** Qualité active réellement suivie — seulement pour le Lot 1+2 (stock officiel) ; null pour le Lot 3
   * (pas de relevé de qualité par cellule dans le modèle actuel). */
  qualite: string | null;
}

export interface SiloMovement {
  siloId: string;
  entrant: number;
  sortant: number;
  existant: number;
  existantSource: "officiel" | "cumul";
}

/** Peseuses/portiques : simples convoyeurs de passage, pas de lieu de stockage — pas d'"existant",
 * seulement le débit du jour et si une opération est en cours maintenant (n'a de sens que pour la
 * journée en cours). */
export interface PeseuseActivity {
  peseuse: string;
  portiques: string[];
  tonnage: number;
  actif: boolean;
}

export interface StockMovements {
  date: string;
  cellules: CelluleMovement[];
  silos: SiloMovement[];
  navireDirect: { quantite: number };
  peseuses: PeseuseActivity[];
}

/** Entrant/sortant/existant pour chaque cellule (Lot 1/2/3) et chaque silo (T10), pour une journée
 * d'exploitation donnée — complète le snapshot de stock (limité aux 12 cellules Lot 1+2). */
export async function getStockMovements(date: string) {
  return (await requestJson<{ movements: StockMovements }>(`/api/stock/movements?date=${encodeURIComponent(date)}`)).movements;
}

// --- HSE ---

export async function listIncidents() {
  return (await requestJson<{ incidents: HSEIncident[] }>("/api/hse/incidents")).incidents;
}

export async function createIncident(incident: HSEIncident) {
  return (await requestJson<{ incident: HSEIncident }>("/api/hse/incidents", { method: "POST", body: JSON.stringify(incident) })).incident;
}

export async function updateIncident(id: string, patch: Partial<HSEIncident>) {
  return (
    await requestJson<{ incident: HSEIncident }>(`/api/hse/incidents/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) })
  ).incident;
}

export async function deleteIncident(id: string) {
  await requestJson<{ ok: boolean }>(`/api/hse/incidents/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listInspections() {
  return (await requestJson<{ inspections: HSEInspection[] }>("/api/hse/inspections")).inspections;
}

export async function createInspection(inspection: HSEInspection) {
  return (await requestJson<{ inspection: HSEInspection }>("/api/hse/inspections", { method: "POST", body: JSON.stringify(inspection) }))
    .inspection;
}

export async function updateInspection(id: string, patch: Partial<HSEInspection>) {
  return (
    await requestJson<{ inspection: HSEInspection }>(`/api/hse/inspections/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    })
  ).inspection;
}

export async function deleteInspection(id: string) {
  await requestJson<{ ok: boolean }>(`/api/hse/inspections/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listActions() {
  return (await requestJson<{ actions: HSEAction[] }>("/api/hse/actions")).actions;
}

export async function createAction(action: HSEAction) {
  return (await requestJson<{ action: HSEAction }>("/api/hse/actions", { method: "POST", body: JSON.stringify(action) })).action;
}

export async function updateAction(id: string, patch: Partial<HSEAction>) {
  return (
    await requestJson<{ action: HSEAction }>(`/api/hse/actions/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) })
  ).action;
}

export async function deleteAction(id: string) {
  await requestJson<{ ok: boolean }>(`/api/hse/actions/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Audit ---

export interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  matricule: string;
  createdAt: string;
  diff: Record<string, unknown>;
}

export async function listAuditEntries(entityType: string, entityId: string) {
  return (
    await requestJson<{ entries: AuditEntry[] }>(`/api/audit?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`)
  ).entries;
}

export async function listMaintenance() {
  return (await requestJson<{ interventions: MaintenanceIntervention[] }>("/api/maintenance")).interventions;
}

export async function createMaintenance(intervention: MaintenanceIntervention) {
  return (await requestJson<{ intervention: MaintenanceIntervention }>("/api/maintenance", { method: "POST", body: JSON.stringify(intervention) }))
    .intervention;
}

export async function updateMaintenance(id: string, patch: Partial<MaintenanceIntervention>) {
  return (
    await requestJson<{ intervention: MaintenanceIntervention }>(`/api/maintenance/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    })
  ).intervention;
}

export async function deleteMaintenance(id: string) {
  await requestJson<{ ok: boolean }>(`/api/maintenance/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Chatbot IA (Claude, si configuré côté serveur) — `configured: false` si ANTHROPIC_API_KEY absente,
 * auquel cas `reply` contient déjà un message explicatif prêt à afficher. */
export async function chatWithAssistant(messages: ChatMessage[]): Promise<{ reply: string; configured: boolean }> {
  return requestJson<{ reply: string; configured: boolean }>("/api/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ messages })
  });
}

// --- Schéma de manutention ---

export async function getEquipmentStatus(): Promise<Record<string, "Actif" | "En attente">> {
  return (await requestJson<{ equipment: Record<string, "Actif" | "En attente"> }>("/api/equipment-status")).equipment;
}
