import { useState, useEffect, useRef } from "react";
import { ArrowUp, Lock } from "lucide-react";
import axios from "axios";
import DoctorAvatar from "./DoctorAvatar";
import InlineOffer from "./InlineOffer";
import ProofCarousel from "./ProofCarousel";
import ChatCheckout from "./ChatCheckout";
import ChatPix from "./ChatPix";
import ChatVideo from "./ChatVideo";
import Disintegrate from "./Disintegrate";
import { clinic, planFor } from "../config/clinic";
import { track, purchaseParams } from "../lib/pixel";

type Message =
  | { kind: "doctor"; content: string }
  | { kind: "user"; content: string }
  | { kind: "vsl" }
  | { kind: "proof" }
  | { kind: "offer"; dissolving?: boolean }
  | { kind: "checkout"; dissolving?: boolean }
  | { kind: "pix"; pix: any };

// Uma a mais que antes: a primeira resposta dela é só o nome, então a
// descoberta real do caso começa na seguinte.
const MESSAGES_BEFORE_OFFER = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const videos = clinic.socialProof.videos;
const hasProof = Boolean(videos.length || clinic.socialProof.images.length);
const hasVsl = Boolean(clinic.vsl.src);

const closingMessage = `Na prática é assim: nada de sessão em clínica. É uma rotina diária que você faz em casa, com cuidados dermatológicos que quase ninguém conhece, e eu te acompanho durante o processo.${
  hasProof && clinic.socialProof.intro ? `\n\n${clinic.socialProof.intro}` : ""
}`;

// A primeira mensagem dela responde "como você se chama?". Tira os
// rodeios mais comuns para o nome não sair como "oi sou a maria".
const extrairNome = (texto: string) =>
  texto
    .replace(/^(oi|ol[áa]|bom dia|boa tarde|boa noite)[\s,!.]*/i, "")
    .replace(/^(meu nome (é|e)|me chamo|sou a|sou o|eu sou a|eu sou o|é a|é o)\s+/i, "")
    .replace(/[.!]+$/, "")
    .trim()
    .slice(0, 60) || texto.trim().slice(0, 60);

