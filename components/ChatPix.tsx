import { useEffect, useRef, useState } from "react";
import { Copy, Check, Clock } from "lucide-react";
import axios from "axios";
import { brl } from "../config/clinic";

interface ChatPixProps {
  pix: { code: string; qrImage: string; hash: string; amount: number };
  onPaid: () => void;
}

const POLL_MS = 5000;
const GIVE_UP_MS = 15 * 60 * 1000;

export default function ChatPix({ pix, onPaid }: ChatPixProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  // Enquanto ela paga no app do banco, a conversa acompanha sozinha.
  useEffect(() => {
    if (!pix.hash) return;
    let stopped = false;
    const started = Date.now();

    const check = async () => {
      if (stopped) return;
      try {
        const { data } = await axios.get("/api/payment-status", {
          params: { hash: pix.hash },
        });
        if (data.paid && !stopped) {
          stopped = true;
          onPaidRef.current();
          return;
        }
      } catch {
        /* rede instável: tenta de novo no próximo ciclo */
      }
      if (!stopped && Date.now() - started < GIVE_UP_MS) {
        timer = setTimeout(check, POLL_MS);
      }
    };

    let timer = setTimeout(check, POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [pix.hash]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pix.code);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="animate-fade-up overflow-hidden rounded-2xl rounded-bl-sm border border-gold/40 bg-white">
      <div className="flex items-center justify-between border-b border-gold/25 bg-gold-soft/40 px-4 py-2.5">
        <span className="eyebrow !text-ink">PIX gerado</span>
        <span className="font-display text-lg text-ink">{brl(pix.amount)}</span>
      </div>

      <div className="p-4">
        <div className="flex justify-center">
          <img
            src={pix.qrImage}
            alt="QR Code para pagamento via PIX"
            width={200}
            height={200}
            className="rounded-lg border border-line"
          />
        </div>

        <p className="mt-3 text-center text-sm text-muted">
          Escaneie com o app do seu banco
        </p>

        <p className="eyebrow mb-1.5 mt-5">ou use o copia e cola</p>
        <div className="flex items-center gap-2">
          {/* min-w-0: sem isso o item flex herda min-width:auto, se recusa a
              encolher abaixo do BR Code e empurra a conversa na horizontal. */}
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-line bg-cream/70 px-3 py-2.5 font-mono text-xs text-ink">
            {pix.code}
          </code>
          <button
            onClick={copy}
            aria-label="Copiar código PIX"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                       bg-rose text-white transition-colors hover:bg-rose-deep"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {failed && (
          <p className="mt-2 text-xs text-rose-deep">
            Não consegui copiar automaticamente. Selecione o código acima.
          </p>
        )}

        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-line bg-cream/50 px-3 py-2.5">
          <Clock size={14} className="animate-pulse-soft shrink-0 text-gold" />
          <p className="text-xs leading-relaxed text-muted">
            Assim que o pagamento cair, seu acesso é liberado aqui automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
