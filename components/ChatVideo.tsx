import { useRef, useState } from "react";
import { Play } from "lucide-react";

interface ChatVideoProps {
  src: string;
  poster?: string;
}

export default function ChatVideo({ src, poster }: ChatVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  // Sem isso o player abre num retângulo preto. Avançar uma fração de
  // segundo obriga o navegador a pintar o primeiro quadro, e o vídeo já
  // aparece "carregado" na conversa — sem baixar o arquivo inteiro.
  const paintFirstFrame = () => {
    const v = ref.current;
    if (!v || poster || v.currentTime > 0) return;
    try {
      v.currentTime = 0.05;
    } catch {
      /* alguns navegadores recusam o seek antes do buffer; segue com o preto */
    }
  };

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-ink">
      <video
        ref={ref}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        onLoadedMetadata={paintFirstFrame}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onClick={toggle}
        className="block w-full cursor-pointer"
      />

      {!playing && (
        <button
          onClick={toggle}
          aria-label="Reproduzir vídeo"
          className="absolute inset-0 flex items-center justify-center bg-ink/10
                     transition-colors hover:bg-ink/20"
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full
                       bg-white/90 shadow-lift transition-transform duration-200
                       hover:scale-105"
          >
            <Play size={20} className="ml-0.5 text-rose" fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}
