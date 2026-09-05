import { useState, useEffect, useRef } from "react";
import { ArrowUp, Lock } from "lucide-react";
import axios from "axios";
import DoctorAvatar from "./DoctorAvatar";
import InlineOffer from "./InlineOffer";
import ProofCarousel from "./ProofCarousel";
import { clinic } from "../config/clinic";

interface ChatWindowProps {
  userProfile: any;
  onAccept: () => void;
}

type Message =
  | { kind: "doctor"; content: string }
  | { kind: "user"; content: string }
  | { kind: "proof" }
  | { kind: "offer" };

const MESSAGES_BEFORE_OFFER = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const hasProof = clinic.socialProof.images.length > 0;

const closingMessage = `Ótimo. Deixa eu te explicar como o ${clinic.name} funciona.

Não é sessão em clínica: é um método que você faz em casa, uma rotina diária com cuidados dermatológicos que quase ninguém conhece. Eu te acompanho durante o processo.${
  hasProof
    ? `\n\n${clinic.socialProof.intro || "Aproveitando, olha alguns resultados que acabei de receber:"}`
    : ""
}`;

export default function ChatWindow({ userProfile, onAccept }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [closed, setClosed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const offerShown = useRef(false);

  useEffect(() => {
    setMessages([
      {
        kind: "doctor",
        content: `Oi, ${userProfile?.name}! Sou a ${clinic.doctor.name}, ${clinic.doctor.title.toLowerCase()} da ${clinic.name}.

Vi aqui: ${userProfile?.issues}, há ${userProfile?.duration}. O que mais te incomoda no dia a dia?`,
      },
    ]);
  }, [userProfile]);

  // Rola apenas o painel de mensagens — scrollIntoView puxaria a página inteira.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // A oferta entra como a última fala da doutora, com as pausas de quem
  // está digitando. Fica no envio, e não num efeito: um efeito que depende
  // de `loading` e chama `setLoading` cancela os próprios timers na limpeza.
  const runClosingSequence = async () => {
    offerShown.current = true;
    setClosed(true);

    await sleep(1200);
    setLoading(true);
    await sleep(1700);
    setLoading(false);

    setMessages((prev) => [
      ...prev,
      { kind: "doctor", content: closingMessage },
      ...(hasProof ? [{ kind: "proof" } as Message] : []),
    ]);

    await sleep(1500);
    setMessages((prev) => [...prev, { kind: "offer" }]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || closed) return;

    setInput("");
    setMessages((prev) => [...prev, { kind: "user", content: text }]);
    setLoading(true);

    // Sem o histórico, cada resposta sai desconectada do que ela contou.
    const history = messages
      .filter((m): m is Extract<Message, { content: string }> =>
        m.kind === "doctor" || m.kind === "user"
      )
      .map((m) => ({
        role: m.kind === "doctor" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));

    let answered = false;
    try {
      const { data } = await axios.post("/api/chat", {
        message: text,
        userProfile,
        messageCount: sentCount,
        history,
      });
      setMessages((prev) => [...prev, { kind: "doctor", content: data.message }]);
      answered = true;
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          kind: "doctor",
          content: "Desculpe, tive uma instabilidade aqui. Pode repetir, por favor?",
        },
      ]);
    } finally {
      setLoading(false);
    }

    if (!answered) return;

    const next = sentCount + 1;
    setSentCount(next);

    if (next >= MESSAGES_BEFORE_OFFER && !offerShown.current) {
      await runClosingSequence();
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

      <div ref={scrollRef} className="h-[28rem] overflow-y-auto px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-5">
          {messages.map((msg, i) => {
            if (msg.kind === "user") {
              return (
                <div key={i} className="animate-slide-left flex justify-end">
                  <div className="max-w-[82%] whitespace-pre-line rounded-2xl rounded-br-sm bg-rose px-4 py-3 leading-relaxed text-white">
                    {msg.content}
                  </div>
                </div>
              );
            }

            if (msg.kind === "doctor") {
              return (
                <div key={i} className="animate-slide-right flex items-end gap-3">
                  <DoctorAvatar size={32} ring={false} />
                  <div className="max-w-[82%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-line bg-cream/70 px-4 py-3 leading-relaxed text-ink">
                    {msg.content}
                  </div>
                </div>
              );
            }

            if (msg.kind === "proof") {
              return (
                <div key={i} className="animate-slide-right flex items-end gap-3">
                  <span className="w-8 shrink-0" />
                  <div className="w-full max-w-[82%]">
                    <ProofCarousel images={clinic.socialProof.images} />
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className="flex items-end gap-3">
                <span className="w-8 shrink-0" />
                <div className="w-full max-w-[92%]">
                  <InlineOffer onAccept={onAccept} />
                </div>
              </div>
            );
          })}

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
            placeholder={
              closed
                ? "Garanta sua condição acima para continuar"
                : "Escreva sua mensagem..."
            }
            disabled={loading || closed}
            aria-label="Mensagem para a doutora"
            className="field flex-1 disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={loading || closed || !input.trim()}
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
