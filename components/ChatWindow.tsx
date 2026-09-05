import { useState, useEffect, useRef } from "react";
import { ArrowUp, Lock, Sparkles } from "lucide-react";
import axios from "axios";
import DoctorAvatar from "./DoctorAvatar";
import { clinic } from "../config/clinic";

interface ChatWindowProps {
  userProfile: any;
  onMessageCount: (count: number) => void;
  offerUnlocked: boolean;
  onReopenOffer: () => void;
}

interface Message {
  role: "doctor" | "user";
  content: string;
}

export default function ChatWindow({
  userProfile,
  onMessageCount,
  offerUnlocked,
  onReopenOffer,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        role: "doctor",
        content: `Olá, ${userProfile?.name}! Sou a ${clinic.doctor.name}, ${clinic.doctor.title.toLowerCase()} aqui da ${clinic.name}.

Vi que você convive com ${userProfile?.issues} há ${userProfile?.duration}. Sei o quanto isso incomoda, e quero entender melhor o seu caso antes de indicar qualquer coisa.

Me conta: o que mais te incomoda no dia a dia?`,
      },
    ]);
  }, [userProfile]);

  // Rola apenas o painel de mensagens — scrollIntoView puxaria a página inteira.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const { data } = await axios.post("/api/chat", {
        message: text,
        userProfile,
        messageCount: sentCount,
      });

      setMessages((prev) => [...prev, { role: "doctor", content: data.message }]);

      const next = sentCount + 1;
      setSentCount(next);
      onMessageCount(next);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "doctor",
          content:
            "Desculpe, tive uma instabilidade aqui. Pode repetir, por favor?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up overflow-hidden rounded-card border border-line bg-surface shadow-soft">
      <div className="flex items-center gap-4 border-b border-line bg-cream/60 px-6 py-5">
        <span className="relative">
          <DoctorAvatar size={54} />
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-cream bg-emerald-500" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl leading-tight text-ink">
            {clinic.doctor.name}
          </p>
          <p className="text-sm text-muted">
            {clinic.doctor.title}
            {clinic.doctor.crm && ` · ${clinic.doctor.crm}`}
          </p>
        </div>
        <span className="ml-auto hidden text-xs text-muted sm:block">online agora</span>
      </div>

      {offerUnlocked && (
        <button
          onClick={onReopenOffer}
          className="animate-fade-in flex w-full items-center justify-center gap-2
                     border-b border-gold/30 bg-gold-soft/50 px-5 py-3 text-sm
                     font-medium text-ink transition-colors hover:bg-gold-soft"
        >
          <Sparkles size={15} className="text-gold" />
          Sua condição especial está reservada — rever
        </button>
      )}

      <div ref={scrollRef} className="h-[26rem] overflow-y-auto px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-5">
          {messages.map((msg, i) =>
            msg.role === "doctor" ? (
              <div key={i} className="animate-slide-right flex items-end gap-3">
                <DoctorAvatar size={32} ring={false} />
                <div className="max-w-[82%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-line bg-cream/70 px-4 py-3 leading-relaxed text-ink">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div key={i} className="animate-slide-left flex justify-end">
                <div className="max-w-[82%] whitespace-pre-line rounded-2xl rounded-br-sm bg-rose px-4 py-3 leading-relaxed text-white">
                  {msg.content}
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="animate-fade-in flex items-end gap-3">
              <DoctorAvatar size={32} ring={false} />
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-line bg-cream/70 px-4 py-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="typing-dot h-1.5 w-1.5 rounded-full bg-rose"
                    style={{ animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-line bg-cream/40 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escreva sua mensagem..."
            disabled={loading}
            aria-label="Mensagem para a doutora"
            className="field flex-1 disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Enviar mensagem"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-lg
                       bg-rose text-white transition-all duration-300
                       hover:bg-rose-deep hover:shadow-lift
                       disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-rose
                       disabled:hover:shadow-none"
          >
            <ArrowUp size={20} />
          </button>
        </div>
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
          <Lock size={12} className="text-gold" />
          Conversa privada e protegida
        </p>
      </div>
    </div>
  );
}
