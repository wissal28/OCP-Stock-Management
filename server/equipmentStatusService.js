// Statut "live" par code d'équipement (schéma de manutention) : Actif si l'équipement est référencé
// par une opération de déchargement/chargement en cours aujourd'hui (heure de début renseignée, heure
// de fin encore vide), En attente sinon. Vient uniquement surcharger le statut statique de
// src/components/module2/synoptiqueManutentionData.ts — aucune donnée nouvelle stockée.

import { db } from "./db.js";

function getCurrentOperationalDay() {
  const now = new Date();
  const day = now.getHours() < 7 ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now;
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

export async function getEquipmentLiveStatus() {
  const today = getCurrentOperationalDay();
  const result = {};

  const dechargementsResult = await db.execute({ sql: "SELECT * FROM dechargements WHERE date = @date", args: { date: today } });
  for (const d of dechargementsResult.rows) {
    const inProgress = Boolean(d.debutDechargement) && !d.finDechargement;
    for (const family of ["da", "db", "silos"]) {
      let lines;
      try {
        lines = JSON.parse(d[family] || "[]");
      } catch {
        continue;
      }
      for (const line of lines) {
        for (const code of line.destinations ?? []) {
          result[code] = inProgress ? "Actif" : "En attente";
        }
      }
    }
  }

  const chargementsResult = await db.execute({
    sql: "SELECT * FROM chargements_portique WHERE dateDebutAffect = @date",
    args: { date: today }
  });
  for (const c of chargementsResult.rows) {
    const inProgress = Boolean(c.heureDebutAffect) && !c.heureFinAffect;
    if (c.repriseOuDirection && c.repriseOuDirection !== "SILOS" && c.repriseOuDirection !== "DIRECT") {
      result[c.repriseOuDirection] = inProgress ? "Actif" : "En attente";
    }
    if (c.portique) result[c.portique] = inProgress ? "Actif" : "En attente";
  }

  return result;
}
