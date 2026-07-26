import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAiMessages, sendAdvisorMessage } from "@/hooks/useAiMessages";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const timeFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export function AIAdvisorChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages = [] } = useAiMessages();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSend = async () => {
    const message = input.trim();
    if (!message || sending) return;

    setInput("");
    setSending(true);
    setError(null);

    try {
      await sendAdvisorMessage(message);
      queryClient.invalidateQueries({ queryKey: ["ai-messages", user?.id] });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))", color: "white" }}
          >
            ✨
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Iwadu</h2>
            <p className="text-xs text-muted-foreground mt-0.5">En ligne</p>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            Posez une question sur vos finances pour commencer la conversation.
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex" style={{ justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "65%" }}>
              <div
                className="px-4 py-3 rounded-lg"
                style={{
                  background: msg.role === "user" ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" : "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)",
                  color: msg.role === "user" ? "white" : "var(--color-ink)",
                  border: msg.role === "assistant" ? "1px solid rgba(0,0,0,0.08)" : "none",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                }}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
              <p
                className="text-xs mt-1.5"
                style={{ color: "rgba(0,0,0,0.5)", textAlign: msg.role === "user" ? "right" : "left" }}
              >
                {timeFormatter.format(new Date(msg.createdAt))}
              </p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 rounded-lg text-sm text-muted-foreground"
              style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              Le conseiller réfléchit…
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        {error && <p className="text-xs text-danger mb-2">{error}</p>}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Posez une question..."
            disabled={sending}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "14px", color: "var(--color-ink)" }}
          />
          <button
            onClick={onSend}
            disabled={sending || !input.trim()}
            className="flex-shrink-0 p-2 rounded-lg disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))", color: "white" }}
          >
            <Icon i="send" size={16} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          L'IA peut faire des erreurs. Vérifiez les informations importantes.
        </p>
      </div>
    </div>
  );
}
