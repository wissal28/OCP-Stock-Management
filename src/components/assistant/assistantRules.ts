// Règles de l'Assistant IA — un assistant LOCAL basé sur les données réelles de l'app (pas une IA
// générative connectée à un service externe : aucune clé API, aucun coût, réponses déterministes).
// Reconnaît une liste fermée d'intentions par mots-clés et calcule la réponse à partir des mêmes
// fonctions que les autres modules (aucune logique dupliquée) — un "raccourci vocal" vers ce que
// Dashboard/Bilan des arrêts/HSE affichent déjà, pas un chatbot conversationnel général.

import type { Train } from "../train/trainData";
import { getCurrentOperationalDay, getOperationalDay } from "../train/trainRules";
import type { Navire } from "../navire/navireData";
import { getNaviresEnCours } from "../navire/navireRules";
import type { CelluleStock } from "../stock/stockData";
import { isMortCritique } from "../stock/stockRules";
import type { HSEIncident, HSEAction } from "../hse/hseData";
import { incidentsOuverts, actionsEnRetard } from "../hse/hseRules";
import type { ArretNavire } from "../navire/navireData";
import type { ArretTrain } from "../train/trainData";
import { buildBilanBlock, combineBilanBlocks, currentYearMonth, daysInMonth, formatPct } from "../arrets/arretsBilanRules";

export interface AssistantData {
  trains: Train[];
  navires: Navire[];
  cellules: CelluleStock[];
  incidents: HSEIncident[];
  actions: HSEAction[];
  arretsNavire: ArretNavire[];
  arretsTrain: ArretTrain[];
}

export interface AssistantAnswer {
  text: string;
  view?: string;
}

const SUGGESTIONS = [
  "Trains aujourd'hui",
  "Navires en chargement",
  "Trains en retard",
  "Cellules à déboucher",
  "TRS ce mois-ci",
  "Arrêts en cours",
  "Incidents HSE ouverts"
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

export function answerQuestion(question: string, data: AssistantData): AssistantAnswer {
  const q = normalize(question);

  if (!q.trim()) {
    return { text: `Posez une question, par exemple : ${SUGGESTIONS[0]}, ${SUGGESTIONS[1]}...` };
  }

  if (includesAny(q, ["train"]) && includesAny(q, ["retard"])) {
    const enRetard = data.trains.filter((t) => t.statut === "En retard");
    if (enRetard.length === 0) return { text: "Aucun train en retard actuellement." };
    return {
      text: `${enRetard.length} train(s) en retard : ${enRetard.map((t) => `n°${t.numeroTrain}`).join(", ")}.`,
      view: "train"
    };
  }

  if (includesAny(q, ["train"])) {
    const today = getCurrentOperationalDay();
    const trainsDuJour = data.trains.filter((t) => getOperationalDay(t.dateArriveePrevue, t.heureArriveeReelle || t.heureArriveePrevue) === today);
    if (trainsDuJour.length === 0) return { text: "Aucun train prévu sur la journée d'exploitation en cours.", view: "train" };
    const tonnage = trainsDuJour.reduce((s, t) => s + t.tonnageBascule, 0);
    return {
      text: `${trainsDuJour.length} train(s) sur la journée en cours, pour ${tonnage.toLocaleString("fr-FR")} t (bascule).`,
      view: "train"
    };
  }

  if (includesAny(q, ["navire", "bateau"])) {
    const enCours = getNaviresEnCours(data.navires);
    if (enCours.length === 0) return { text: "Aucun navire en rade, accosté ou en chargement actuellement.", view: "navires" };
    return {
      text: `${enCours.length} navire(s) en cours : ${enCours.map((n) => `${n.nom} (${n.statut})`).join(", ")}.`,
      view: "navires"
    };
  }

  if (includesAny(q, ["stock", "cellule"]) && includesAny(q, ["critique", "debouch", "mort"])) {
    const critiques = data.cellules.filter((c) => isMortCritique(c.tonnageMort, c.capaciteTotale));
    if (critiques.length === 0) return { text: "Aucune cellule en stock mort critique (≥ 60%).", view: "stock" };
    return {
      text: `${critiques.length} cellule(s) à déboucher : ${critiques.map((c) => c.celluleId).join(", ")}.`,
      view: "stock"
    };
  }

  if (includesAny(q, ["stock", "cellule"])) {
    const totalVif = data.cellules.reduce((s, c) => s + c.tonnageVif, 0);
    const libres = data.cellules.filter((c) => c.tonnageVif === 0).length;
    return { text: `Stock vif total : ${totalVif.toLocaleString("fr-FR")} t. ${libres} cellule(s) libre(s).`, view: "stock" };
  }

  if (includesAny(q, ["trs", "rendement", "synthetique"])) {
    const month = currentYearMonth();
    const periodeMinutes = daysInMonth(month) * 24 * 60;
    const navireMonth = data.arretsNavire.filter((a) => a.dateDebut.startsWith(month));
    const trainMonth = data.arretsTrain.filter((a) => a.dateDebut.startsWith(month));
    const chargement = buildBilanBlock(
      "chargement",
      ["CA30", "CB30", "CC30", "CD30"].map((p) => ({ label: p, arrets: navireMonth.filter((a) => a.portique === p) })),
      periodeMinutes
    );
    const dechargement = buildBilanBlock(
      "dechargement",
      ["DA10", "DB10"].map((axe) => ({ label: axe, arrets: trainMonth.filter((a) => a.axe === axe) })),
      periodeMinutes
    );
    const total = combineBilanBlocks("total", [chargement, dechargement]);
    if (total.total.trsGlobal === null) return { text: "Pas assez de données ce mois-ci pour calculer le TRS.", view: "bilan-arrets" };
    return { text: `TRS Global combiné ce mois-ci : ${formatPct(total.total.trsGlobal)}.`, view: "bilan-arrets" };
  }

  if (includesAny(q, ["arret"]) && includesAny(q, ["cours", "en cours"])) {
    const ongoingNavire = data.arretsNavire.filter((a) => !a.heureFin).length;
    const ongoingTrain = data.arretsTrain.filter((a) => !a.heureFin).length;
    const total = ongoingNavire + ongoingTrain;
    if (total === 0) return { text: "Aucun arrêt en cours actuellement." };
    return { text: `${total} arrêt(s) en cours : ${ongoingNavire} côté navires, ${ongoingTrain} côté trains.`, view: "bilan-arrets" };
  }

  if (includesAny(q, ["incident", "accident", "hse"])) {
    const ouverts = incidentsOuverts(data.incidents);
    const retard = actionsEnRetard(data.actions);
    if (ouverts.length === 0 && retard.length === 0) return { text: "Aucun incident ouvert, aucune action en retard.", view: "hse" };
    return {
      text: `${ouverts.length} incident(s) ouvert(s), ${retard.length} action(s) corrective(s) en retard.`,
      view: "hse"
    };
  }

  return {
    text: `Je ne sais pas encore répondre à ça. Essayez : ${SUGGESTIONS.join(" · ")}.`
  };
}

export { SUGGESTIONS };
