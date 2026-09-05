import { useEffect, useRef, useState, ReactNode } from "react";

interface DisintegrateProps {
  active: boolean;
  onDone: () => void;
  children: ReactNode;
}

// Teto de partículas: cada uma é um fillRect por quadro, e passar disso
// engasga a animação justo na hora da compra. O celular tem menos folga.
const budgetFor = (viewportWidth: number) =>
  viewportWidth < 640 ? 9000 : 16000;

const FLIGHT = 1.25;
const SWEEP = 0.45;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  wobble: number;
  delay: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Burst {
  particles: Particle[];
  step: number;
  cssWidth: number;
  pixelWidth: number;
  pixelHeight: number;
}

export default function Disintegrate({ active, onDone, children }: DisintegrateProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const burstRef = useRef<Burst | null>(null);
  const started = useRef(false);

  // Guardado em ref para os efeitos dependerem só do que importa: se o
  // callback entrasse nas dependências, um render do pai reiniciaria a
  // limpeza e mataria a animação no meio, sem avisar que terminou.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Etapa 1: fotografa o cartão e monta as partículas.
  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;

    let cancelled = false;
    const finish = () => {
      if (!cancelled) onDoneRef.current();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(finish, 200);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    (async () => {
      const el = wrapRef.current;
      if (!el) return finish();

      const width = Math.ceil(el.offsetWidth);
      const height = Math.ceil(el.offsetHeight);
      if (!width || !height) return finish();

      let snapshot: HTMLCanvasElement;
      try {
        const html2canvas = (await import("html2canvas")).default;
        snapshot = await html2canvas(el, {
          backgroundColor: null,
          scale: 1,
          logging: false,
          useCORS: true,
        });
      } catch (err) {
        // Sem a captura não há partículas; seguir o fluxo é melhor que travar.
        console.error("Disintegrate: falha ao capturar o cartão", err);
        return finish();
      }
      if (cancelled) return;

      const sctx = snapshot.getContext("2d");
      if (!sctx) return finish();
      const pixels = sctx.getImageData(0, 0, snapshot.width, snapshot.height).data;

      const step = Math.max(
        3,
        Math.ceil(
          Math.sqrt(
            (snapshot.width * snapshot.height) / budgetFor(window.innerWidth)
          )
        )
      );

      const particles: Particle[] = [];
      for (let y = 0; y < snapshot.height; y += step) {
        for (let x = 0; x < snapshot.width; x += step) {
          const i = (y * snapshot.width + x) * 4;
          const a = pixels[i + 3];
          if (a < 24) continue;
          particles.push({
            x,
            y,
            // Sobe e sai para a direita, como poeira levada pelo vento.
            vx: 26 + Math.random() * 120,
            vy: -18 - Math.random() * 78,
            wobble: Math.random() * Math.PI * 2,
            // Varre da esquerda para a direita em vez de sumir tudo junto.
            delay: (x / snapshot.width) * SWEEP + Math.random() * 0.12,
            r: pixels[i],
            g: pixels[i + 1],
            b: pixels[i + 2],
            a: a / 255,
          });
        }
      }

      if (!particles.length) return finish();

      burstRef.current = {
        particles,
        step,
        cssWidth: width,
        pixelWidth: snapshot.width,
        pixelHeight: snapshot.height,
      };
      // Troca o cartão pelo canvas. A animação começa no efeito seguinte,
      // que só roda depois de o React montar o canvas de verdade.
      setBox({ w: width, h: height });
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  // Etapa 2: anima. Roda após o commit, então o canvas já está no DOM.
  useEffect(() => {
    const burst = burstRef.current;
    const canvas = canvasRef.current;
    if (!box || !burst || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onDoneRef.current();
      return;
    }

    canvas.width = burst.pixelWidth;
    canvas.height = burst.pixelHeight;

    const scale = burst.pixelWidth / burst.cssWidth;
    const size = burst.step * 0.95;
    const start = performance.now();
    let raf = 0;
    let cancelled = false;

    const frame = (now: number) => {
      if (cancelled) return;
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = 0;
      for (const p of burst.particles) {
        const lt = t - p.delay;

        if (lt < 0) {
          alive++;
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a})`;
          ctx.fillRect(p.x, p.y, size, size);
          continue;
        }
        if (lt >= FLIGHT) continue;

        alive++;
        const prog = lt / FLIGHT;
        const ease = prog * prog;
        const drift = Math.sin(p.wobble + lt * 7) * 9 * prog;

        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a * (1 - ease)})`;
        ctx.fillRect(
          p.x + p.vx * lt * scale + drift,
          p.y + p.vy * lt * scale + drift * 0.4,
          size,
          size
        );
      }

      if (alive > 0) raf = requestAnimationFrame(frame);
      else onDoneRef.current();
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [box]);

  // Enquanto as partículas voam, o canvas ocupa exatamente o espaço do
  // cartão: sem isso a conversa daria um salto no meio da animação.
  if (box) {
    return (
      <div style={{ width: box.w, height: box.h }} aria-hidden="true">
        <canvas
          ref={canvasRef}
          style={{ width: box.w, height: box.h, display: "block" }}
        />
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={active ? { pointerEvents: "none" } : undefined}>
      {children}
    </div>
  );
}
