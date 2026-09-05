import { useState } from "react";
import {
  Copy,
  Check,
  ShieldCheck,
  Lock,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";
import axios from "axios";
import DoctorAvatar from "./DoctorAvatar";
import { clinic, finalPrice, savings, brl } from "../config/clinic";

interface PaymentFormProps {
  userProfile: any;
}

export default function PaymentForm({ userProfile }: PaymentFormProps) {
  const [step, setStep] = useState<"form" | "pix" | "success">("form");
  const [pix, setPix] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ phone: "", address: "", city: "", state: "" });

  const update = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleGenerate = async () => {
    if (!form.phone || !form.address || !form.city || !form.state) {
      return setError("Preencha todos os campos para continuar.");
    }
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post("/api/payment", {
        userProfile: { ...userProfile, ...form },
        amount: finalPrice,
      });
      setPix(data.pix);
      setStep("pix");
    } catch {
      setError("Não foi possível gerar o PIX. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(pix.pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copie a chave manualmente.");
    }
  };

  if (step === "form") {
    return (
      <div className="animate-fade-up rounded-card border border-line bg-surface p-7 shadow-soft sm:p-10">
        <p className="eyebrow">Última etapa</p>
        <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
          Finalize sua reserva
        </h2>

        <div className="mt-8 rounded-lg bg-cream/70 p-6">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Protocolo completo</span>
            <span className="line-through">{brl(clinic.price.original)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted">
              Desconto de {clinic.price.discountPercent}%
            </span>
            <span className="font-medium text-rose-deep">− {brl(savings)}</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="font-medium text-ink">Total</span>
            <span className="font-display text-3xl text-ink">{brl(finalPrice)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-lg border border-line px-5 py-4">
            <p className="eyebrow">Cliente</p>
            <p className="mt-1 font-medium text-ink">{userProfile?.name}</p>
            <p className="text-sm text-muted">{userProfile?.email}</p>
          </div>

          <div>
            <label htmlFor="phone" className="eyebrow mb-2 block">
              Telefone / WhatsApp
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={update}
              placeholder="(11) 99999-9999"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="address" className="eyebrow mb-2 block">
              Endereço
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={form.address}
              onChange={update}
              placeholder="Rua, número e complemento"
              className="field"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label htmlFor="city" className="eyebrow mb-2 block">
                Cidade
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={update}
                placeholder="São Paulo"
                className="field"
              />
            </div>
            <div>
              <label htmlFor="state" className="eyebrow mb-2 block">
                UF
              </label>
              <input
                id="state"
                name="state"
                type="text"
                maxLength={2}
                value={form.state}
                onChange={update}
                placeholder="SP"
                className="field uppercase"
              />
            </div>
          </div>

          {error && <p className="text-sm text-rose-deep">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Gerando PIX..." : "Gerar PIX e reservar minha vaga"}
          </button>

          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
            <span className="flex items-center gap-2 text-xs text-muted">
              <Lock size={13} className="text-gold" />
              Dados criptografados
            </span>
            <span className="flex items-center gap-2 text-xs text-muted">
              <ShieldCheck size={13} className="text-gold" />
              Garantia de {clinic.guaranteeDays} dias
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (step === "pix") {
    return (
      <div className="animate-fade-up rounded-card border border-line bg-surface p-7 shadow-soft sm:p-10">
        <div className="text-center">
          <p className="eyebrow">Pagamento</p>
          <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
            Seu PIX está pronto
          </h2>
          <p className="mt-3 text-muted">
            Copie a chave abaixo e pague no app do seu banco.
          </p>
        </div>

        {/* Remova este bloco assim que o provedor de PIX real estiver integrado. */}
        <div className="mt-7 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-5 py-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-900">
            <strong className="font-medium">Ambiente de teste.</strong> A
            integração de pagamento ainda não está ativa — esta chave não recebe
            transferências. Não divulgue esta página até concluir a integração.
          </p>
        </div>

        <div className="mt-7 rounded-lg bg-cream/70 p-6">
          <p className="eyebrow">Chave PIX</p>
          <div className="mt-2 flex items-center gap-3">
            <code className="flex-1 overflow-x-auto rounded-lg border border-line bg-white px-4 py-3 font-mono text-sm text-ink">
              {pix?.pixKey}
            </code>
            <button
              onClick={copyKey}
              aria-label="Copiar chave PIX"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg
                         bg-rose text-white transition-colors hover:bg-rose-deep"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          <dl className="mt-5 flex flex-col gap-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Valor</dt>
              <dd className="font-medium text-ink">{brl(pix?.amount ?? finalPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Referência</dt>
              <dd className="font-mono text-xs text-ink">{pix?.reference}</dd>
            </div>
          </dl>
        </div>

        <ol className="mt-7 flex flex-col gap-4">
          {[
            "Copie a chave e faça o PIX no app do seu banco",
            "Envie o comprovante para a nossa equipe",
            "Agende sua primeira sessão com a doutora",
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-soft font-display text-sm text-gold">
                {i + 1}
              </span>
              <span className="text-[15px] leading-relaxed text-ink">{text}</span>
            </li>
          ))}
        </ol>

        <button onClick={() => setStep("success")} className="btn-primary mt-8 w-full">
          Já efetuei o pagamento
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up rounded-card border border-line bg-surface p-7 text-center shadow-soft sm:p-12">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft">
        <Check size={28} className="text-gold" strokeWidth={2.5} />
      </span>

      <h2 className="mt-6 font-display text-3xl text-ink sm:text-4xl">
        Recebemos sua solicitação
      </h2>
      <p className="mx-auto mt-4 max-w-md text-muted">
        Assim que o pagamento for confirmado, nossa equipe entra em contato para
        agendar sua primeira sessão.
      </p>

      <div className="mt-8 rounded-lg bg-cream/70 px-6 py-5">
        <p className="eyebrow">Referência do pedido</p>
        <p className="mt-2 font-mono text-lg text-ink">{pix?.reference}</p>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4 rounded-lg bg-rose-soft/40 p-5 text-left">
        <DoctorAvatar size={48} />
        <p className="text-sm leading-relaxed text-ink">
          {clinic.doctor.name} vai acompanhar seu protocolo pessoalmente.
        </p>
      </div>

      {clinic.whatsapp && (
        <a
          href={`https://wa.me/${clinic.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-6 w-full !text-white"
        >
          <MessageCircle size={18} />
          Falar no WhatsApp
        </a>
      )}
    </div>
  );
}