export default function ChatWindow() {
  const planId = planFor(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [sentCount, setSentCount] = useState(0);
  const [closed, setClosed] = useState(false);
  const [nome, setNome] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const offerShown = useRef(false);
  const abriu = useRef(false);
  const pendingPix = useRef<any>(null);
  const paidShown = useRef(false);

  // Cada bloco entra com pausa e indicador de digitação. Despejar tudo de
  // uma vez faz a conversa parecer script automático em vez de pessoa.
  const say = async (message: Message, think = 2200) => {
    setLoading(true);
    await sleep(think);
    setLoading(false);
    setMessages((prev) => [...prev, message]);
  };

  // Abertura: ela chega direto na conversa, sem quiz.
  useEffect(() => {
    if (abriu.current) return;
    abriu.current = true;

    (async () => {
      await sleep(800);
      await say(
        {
          kind: "doctor",
          content: `Oi! Sou a ${clinic.doctor.name}, ${clinic.doctor.title.toLowerCase()} da ${clinic.name}.${
            hasVsl ? `\n\n${clinic.vsl.intro}` : ""
          }`,
        },
        1600
      );

      if (hasVsl) {
        await sleep(900);
        setMessages((prev) => [...prev, { kind: "vsl" }]);
      }

      await sleep(2000);
      await say(
        { kind: "doctor", content: "Antes de começarmos, como você se chama?" },
        1800
      );
    })();
  }, []);

  // Rola apenas o painel de mensagens — scrollIntoView puxaria a página inteira.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const runClosingSequence = async () => {
    offerShown.current = true;
    setClosed(true);

    await sleep(2000);
    await say({ kind: "doctor", content: closingMessage }, 2800);

    if (hasProof) {
      await sleep(1900);
      await say({ kind: "proof" }, 1800);
    }

    await sleep(2200);
    await say({ kind: "offer" }, 1700);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || closed) return;

    setInput("");
    setMessages((prev) => [...prev, { kind: "user", content: text }]);

    // A primeira resposta é o nome. Guardamos aqui porque a cobrança
    // precisa dele e não existe mais formulário antes da conversa.
    const primeiraResposta = sentCount === 0;
    const nomeDela = primeiraResposta ? extrairNome(text) : nome;
    if (primeiraResposta) setNome(nomeDela);

    setLoading(true);

    // Sem o histórico, cada resposta sai desconectada do que ela contou.
    const history = messages
      .filter(
        (m): m is Extract<Message, { content: string }> =>
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
        userProfile: { name: nomeDela },
        messageCount: sentCount,
        history,
        // Sem este aviso ela encerra com uma pergunta que a oferta
        // atropela em seguida, e a cliente nunca chega a responder.
        isFinalTurn: sentCount + 1 >= MESSAGES_BEFORE_OFFER,
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

  // A oferta se desfaz e os campos nascem no mesmo lugar: trocar de tela
  // aqui quebraria o embalo de quem acabou de decidir comprar.
  const handleAcceptOffer = () => {
    track("InitiateCheckout", purchaseParams(planId));
    setMessages((prev) =>
      prev.map((m) => (m.kind === "offer" ? { ...m, dissolving: true } : m))
    );
  };

  const handleDissolved = async () => {
    setMessages((prev) => prev.filter((m) => m.kind !== "offer"));

    await sleep(800);
    await say({
      kind: "doctor",
      content: "Perfeito! Só preciso de três informações para liberar o seu acesso.",
    });

    await sleep(1000);
    await say({ kind: "checkout" }, 1200);
  };

  const handleCheckout = async (data: {
    email: string;
    phone: string;
    document: string;
  }) => {
    setPaying(true);
    setPayError("");

    try {
      // O valor não vai daqui de propósito: quem define é o servidor, a
      // partir da configuração. Preço vindo do cliente é preço editável.
      const { data: res } = await axios.post("/api/payment", {
        userProfile: { name: nome, ...data },
      });

      // O formulário também se desfaz: o PIX nasce do mesmo lugar.
      pendingPix.current = res.pix;
      setMessages((prev) =>
        prev.map((m) => (m.kind === "checkout" ? { ...m, dissolving: true } : m))
      );
    } catch {
      setPayError("Não consegui gerar o PIX agora. Tente de novo.");
    } finally {
      setPaying(false);
    }
  };

  const handleCheckoutDissolved = async () => {
    setMessages((prev) => prev.filter((m) => m.kind !== "checkout"));

    await sleep(800);
    await say({ kind: "doctor", content: "Pronto, aqui está o seu PIX." }, 1500);

    await sleep(800);
    setMessages((prev) => [...prev, { kind: "pix", pix: pendingPix.current }]);
  };

  // Disparado quando a consulta à IronPay confirma o pagamento.
  const handlePaid = async () => {
    if (paidShown.current) return;
    paidShown.current = true;

    // Mesmo eventID do lado servidor: o Meta junta os dois em uma conversão.
    track("Purchase", purchaseParams(planId), {
      eventID: `purchase_${pendingPix.current?.hash}`,
    });

    await sleep(600);
    await say({
      kind: "doctor",
      content: `Pagamento confirmado! Acabei de liberar o seu acesso ao ${clinic.name}.

Enviei tudo para o seu e-mail. Qualquer dúvida durante o processo, é só me chamar.`,
    });
  };

  const bubble = (key: number, node: React.ReactNode, wide = false) => (
    <div key={key} className="animate-slide-right flex items-end gap-2 sm:gap-3">
      <span className="w-8 shrink-0" />
      <div className={`w-full ${wide ? "max-w-[92%]" : "max-w-[88%] sm:max-w-[82%]"}`}>
        {node}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-up flex w-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-soft">
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-cream/60 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
        <span className="relative">
          <DoctorAvatar size={46} />
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-cream bg-emerald-500" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-xl leading-tight text-ink">
            {clinic.doctor.name}
          </p>
          <p className="truncate text-sm text-muted">
            {clinic.doctor.title}
            {clinic.doctor.crm && ` · ${clinic.doctor.crm}`}
          </p>
        </div>
        {/* Prova de que tem alguém do outro lado: é o que sustenta a
            conversa, então aparece também no celular. */}
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px] text-muted sm:text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          online agora
        </span>
      </div>

      {/* Ocupa o que sobra da tela em vez de uma altura fixa: é isso que
          faz a página inteira não rolar, só a conversa. */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6"
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          {messages.map((msg, i) => {
            if (msg.kind === "user") {
              return (
                <div key={i} className="animate-slide-left flex justify-end">
                  <div className="max-w-[88%] whitespace-pre-line rounded-2xl rounded-br-sm bg-rose px-3.5 py-2.5 text-[15px] leading-relaxed text-white sm:max-w-[82%] sm:px-4 sm:py-3 sm:text-base">
                    {msg.content}
                  </div>
                </div>
              );
            }

            if (msg.kind === "doctor") {
              return (
                <div key={i} className="animate-slide-right flex items-end gap-2 sm:gap-3">
                  <DoctorAvatar size={32} ring={false} />
                  <div className="max-w-[88%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-line bg-cream/70 px-3.5 py-2.5 text-[15px] leading-relaxed text-ink sm:max-w-[82%] sm:px-4 sm:py-3 sm:text-base">
                    {msg.content}
                  </div>
                </div>
              );
            }

            if (msg.kind === "vsl") {
              return bubble(
                i,
                <div className="max-w-[280px]">
                  <ChatVideo
                    src={encodeURI(clinic.vsl.src)}
                    poster={clinic.vsl.poster || undefined}
                  />
                </div>
              );
            }

            if (msg.kind === "proof") {
              return bubble(
                i,
                videos.length ? (
                  <div
                    className={
                      videos.length > 1 ? "grid grid-cols-2 gap-2" : "max-w-[280px]"
                    }
                  >
                    {videos.map((src) => (
                      <ChatVideo
                        key={src}
                        // Os nomes vêm de upload e podem ter espaço e
                        // parêntese, que quebram o src sem codificar.
                        src={encodeURI(src)}
                        poster={clinic.socialProof.poster || undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <ProofCarousel images={clinic.socialProof.images} />
                ),
                videos.length > 1
              );
            }

            if (msg.kind === "offer") {
              return (
                <div key={i} className="flex items-end gap-2 sm:gap-3">
                  <span className="w-8 shrink-0" />
                  <div className="w-full max-w-[92%]">
                    <Disintegrate
                      active={Boolean(msg.dissolving)}
                      onDone={handleDissolved}
                    >
                      <InlineOffer onAccept={handleAcceptOffer} planId={planId} />
                    </Disintegrate>
                  </div>
                </div>
              );
            }

            if (msg.kind === "checkout") {
              return bubble(
                i,
                <Disintegrate
                  active={Boolean(msg.dissolving)}
                  onDone={handleCheckoutDissolved}
                >
                  <ChatCheckout
                    onSubmit={handleCheckout}
                    loading={paying}
                    planId={planId}
                  />
                  {payError && (
                    <p className="mt-2 text-sm text-rose-deep">{payError}</p>
                  )}
                </Disintegrate>,
                true
              );
            }

            return bubble(i, <ChatPix pix={msg.pix} onPaid={handlePaid} />, true);
          })}

          {loading && (
            <div className="animate-fade-in flex items-end gap-2 sm:gap-3">
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

      <div className="shrink-0 border-t border-line bg-cream/40 px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              closed ? "Continue pela condição acima" : "Escreva sua mensagem..."
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
