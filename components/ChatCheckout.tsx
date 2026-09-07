import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { priceOf, brl, PlanId } from "../config/clinic";

interface ChatCheckoutProps {
  // O nome não entra aqui: vem da primeira resposta dela na conversa.
  onSubmit: (data: { email: string; phone: string; document: string }) => void;
  loading: boolean;
  planId: PlanId;
}

const onlyDigits = (v: string) => v.replace(/\D/g, "");

const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const maskDocument = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

export default function ChatCheckout({
  onSubmit,
  loading,
  planId,
}: ChatCheckoutProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setError("Confira o e-mail: é por ele que você recebe o método.");
    }
    if (onlyDigits(phone).length < 10) {
      return setError("Confira o número do WhatsApp.");
    }
    if (onlyDigits(document).length !== 11) {
      return setError("O CPF precisa ter 11 dígitos.");
    }
    setError("");
    onSubmit({ email, phone, document: onlyDigits(document) });
  };

  return (
    <div className="animate-fade-up overflow-hidden rounded-2xl rounded-bl-sm border border-gold/40 bg-white">
      <div className="flex items-center justify-between border-b border-gold/25 bg-gold-soft/40 px-4 py-2.5">
        <span className="eyebrow !text-ink">Seus dados</span>
        <span className="font-display text-lg text-ink">{brl(priceOf(planId))}</span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <label htmlFor="co-email" className="eyebrow mb-1.5 block">
            E-mail
          </label>
          <input
            id="co-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@email.com"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="co-phone" className="eyebrow mb-1.5 block">
            WhatsApp
          </label>
          <input
            id="co-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="co-doc" className="eyebrow mb-1.5 block">
            CPF
          </label>
          <input
            id="co-doc"
            type="text"
            inputMode="numeric"
            value={document}
            onChange={(e) => setDocument(maskDocument(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="000.000.000-00"
            className="field"
          />
        </div>

        {error && <p className="text-sm text-rose-deep">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary mt-1 w-full"
        >
          {loading ? "Gerando PIX..." : "Gerar meu PIX"}
          {!loading && <ArrowRight size={17} />}
        </button>

        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted">
          <Lock size={12} className="text-gold" />
          Dados protegidos · usados só para o seu acesso
        </p>
      </div>
    </div>
  );
}
