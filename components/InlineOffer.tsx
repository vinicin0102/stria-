import { useState, useEffect } from "react";
import { Check, Clock, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import ScratchCard from "./ScratchCard";
import { clinic, finalPrice, savings, brl } from "../config/clinic";

interface InlineOfferProps {
  onAccept: () => void;
}

const OFFER_SECONDS = 5 * 60;

const includes = [
  ...clinic.includes,
  `Garantia de satisfação de ${clinic.guaranteeDays} dias`,
];

export default function InlineOffer({ onAccept }: InlineOfferProps) {
  const [revealed, setRevealed] = useState(false);
  const [armed, setArmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OFFER_SECONDS);

  // Ao revelar, o botão de comprar é montado bem embaixo do dedo que
  // acabou de raspar, e o clique daquele mesmo toque cairia nele. Uma
  // pausa curta evita comprar sem querer com um único toque.
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => setArmed(true), 600);
    return () => clearTimeout(t);
  }, [revealed]);

  // O relógio só começa quando ela descobre o desconto.
  useEffect(() => {
    if (!revealed) return;
    const timer = setInterval(
      () => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => clearInterval(timer);
  }, [revealed]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const expired = timeLeft === 0;

  return (
    <div className="animate-fade-up overflow-hidden rounded-2xl rounded-bl-sm border border-gold/40 bg-white">
      <div className="flex items-center gap-2 border-b border-gold/25 bg-gold-soft/40 px-4 py-2.5">
        <Sparkles size={13} className="text-gold" />
        <span className="eyebrow !text-ink">Condição exclusiva para você</span>
      </div>

      <div className="p-4">
        {!revealed && (
          <p className="mb-3 text-[15px] leading-relaxed text-ink">
            Consegui liberar uma condição especial para o seu caso. Raspe aqui
            para ver quanto de desconto eu reservei:
          </p>
        )}

        <ScratchCard revealed={revealed} onReveal={() => setRevealed(true)}>
          <div className="text-center">
            <p className="font-display text-6xl leading-none text-rose">
              {clinic.price.discountPercent}%
            </p>
            <p className="eyebrow mt-1">de desconto</p>
          </div>
        </ScratchCard>

        {revealed && (
          <div className="animate-fade-up mt-5">
            <div className="rounded-lg bg-cream/70 px-5 py-5 text-center">
              <p className="eyebrow">Protocolo completo {clinic.name}</p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="text-muted line-through">
                  {brl(clinic.price.original)}
                </span>
                <span className="rounded-full bg-rose px-2.5 py-0.5 text-xs font-medium text-white">
                  −{clinic.price.discountPercent}%
                </span>
              </div>
              <p className="mt-2 font-display text-4xl text-ink">
                {brl(finalPrice)}
              </p>
              <p className="mt-2 text-sm text-muted">
                Você economiza{" "}
                <span className="font-medium text-rose-deep">{brl(savings)}</span>
              </p>
            </div>

            <ul className="mt-5 flex flex-col gap-2.5">
              {includes.map((item, i) => (
                <li
                  key={item}
                  className="animate-fade-up flex items-start gap-2.5"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-soft">
                    <Check size={10} className="text-gold" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-ink">{item}</span>
                </li>
              ))}
            </ul>

            {clinic.spotsLeft > 0 && (
              <p className="mt-4 text-center text-sm text-rose-deep">
                {clinic.spotsLeft}{" "}
                {clinic.spotsLeft === 1 ? "vaga restante" : "vagas restantes"}{" "}
                nesta condição
              </p>
            )}

            <div
              className={`mt-4 flex items-center justify-center gap-2.5 rounded-lg border px-4 py-3 ${
                expired ? "border-line bg-cream/60" : "border-rose-soft bg-rose-soft/30"
              }`}
            >
              <Clock
                size={15}
                className={expired ? "text-muted" : "animate-pulse-soft text-rose"}
              />
              {expired ? (
                <p className="text-sm text-muted">
                  Tempo esgotado — me chame para verificar a disponibilidade.
                </p>
              ) : (
                <p className="text-sm text-ink">
                  Reservada para você por{" "}
                  <span className="tabular font-medium text-rose-deep">
                    {minutes}:{String(seconds).padStart(2, "0")}
                  </span>
                </p>
              )}
            </div>

            <button
              onClick={() => armed && onAccept()}
              className="btn-primary mt-4 w-full"
            >
              Quero garantir minha condição
              <ArrowRight size={17} />
            </button>

            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-muted">
              <ShieldCheck size={13} className="text-gold" />
              Garantia de {clinic.guaranteeDays} dias · Pagamento via PIX
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
