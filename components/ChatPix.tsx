import { useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { brl } from "../config/clinic";

interface ChatPixProps {
  pix: { pixKey: string; amount: number; reference: string };
}

export default function ChatPix({ pix }: ChatPixProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pix.pixKey);
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
        {/* Remova este bloco quando o provedor de PIX real estiver integrado. */}
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-900">
            <strong className="font-medium">Ambiente de teste.</strong> Esta chave
            não recebe transferências.
          </p>
        </div>

        <p className="eyebrow mb-1.5">Chave copia e cola</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-line bg-cream/70 px-3 py-2.5 font-mono text-xs text-ink">
            {pix.pixKey}
          </code>
          <button
            onClick={copy}
            aria-label="Copiar chave PIX"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                       bg-rose text-white transition-colors hover:bg-rose-deep"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        {failed && (
          <p className="mt-2 text-xs text-rose-deep">
            Não consegui copiar automaticamente. Selecione a chave acima.
          </p>
        )}

        <p className="mt-3 text-xs text-muted">
          Referência <span className="font-mono">{pix.reference}</span>
        </p>

        <ol className="mt-4 flex flex-col gap-2.5 border-t border-line pt-4">
          {[
            "Copie a chave e pague no app do seu banco",
            "O acesso chega no seu e-mail assim que o pagamento cair",
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-soft font-display text-xs text-gold">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-ink">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
