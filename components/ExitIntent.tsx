import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import DoctorAvatar from "./DoctorAvatar";
import { clinic, priceOf, brl } from "../config/clinic";
import { track } from "../lib/pixel";

const JA_MOSTRADO = "striae_exit_intent";

const padrao = priceOf("padrao");
const resgate = priceOf("resgate");

interface ExitIntentProps {
  // Chamado quando ela decide ficar: destrava o preço menor de verdade.
  onStay: () => void;
}

export default function ExitIntent({ onStay }: ExitIntentProps) {
  const [aberto, setAberto] = useState(false);

  const ficar = () => {
    track("RescueAccepted", { valor: resgate });
    onStay();
    setAberto(false);
  };

  useEffect(() => {
    // Uma vez por visita. Repetir a cada movimento do mouse vira praga.
    try {
      if (sessionStorage.getItem(JA_MOSTRADO)) return;
    } catch {
      /* navegador sem storage: segue e mostra uma vez na memória */
    }

    let disparado = false;
    const disparar = () => {
      if (disparado) return;
      disparado = true;
      try {
        sessionStorage.setItem(JA_MOSTRADO, "1");
      } catch {}
      track("ExitIntent");
      setAberto(true);
    };

    // Desktop: o cursor sobe para além do topo da janela, indo para a aba
    // ou para a barra de endereço.
    const aoSair = (e: MouseEvent) => {
      if (e.clientY <= 0) disparar();
    };
    document.addEventListener("mouseleave", aoSair);

    // Celular não tem mouseleave. O sinal equivalente é o botão voltar:
    // uma entrada extra no histórico deixa interceptar o primeiro toque.
    // Não prende ninguém — o segundo toque sai normalmente.
    history.pushState(null, "", location.href);
    const aoVoltar = () => {
      if (disparado) return;
      history.pushState(null, "", location.href);
      disparar();
    };
    window.addEventListener("popstate", aoVoltar);

    return () => {
      document.removeEventListener("mouseleave", aoSair);
      window.removeEventListener("popstate", aoVoltar);
    };
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Antes de sair"
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center
                 bg-ink/45 p-4 backdrop-blur-sm"
    >
      <div className="animate-scale-in relative w-full max-w-sm rounded-card bg-surface p-7 text-center shadow-modal sm:p-8">
        <button
          onClick={() => setAberto(false)}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center
                     rounded-full text-muted transition-colors hover:bg-cream hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="flex justify-center">
          <DoctorAvatar size={64} />
        </div>

        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold-soft px-3.5 py-1.5">
          <Sparkles size={12} className="text-gold" />
          <span className="eyebrow !text-ink">Espere um instante</span>
        </span>

        <h2 className="mt-4 font-display text-2xl leading-snug text-ink sm:text-3xl">
          Espere — tenho algo melhor para você
        </h2>

        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Se continuar agora, a {clinic.doctor.name} libera o método por{" "}
          <span className="font-medium text-rose-deep">{brl(resgate)}</span> em
          vez de {brl(padrao)} no final da conversa.
        </p>

        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Fechando a página, sua avaliação se perde e tudo recomeça do zero.
        </p>

        <button onClick={ficar} className="btn-primary mt-6 w-full">
          Quero o desconto e continuo
        </button>

        <button
          onClick={() => setAberto(false)}
          className="mt-3 text-xs text-muted underline underline-offset-2
                     transition-colors hover:text-rose"
        >
          Prefiro sair mesmo assim
        </button>
      </div>
    </div>
  );
}
