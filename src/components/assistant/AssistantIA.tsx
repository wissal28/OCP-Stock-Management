import { useEffect, useRef } from "react";
import { Bot, Info, MessageCircleMore, MessageSquare, Send, User, Zap } from "lucide-react";
import { useAssistantChat } from "./useAssistantChat";

const bubbleBase = "max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-6";

/**
 * Assistant IA — deux modes :
 * - "Assistant local" : réponses instantanées calculées depuis les données réelles de l'app, sans IA
 *   générative externe (ni clé API, ni coût, ni latence réseau).
 * - "Chatbot IA" : vrai assistant conversationnel (API Anthropic côté serveur, voir
 *   server/assistantChatService.js), qui reçoit un résumé des données du jour en contexte. Nécessite
 *   ANTHROPIC_API_KEY dans .env — sinon le serveur répond avec un message explicatif plutôt qu'une erreur.
 * Aussi disponible en bulle flottante (FloatingChatWidget) sur n'importe quelle page — cette page
 * complète et la bulle partagent la même logique via useAssistantChat.
 */
export default function AssistantIA({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { mode, setMode, messages, sending, handleAsk, SUGGESTIONS } = useAssistantChat();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function submit(question: string) {
    handleAsk(question);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Module métier</p>
        <h1 className="font-display mt-1 text-2xl font-medium text-[#102b20]">Assistant IA</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#6c7c71]">Deux modes : réponses instantanées sur vos données, ou un vrai chatbot conversationnel.</p>
      </div>

      <div className="flex gap-2 rounded-lg border border-[#dfe6d7] bg-white/80 p-1.5">
        <button
          type="button"
          onClick={() => setMode("local")}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
            mode === "local" ? "bg-[#e8f4ed] text-[#0d6b4d]" : "text-[#5e7166] hover:bg-[#f3f8ef]"
          }`}
        >
          <Zap size={15} aria-hidden="true" />
          Assistant local
        </button>
        <button
          type="button"
          onClick={() => setMode("chatbot")}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
            mode === "chatbot" ? "bg-[#e8f4ed] text-[#0d6b4d]" : "text-[#5e7166] hover:bg-[#f3f8ef]"
          }`}
        >
          <MessageSquare size={15} aria-hidden="true" />
          Chatbot IA
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-[#bfdcef] bg-[#e7f2fa] px-3.5 py-2.5 text-xs font-semibold text-[#1d6fa5]">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        {mode === "local" ? (
          <span>
            Réponses calculées en direct depuis les modules Train, Navire, Stock, HSE et Bilan des arrêts — aucune donnée envoyée à un
            service externe, instantané et gratuit.
          </span>
        ) : (
          <span>
            Modèle Claude, exécuté côté serveur avec le contexte des opérations du jour en résumé. Nécessite ANTHROPIC_API_KEY dans
            .env — sinon un message vous l'indiquera au lieu d'une réponse.
          </span>
        )}
      </div>

      <div className="rounded-lg border border-[#dfe6d7] bg-white/90 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
        <div ref={scrollRef} className="flex max-h-[520px] min-h-[320px] flex-col gap-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse self-end" : ""}`}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user" ? "bg-[#e8f4ed] text-[#0d6b4d]" : "bg-[#0d6b4d] text-white"
                }`}
              >
                {m.role === "user" ? <User size={14} aria-hidden="true" /> : <Bot size={14} aria-hidden="true" />}
              </span>
              <div className="flex flex-col gap-1.5">
                <div className={`${bubbleBase} ${m.role === "user" ? "bg-[#e8f4ed] text-[#102b20]" : "bg-[#f6f9f2] text-[#314238]"}`}>{m.text}</div>
                {m.view && (
                  <button
                    type="button"
                    onClick={() => onNavigate(m.view!)}
                    className="self-start text-[11px] font-bold text-[#0d6b4d] hover:underline"
                  >
                    Voir le module →
                  </button>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d6b4d] text-white">
                <Bot size={14} aria-hidden="true" />
              </span>
              <div className={`${bubbleBase} bg-[#f6f9f2] text-[#829187]`}>
                <MessageCircleMore size={16} className="animate-pulse" aria-hidden="true" />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-[#eef1ea] px-4 py-2.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              disabled={sending}
              className="rounded-full border border-[#dfe6d7] bg-white px-2.5 py-1 text-[11px] font-bold text-[#5e7166] transition hover:border-[#0d6b4d] hover:text-[#0d6b4d] disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(inputRef.current?.value ?? "");
          }}
          className="flex items-center gap-2 border-t border-[#eef1ea] p-3"
        >
          <input
            ref={inputRef}
            placeholder={mode === "local" ? "Posez une question sur l'état actuel de l'app..." : "Posez une question au chatbot..."}
            disabled={sending}
            className="h-11 flex-1 rounded-md border border-[#dfe6d7] bg-white px-3.5 text-sm font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md bg-[#0d6b4d] text-white transition hover:bg-[#0a563d] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Envoyer"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
