// Rollover quotidien du stock à 07h00 : crée automatiquement le snapshot de la nouvelle journée
// d'exploitation en appliquant les mouvements réels, remplaçant la création manuelle du bordereau
// papier chaque matin. Aucune dépendance ajoutée (pas de package cron) — le serveur est déjà un
// processus Node long-running (http.createServer(...).listen()), donc un simple setTimeout/setInterval
// suffit.

import { backfillStockSnapshots, computeSnapshotForDay } from "./stockCalculationService.js";
import { getSnapshotByDate, upsertSnapshot } from "./stockRepository.js";

const DAY_START_HOUR = 7;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getCurrentOperationalDayServer() {
  const now = new Date();
  const hour = now.getHours();
  const day = hour < DAY_START_HOUR ? new Date(now.getTime() - ONE_DAY_MS) : now;
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

function msUntilNext7am() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(DAY_START_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** Idempotent : ne crée rien si un snapshot existe déjà pour la journée d'exploitation en cours —
 * couvre à la fois le redémarrage du serveur après 07h00 (rattrapage) et un double déclenchement.
 *
 * Avant de traiter la journée en cours, rattrape aussi toute journée antérieure ayant eu de
 * l'activité (train/navire) mais restée sans snapshot — ex. le serveur était arrêté pendant
 * plusieurs jours. Sans ça, un redémarrage après une coupure de plusieurs jours ne créait que le
 * snapshot du jour du redémarrage, laissant les jours manqués entre les deux sans état de stock
 * (visible seulement via un clic manuel sur "Compléter l'historique"). */
async function runRollover() {
  const { created } = await backfillStockSnapshots("system");
  if (created.length > 0) {
    console.log(`[rollover] Rattrapage : snapshot(s) créé(s) pour ${created.join(", ")}.`);
  }

  const day = getCurrentOperationalDayServer();
  const existing = await getSnapshotByDate(day);
  if (existing) return;
  const computed = await computeSnapshotForDay(day);
  await upsertSnapshot(computed, "system");
  console.log(`[rollover] Nouveau snapshot ${day} créé automatiquement à 07h00.`);
}

export function scheduleStockRollover() {
  runRollover().catch((error) => console.error("[rollover] échec au démarrage", error));
  setTimeout(function tick() {
    runRollover().catch((error) => console.error("[rollover] échec", error));
    setInterval(() => runRollover().catch((error) => console.error("[rollover] échec", error)), ONE_DAY_MS);
  }, msUntilNext7am());
}
