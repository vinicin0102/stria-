import { useEffect, useRef, useState, ReactNode } from "react";

interface ScratchCardProps {
  onReveal: () => void;
  revealed: boolean;
  children: ReactNode;
  height?: number;
}

const REVEAL_THRESHOLD = 0.45;
const BRUSH_RADIUS = 26;

export default function ScratchCard({
  onReveal,
  revealed,
  children,
  height = 150,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);

  // Pinta a camada dourada que cobre o desconto.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const paint = () => {
      const { width } = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#D9C39B");
      grad.addColorStop(0.5, "#EADCC4");
      grad.addColorStop(1, "#C4A77A");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#7A6242";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font =
        '500 13px Jost, "Century Gothic", system-ui, sans-serif';
      ctx.letterSpacing = "3px";
      ctx.fillText("RASPE PARA REVELAR", width / 2, height / 2 - 10);
      ctx.font = '400 12px Jost, "Century Gothic", system-ui, sans-serif';
      ctx.letterSpacing = "0px";
      ctx.fillStyle = "#93795330";
      ctx.fillText("deslize o dedo aqui", width / 2, height / 2 + 14);

      setReady(true);
    };

    paint();
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [height]);

  const clearedRatio = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    // Amostragem esparsa: ler todo pixel a cada movimento trava no celular.
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 40) {
      total++;
      if (data[i] === 0) clear++;
    }
    return total ? clear / total : 0;
  };

  const scratchAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = BRUSH_RADIUS * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const prev = lastPoint.current;
    if (prev) {
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    lastPoint.current = { x, y };
  };

  const pointerPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleDown = (e: React.PointerEvent) => {
    if (revealed) return;
    drawing.current = true;
    lastPoint.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = pointerPos(e);
    scratchAt(x, y);
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!drawing.current || revealed) return;
    const { x, y } = pointerPos(e);
    scratchAt(x, y);
  };

  const handleUp = () => {
    if (!drawing.current || revealed) return;
    drawing.current = false;
    lastPoint.current = null;
    if (clearedRatio() >= REVEAL_THRESHOLD) onReveal();
  };

  return (
    <div ref={wrapRef} className="w-full">
      <div
        className="relative overflow-hidden rounded-lg border border-gold/40"
        style={{ height }}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-cream">
          {children}
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerLeave={handleUp}
          onPointerCancel={handleUp}
          className="absolute inset-0 touch-none transition-opacity duration-700"
          style={{
            opacity: revealed ? 0 : 1,
            pointerEvents: revealed ? "none" : "auto",
            cursor: revealed ? "default" : "grab",
            visibility: ready ? "visible" : "hidden",
          }}
        />
      </div>

      {!revealed && (
        <button
          onClick={onReveal}
          className="mx-auto mt-2 block text-xs text-muted underline underline-offset-2
                     transition-colors hover:text-rose"
        >
          Não consegue raspar? Revelar
        </button>
      )}
    </div>
  );
}
