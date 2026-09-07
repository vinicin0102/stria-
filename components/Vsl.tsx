import { useEffect, useRef, useState } from "react";
import { Play, ArrowRight, ShieldCheck } from "lucide-react";
import { clinic } from "../config/clinic";
import { track } from "../lib/pixel";

interface VslProps {
  onFinish: () => void;
}

const vsl = clinic.vsl;

// Se o vídeo não carregar, ninguém pode ficar preso numa página sem saída.
const DESTRAVE_DE_EMERGENCIA = 90_000;

export default function Vsl({ onFinish }: VslProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [tocando, setTocando] = useState(false);
  const [liberado, setLiberado] = useState(false);
  const jaContou = useRef(false);

  // Rede ruim, codec recusado, arquivo movido: em qualquer um desses casos
  // o botão aparece assim mesmo, em vez de deixar o funil morto.
  useEffect(() => {
    const t = setTimeout(() => setLiberado(true), DESTRAVE_DE_EMERGENCIA);
    return () => clearTimeout(t);
  }, []);

  // Sem isso o player abre num retângulo preto.
  const pintarPrimeiroQuadro = () => {
    const v = ref.current;
    if (!v || vsl.poster || v.currentTime > 0) return;
    try {
      v.currentTime = 0.05;
    } catch {
      /* alguns navegadores recusam o seek antes do buffer */
    }
  };

  const acompanhar = () => {
    const v = ref.current;
    if (!v || !Number.isFinite(v.duration)) return;
    if (v.duration - v.currentTime <= vsl.ctaAntesDoFim) setLiberado(true);
  };

  const alternar = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      if (!jaContou.current) {
        jaContou.current = true;
        track("VslPlay");
      }
      v.play().catch(() => setLiberado(true));
    } else {
      v.pause();
    }
  };

  const avancar = () => {
    track("VslFinish");
    onFinish();
  };

  return (
    <div className="animate-fade-up">
      <div className="text-center">
        <span className="eyebrow">{vsl.eyebrow}</span>
        <h1 className="mx-auto mt-3 max-w-xl font-display text-3xl leading-tight text-ink sm:text-4xl">
          {vsl.headline}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          {vsl.subheadline}
        </p>
      </div>

      <div className="relative mx-auto mt-7 max-w-xl overflow-hidden rounded-card border border-line bg-ink shadow-soft">
        <video
          ref={ref}
          src={encodeURI(vsl.src)}
          poster={vsl.poster || undefined}
          playsInline
          preload="metadata"
          onLoadedMetadata={pintarPrimeiroQuadro}
          onTimeUpdate={acompanhar}
          onPlay={() => setTocando(true)}
          onPause={() => setTocando(false)}
          onEnded={() => {
            setTocando(false);
            setLiberado(true);
          }}
          onError={() => setLiberado(true)}
          onClick={alternar}
          className="block w-full cursor-pointer"
        />

        {!tocando && (
          <button
            onClick={alternar}
            aria-label="Reproduzir vídeo"
            className="absolute inset-0 flex items-center justify-center bg-ink/20
                       transition-colors hover:bg-ink/30"
          >
            <span
              className="flex h-20 w-20 items-center justify-center rounded-full
                         bg-white/90 shadow-lift transition-transform duration-200
                         hover:scale-105"
            >
              <Play size={28} className="ml-1 text-rose" fill="currentColor" />
            </span>
          </button>
        )}
      </div>

      <div className="mx-auto mt-7 max-w-xl text-center">
        {liberado ? (
          <div className="animate-fade-up">
            <button onClick={avancar} className="btn-primary w-full sm:w-auto sm:px-10">
              {vsl.ctaLabel}
              <ArrowRight size={18} />
            </button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
              <ShieldCheck size={13} className="text-gold" />
              5 perguntas rápidas · leva menos de um minuto
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted">
            O botão para continuar aparece ao final do vídeo.
          </p>
        )}
      </div>
    </div>
  );
}
