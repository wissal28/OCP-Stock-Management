import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircleMore, MessageSquare, Send, User, X, Zap } from "lucide-react";
import { useAssistantChat } from "./useAssistantChat";

const bubbleBase = "max-w-[82%] rounded-lg px-3 py-2 text-xs leading-5";

/**
 * Bulle de discussion flottante, visible sur toutes les pages (montée une seule fois dans
 * UserPage.tsx) — permet de lancer une discussion avec l'Assistant IA à tout moment sans quitter
 * l'écran en cours, plutôt que d'obliger à naviguer vers le module "Assistant IA". Réutilise
 * useAssistantChat, donc les deux modes (local/chatbot) sont disponibles ici aussi ; conversation
 * indépendante de celle de la page complète (pas de synchronisation d'état entre les deux surfaces).
 */
export default function FloatingChatWidget({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [open, setOpen] = useState(false);
  const { mode, setMode, messages, sending, handleAsk } = useAssistantChat();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function submit(question: string) {
    handleAsk(question);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[480px] w-[340px] flex-col overflow-hidden rounded-lg border border-[#dfe6d7] bg-white shadow-[0_24px_60px_rgba(16,43,32,0.22)]">
          <div className="flex items-center justify-between gap-2 border-b border-[#eef1ea] bg-[#f6f9f2] px-3.5 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0d6b4d] text-white">
                <MessageSquare size={13} aria-hidden="true" />
              </span>
              <p className="text-xs font-black text-[#102b20]">Assistant IA</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMode("local")}
                title="Assistant local"
                className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition ${
                  mode === "local" ? "bg-[#e8f4ed] text-[#0d6b4d]" : "text-[#829187] hover:bg-[#eef1ea]"
                }`}
              >
                <Zap size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setMode("chatbot")}
                title="Chatbot IA"
                className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition ${
                  mode === "chatbot" ? "bg-[#e8f4ed] text-[#0d6b4d]" : "text-[#829187] hover:bg-[#eef1ea]"
                }`}
              >
                <MessageSquare size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#829187] transition hover:bg-[#eef1ea] hover:text-[#0d6b4d]"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex items-start gap-1.5 ${m.role === "user" ? "flex-row-reverse self-end" : ""}`}>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    m.role === "user" ? "bg-[#e8f4ed] text-[#0d6b4d]" : "bg-[#0d6b4d] text-white"
                  }`}
                >
                  {m.role === "user" ? <User size={11} aria-hidden="true" /> : <Bot size={11} aria-hidden="true" />}
                </span>
                <div className="flex flex-col gap-1">
                  <div className={`${bubbleBase} ${m.role === "user" ? "bg-[#e8f4ed] text-[#102b20]" : "bg-[#f6f9f2] text-[#314238]"}`}>{m.text}</div>
                  {m.view && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate(m.view!);
                        setOpen(false);
                      }}
                      className="self-start text-[10px] font-bold text-[#0d6b4d] hover:underline"
                    >
                      Voir le module →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-1.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0d6b4d] text-white">
                  <Bot size={11} aria-hidden="true" />
                </span>
                <div className={`${bubbleBase} bg-[#f6f9f2] text-[#829187]`}>
                  <MessageCircleMore size={14} className="animate-pulse" aria-hidden="true" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(inputRef.current?.value ?? "");
            }}
            className="flex items-center gap-1.5 border-t border-[#eef1ea] p-2.5"
          >
            <input
              ref={inputRef}
              placeholder="Posez une question..."
              disabled={sending}
              className="h-9 flex-1 rounded-md border border-[#dfe6d7] bg-white px-2.5 text-xs font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-[#0d6b4d] text-white transition hover:bg-[#0a563d] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Envoyer"
            >
              <Send size={14} aria-hidden="true" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant IA"}
        title="Assistant IA — discutez à tout moment"
        className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#0d6b4d] text-white shadow-[0_16px_32px_rgba(13,107,77,0.35)] transition hover:scale-105 hover:bg-[#0a563d]"
      >
        {open ? <X size={22} aria-hidden="true" /> : <MessageSquare size={22} aria-hidden="true" />}
      </button>
    </div>
  );
}
