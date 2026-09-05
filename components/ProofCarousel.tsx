import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProofCarouselProps {
  images: { src: string; caption?: string }[];
}

export default function ProofCarousel({ images }: ProofCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState<string[]>([]);

  // Um arquivo ausente viraria um quadro quebrado no meio da conversa.
  const shown = images.filter((img) => !broken.includes(img.src));
  if (!shown.length) return null;

  // O scroll-snap nativo já entrega o arrastar com o dedo; aqui só
  // acompanhamos qual slide parou no centro.
  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(index, shown.length - 1));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-[250px]">
      <div className="relative overflow-hidden rounded-2xl rounded-bl-sm border border-line bg-cream">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth
                     [-ms-overflow-style:none] [scrollbar-width:none]
                     [&::-webkit-scrollbar]:hidden"
        >
          {shown.map((img, i) => (
            <figure key={img.src} className="w-full shrink-0 snap-center">
              <img
                src={img.src}
                alt={img.caption || `Resultado ${i + 1}`}
                onError={() => setBroken((prev) => [...prev, img.src])}
                className="aspect-[4/3] w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
              {img.caption && (
                <figcaption className="px-3 py-1.5 text-[11px] leading-snug text-muted">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>

        {shown.length > 1 && (
          <>
            <button
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Imagem anterior"
              className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center
                         justify-center rounded-full bg-white/85 text-ink backdrop-blur-sm
                         transition-opacity hover:bg-white disabled:opacity-0"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => goTo(active + 1)}
              disabled={active === shown.length - 1}
              aria-label="Próxima imagem"
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center
                         justify-center rounded-full bg-white/85 text-ink backdrop-blur-sm
                         transition-opacity hover:bg-white disabled:opacity-0"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}
      </div>

      {shown.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {shown.map((img, i) => (
            <button
              key={img.src}
              onClick={() => goTo(i)}
              aria-label={`Ir para a imagem ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-4 bg-rose" : "w-1.5 bg-line"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
