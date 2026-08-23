// Chatbot IA — appelle l'API Anthropic (Claude) directement en `fetch`, sans SDK, dans l'esprit
// "pas de framework" du reste du serveur. Complète l'Assistant local (réponses par mots-clés,
// src/components/assistant/assistantRules.ts) par un vrai assistant conversationnel, à qui on donne
// le contexte des données réelles de la journée (trains, navires, stock, HSE, arrêts) dans le prompt
// système pour qu'il puisse répondre sur l'état actuel de l'exploitation, pas seulement discuter.

import { listTrains } from "./trainRepository.js";
import { listNavires } from "./navireRepository.js";
import { computeSnapshotForDay } from "./stockCalculationService.js";
import { listIncidents, listActions } from "./hseRepository.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

function getCurrentOperationalDay() {
  const now = new Date();
  const day = now.getHours() < 7 ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now;
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

async function buildSystemPrompt() {
  const today = getCurrentOperationalDay();
  const [trains, navires, snapshot, incidents, actions] = await Promise.all([
    listTrains(),
    listNavires(),
    computeSnapshotForDay(today).catch(() => null),
    listIncidents(),
    listActions()
  ]);

  const trainsDuJour = trains.filter((t) => t.dateArriveePrevue === today);
  const naviresEnCours = navires.filter((n) => n.statut === "En rade" || n.statut === "Accosté" || n.statut === "En chargement");
  const cellulesCritiques = (snapshot?.cellules ?? []).filter((c) => c.capaciteTotale > 0 && c.tonnageMort / c.capaciteTotale >= 0.6);
  const incidentsOuverts = incidents.filter((i) => i.statut !== "Clôturé");
  const actionsEnRetard = actions.filter((a) => a.statut !== "Fait" && a.echeance && a.echeance < today);

  return `Tu es l'assistant intégré à l'application OCP Stock, un outil de suivi des opérations portuaires (déchargement de trains de phosphate, chargement de navires, gestion des stocks, HSE) pour un port au Maroc.
Réponds en français, de façon concise et factuelle, en te basant uniquement sur les données ci-dessous et tes connaissances générales du domaine minier/portuaire. Si une question porte sur une donnée que tu n'as pas, dis-le clairement plutôt que d'inventer un chiffre.

Journée d'exploitation en cours : ${today}

Trains prévus aujourd'hui : ${trainsDuJour.length} (${trainsDuJour.map((t) => `n°${t.numeroTrain} · ${t.statut}`).join(", ") || "aucun"})
Navires en cours (rade/accosté/chargement) : ${naviresEnCours.length} (${naviresEnCours.map((n) => `${n.nom} · ${n.statut}`).join(", ") || "aucun"})
Cellules en stock mort critique (≥60% capacité) : ${cellulesCritiques.length} (${cellulesCritiques.map((c) => c.celluleId).join(", ") || "aucune"})
Incidents HSE ouverts : ${incidentsOuverts.length}
Actions correctives HSE en retard : ${actionsEnRetard.length}`;
}

export async function chatWithAssistant(messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      reply:
        "Le chatbot IA n'est pas configuré : définissez ANTHROPIC_API_KEY dans un fichier .env à la racine du projet (voir .env.example), puis redémarrez le serveur (npm run api). En attendant, l'Assistant local reste disponible.",
      configured: false
    };
  }

  const system = await buildSystemPrompt();

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content }))
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    const error = new Error(`Anthropic API a répondu ${response.status} : ${errorBody.slice(0, 300)}`);
    error.status = 502;
    throw error;
  }

  const payload = await response.json();
  const reply = payload.content?.find((block) => block.type === "text")?.text ?? "";
  return { reply, configured: true };
}
