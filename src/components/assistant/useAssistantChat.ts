import { useState } from "react";
import { answerQuestion, SUGGESTIONS } from "./assistantRules";
import { readStockSnapshots, resolveTodaySnapshot } from "../stock/stockRules";
import * as api from "../../api";

export type AssistantMode = "local" | "chatbot";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  view?: string;
}

const WELCOME_LOCAL: AssistantMessage = {
  id: "welcome-local",
  role: "assistant",
  text: "Bonjour — je réponds à des questions simples sur l'état actuel d'OCP Stock (trains, navires, stock, TRS, HSE). Que voulez-vous savoir ?"
};

const WELCOME_CHATBOT: AssistantMessage = {
  id: "welcome-chatbot",
  role: "assistant",
  text: "Bonjour — je suis le chatbot IA, connecté à un modèle Claude avec le contexte des opérations du jour. Posez-moi une question, même formulée librement."
};

/**
 * Logique partagée des deux surfaces de l'Assistant IA (page complète et bulle flottante) : mode
 * local/chatbot, historiques de conversation séparés par mode, envoi de question. Extrait de
 * AssistantIA.tsx pour que la bulle flottante (accessible depuis n'importe quelle page, "à chaque
 * instant") réutilise exactement le même comportement sans dupliquer la logique.
 */
export function useAssistantChat() {
  const [mode, setMode] = useState<AssistantMode>("local");
  const [localMessages, setLocalMessages] = useState<AssistantMessage[]>([WELCOME_LOCAL]);
  const [chatMessages, setChatMessages] = useState<AssistantMessage[]>([WELCOME_CHATBOT]);
  const [sending, setSending] = useState(false);

  const messages = mode === "local" ? localMessages : chatMessages;

  async function handleAskLocal(question: string) {
    setLocalMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: question }]);
    try {
      const [snapshots, navires, incidents, actions, trains, arretsNavire, arretsTrain] = await Promise.all([
        readStockSnapshots(),
        api.listNavires(),
        api.listIncidents(),
        api.listActions(),
        api.listTrains(),
        api.listArrets(),
        api.listArretsTrain()
      ]);
      const { snapshot } = resolveTodaySnapshot(snapshots);
      const answer = answerQuestion(question, {
        trains,
        navires,
        cellules: snapshot.cellules,
        incidents,
        actions,
        arretsNavire,
        arretsTrain
      });
      setLocalMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", text: answer.text, view: answer.view }]);
    } catch {
      setLocalMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: "Impossible de récupérer les données en ce moment — réessayez dans un instant." }
      ]);
    }
  }

  async function handleAskChatbot(question: string) {
    const history = [...chatMessages, { id: `u-${Date.now()}`, role: "user" as const, text: question }];
    setChatMessages(history);
    setSending(true);
    try {
      const conversation = history.filter((m) => m.id !== "welcome-chatbot").map((m) => ({ role: m.role, content: m.text }));
      const result = await api.chatWithAssistant(conversation);
      setChatMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", text: result.reply }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: "Le chatbot est indisponible pour le moment — réessayez dans un instant." }
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleAsk(question: string) {
    if (!question.trim() || sending) return;
    if (mode === "local") handleAskLocal(question);
    else handleAskChatbot(question);
  }

  return { mode, setMode, messages, sending, handleAsk, SUGGESTIONS };
}
