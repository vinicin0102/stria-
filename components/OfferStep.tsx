import { useState, useEffect } from "react";
import { X, Check, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { clinic, finalPrice, savings, brl } from "../config/clinic";

interface OfferStepProps {
  onAccept: () => void;
  onDecline: () => void;
}

const OFFER_SECONDS = 5 * 60;

const includes = [
  "4 sessões do protocolo " + clinic.name,
  "Acompanhamento personalizado com a doutora",
  "Produtos complementares para uso em casa",
  `Garantia de satisfação de ${clinic.guaranteeDays} dias`,
  "Suporte direto pelo WhatsApp",
];

export default function OfferStep({ onAccept, onDecline }: OfferStepProps) {
  const [timeLeft, setTimeLeft] = useState(OFFER_SECONDS);

  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDecline();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onDecline]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const expired = timeLeft === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Condição exclusiva"
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center
                 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="animate-scale-in relative my-auto w-full max-w-lg rounded-card bg-surface shadow-modal">
        <button
          onClick={onDecline}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center
                     rounded-full text-muted transition-colors hover:bg-cream hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="px-7 pt-10 text-center sm:px-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-4 py-1.5">
            <Sparkles size={13} className="text-gold" />
            <span className="eyebrow !text-ink">Condição exclusiva</span>
          </span>

          <h2 className="mt-5 font-display text-3xl leading-snug text-ink sm:text-4xl">
            Liberada para o seu perfil
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-muted">
            Com base na sua avaliação, a doutora liberou uma condição especial no
            protocolo completo.
          </p>
        </div>

        <div className="mx-7 mt-8 rounded-lg bg-cream/70 px-6 py-7 text-center sm:mx-10">
          <p className="eyebrow">Protocolo completo {clinic.name}</p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-lg text-muted line-through">
              {brl(clinic.price.original)}
            </span>
            <span className="rounded-full bg-rose px-3 py-1 text-sm font-medium text-white">
              −{clinic.price.discountPercent}%
            </span>
          </div>

          <p className="mt-3 font-display text-5xl text-ink sm:text-6xl">
            {brl(finalPrice)}
          </p>

          <p className="mt-3 text-sm text-muted">
            Você economiza{" "}
            <span className="font-medium text-rose-deep">{brl(savings)}</span>
          </p>
        </div>

        <ul className="mt-8 flex flex-col gap-3 px-7 sm:px-10">
          {includes.map((item, i) => (
            <li
              key={item}
              className="animate-fade-up flex items-start gap-3 text-ink"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-soft">
                <Check size={12} className="text-gold" strokeWidth={3} />
              </span>
              <span className="text-[15px] leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>

        <div
          className={`mx-7 mt-8 flex items-center justify-center gap-3 rounded-lg border px-5 py-4 sm:mx-10 ${
            expired
              ? "border-line bg-cream/60"
              : "border-rose-soft bg-rose-soft/30"
          }`}
        >
          <Clock
            size={17}
            className={expired ? "text-muted" : "animate-pulse-soft text-rose"}
          />
          {expired ? (
            <p className="text-sm text-muted">
              Tempo esgotado — confirme a disponibilidade com a doutora.
            </p>
          ) : (
            <p className="text-sm text-ink">
              Reservada por mais{" "}
              <span className="tabular font-medium text-rose-deep">
                {minutes}:{String(seconds).padStart(2, "0")}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 px-7 pb-8 pt-6 sm:px-10">
          <button onClick={onAccept} className="btn-primary w-full">
            Quero garantir minha condição
          </button>
          <button onClick={onDecline} className="btn-ghost w-full">
            Voltar para a conversa
          </button>

          <p className="mt-2 flex items-center justify-center gap-2 text-center text-xs text-muted">
            <ShieldCheck size={14} className="text-gold" />
            Garantia de {clinic.guaranteeDays} dias · Pagamento via PIX
          </p>
        </div>
      </div>
    </div>
  );
}
