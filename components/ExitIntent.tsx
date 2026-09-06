import { useEffect, useState } from "react";
import { X, Sparkles, Check, ShieldCheck } from "lucide-react";
import axios from "axios";
import DoctorAvatar from "./DoctorAvatar";
import Disintegrate from "./Disintegrate";
import ChatCheckout from "./ChatCheckout";
import ChatPix from "./ChatPix";
import { clinic, priceOf, savingsOf, brl } from "../config/clinic";
import { track, purchaseParams } from "../lib/pixel";

const JA_MOSTRADO = "striae_exit_intent";
const PLANO = "resgate" as const;

const padrao = priceOf("padrao");
const preco = priceOf(PLANO);
const economia = savingsOf(PLANO);
const percentual = Math.round((economia / clinic.price.original) * 100);

interface ExitIntentProps {
  // Quem já passou pelo quiz tem nome; quem está saindo antes, não.
  userProfile: any;
  // Mantém o preço menor caso ela volte para o funil em vez de comprar aqui.
  onStay: () => void;
}

type Etapa = "oferta" | "dados" | "pix" | "pago";

export default function ExitIntent({ userProfile, onStay }: ExitIntentProps) {
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>("oferta");
  const [dissolvendo, setDissolvendo] = useState(false);
  const [pix, setPix] = useState<any>(null);
  const [pagando, setPagando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    // Uma vez por visita. Repetir a cada movimento do mouse vira praga.
    try {
      if (sessionStorage.getItem(JA_MOSTRADO)) return;
    } catch {
      /* navegador sem storage: mostra uma vez, só na memória */
    }

    let disparado = false;
    const disparar = () => {
      if (disparado) return;
      disparado = true;
      try {
        sessionStorage.setItem(JA_MOSTRADO, "1");
      } catch {}
      track("ExitIntent");
      setAberto(true);
    };

    // Desktop: o cursor sobe para além do topo, indo para a aba ou para a
    // barra de endereço.
    const aoSair = (e: MouseEvent) => {
      if (e.clientY <= 0) disparar();
    };
    document.addEventListener("mouseleave", aoSair);

    // Celular não tem mouseleave. O sinal equivalente é o botão voltar:
    // uma entrada extra no histórico deixa interceptar o primeiro toque.
    // Não prende ninguém — o segundo toque sai normalmente.
    history.pushState(null, "", location.href);
    const aoVoltar = () => {
      if (disparado) return;
      history.pushState(null, "", location.href);
      disparar();
    };
    window.addEventListener("popstate", aoVoltar);

    return () => {
      document.removeEventListener("mouseleave", aoSair);
      window.removeEventListener("popstate", aoVoltar);
    };
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  // Fechar depois de gerar o PIX apagaria o código dela.
  const fechar = () => {
    if (etapa === "pix" || etapa === "pago") return;
    setAberto(false);
  };

  const garantir = () => {
    track("InitiateCheckout", purchaseParams(PLANO));
    onStay();
    setDissolvendo(true);
  };

  const irParaDados = () => {
    setDissolvendo(false);
    setEtapa("dados");
  };

  const gerarPix = async (dados: {
    email: string;
    phone: string;
    document: string;
    name?: string;
  }) => {
    setPagando(true);
    setErro("");
    try {
      const { data } = await axios.post("/api/payment", {
        userProfile: { ...userProfile, ...dados },
        plan: PLANO,
      });
      setPix(data.pix);
      setDissolvendo(true);
    } catch {
      setErro("Não consegui gerar o PIX agora. Tente de novo.");
    } finally {
      setPagando(false);
    }
  };

  const irParaPix = () => {
    setDissolvendo(false);
    setEtapa("pix");
  };

  const aoPagar = () => {
    track("Purchase", purchaseParams(PLANO), {
      eventID: `purchase_${pix?.hash}`,
    });
    setEtapa("pago");
  };

  if (!aberto) return null;

  const largura = etapa === "oferta" ? "max-w-sm" : "max-w-md";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Oferta antes de sair"
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center
                 overflow-y-auto bg-ink/45 p-4 backdrop-blur-sm sm:items-center"
    >
      <div
        className={`animate-scale-in relative my-auto w-full ${largura} rounded-card bg-surface p-6 shadow-modal sm:p-7`}
      >
        {etapa !== "pix" && etapa !== "pago" && (
          <button
            onClick={fechar}
            aria-label="Fechar"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center
                       rounded-full text-muted transition-colors hover:bg-cream hover:text-ink"
          >
            <X size={18} />
          </button>
        )}

        {etapa === "oferta" && (
          <Disintegrate active={dissolvendo} onDone={irParaDados}>
            <div className="text-center">
              <div className="flex justify-center">
                <DoctorAvatar size={64} />
              </div>

              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold-soft px-3.5 py-1.5">
                <Sparkles size={12} className="text-gold" />
                <span className="eyebrow !text-ink">Só para quem chegou até aqui</span>
              </span>

              <h2 className="mt-4 font-display text-2xl leading-snug text-ink sm:text-3xl">
                Leve o método agora por {brl(preco)}
              </h2>

              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                Sem responder mais nada. A {clinic.doctor.name} liberou o preço
                mais baixo direto para você.
              </p>

              <div className="mt-5 rounded-lg bg-cream/70 px-5 py-4">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-muted line-through">
                    {brl(clinic.price.original)}
                  </span>
                  <span className="rounded-full bg-rose px-2.5 py-0.5 text-xs font-medium text-white">
                    −{percentual}%
                  </span>
                </div>
                <p className="mt-1.5 font-display text-4xl text-ink">{brl(preco)}</p>
                <p className="mt-1 text-xs text-muted">
                  em vez de {brl(padrao)} no final da conversa
                </p>
              </div>

              <ul className="mt-5 flex flex-col gap-2 text-left">
                {clinic.includes.slice(0, 3).map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-soft">
                      <Check size={10} className="text-gold" strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-relaxed text-ink">{item}</span>
                  </li>
                ))}
              </ul>

              <button onClick={garantir} className="btn-primary mt-6 w-full">
                Quero garantir a oferta
              </button>

              <button
                onClick={fechar}
                className="mt-3 text-xs text-muted underline underline-offset-2
                           transition-colors hover:text-rose"
              >
                Prefiro sair mesmo assim
              </button>
            </div>
          </Disintegrate>
        )}

        {etapa === "dados" && (
          <Disintegrate active={dissolvendo} onDone={irParaPix}>
            <p className="mb-3 text-center text-[15px] leading-relaxed text-ink">
              Só preciso de alguns dados para liberar o seu acesso.
            </p>
            <ChatCheckout
              onSubmit={gerarPix}
              loading={pagando}
              planId={PLANO}
              askName={!userProfile?.name}
            />
            {erro && (
              <p className="mt-2 text-center text-sm text-rose-deep">{erro}</p>
            )}
          </Disintegrate>
        )}

        {etapa === "pix" && <ChatPix pix={pix} onPaid={aoPagar} />}

        {etapa === "pago" && (
          <div className="animate-fade-up text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft">
              <Check size={28} className="text-gold" strokeWidth={2.5} />
            </span>
            <h2 className="mt-5 font-display text-2xl text-ink sm:text-3xl">
              Pagamento confirmado
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Enviamos o acesso ao método para o seu e-mail. A{" "}
              {clinic.doctor.name} acompanha você a partir daqui.
            </p>
            <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
              <ShieldCheck size={13} className="text-gold" />
              Garantia de {clinic.guaranteeDays} dias
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
