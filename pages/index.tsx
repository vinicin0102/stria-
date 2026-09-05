import { useState } from "react";
import Head from "next/head";
import { ShieldCheck, Stethoscope, Lock } from "lucide-react";
import Quiz from "../components/Quiz";
import ChatWindow from "../components/ChatWindow";
import OfferStep from "../components/OfferStep";
import PaymentForm from "../components/PaymentForm";
import { clinic } from "../config/clinic";

type Stage = "quiz" | "chat" | "offer" | "payment";

const MESSAGES_BEFORE_OFFER = 3;

export default function Home() {
  const [stage, setStage] = useState<Stage>("quiz");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [offerUnlocked, setOfferUnlocked] = useState(false);

  const handleQuizComplete = (answers: any) => {
    setUserProfile(answers);
    setStage("chat");
  };

  const handleMessageCount = (count: number) => {
    if (count >= MESSAGES_BEFORE_OFFER && !offerUnlocked) {
      setOfferUnlocked(true);
      setStage("offer");
    }
  };

  return (
    <>
      <Head>
        {/* String única: interpolar texto solto faz o React vazar
            separadores de nó (<!-- -->) para dentro do título. */}
        <title>{`${clinic.name} — Avaliação personalizada da sua pele`}</title>
      </Head>

      <div className="flex min-h-screen flex-col bg-cream">
        <header className="border-b border-line bg-cream/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-5 py-7">
            <h1 className="font-display text-4xl font-normal tracking-[.22em] text-ink sm:text-5xl">
              {clinic.name}
            </h1>
            <div className="flex items-center gap-3">
              {/* Os filetes só aparecem quando cabem na mesma linha do texto;
                  no celular a tagline quebra e eles ficariam desalinhados. */}
              <span className="rule-gold hidden sm:block" />
              <span className="eyebrow text-center">{clinic.tagline}</span>
              <span className="rule-gold hidden sm:block" />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
          {stage === "quiz" && <Quiz onComplete={handleQuizComplete} />}

          {/* O chat continua montado por trás da oferta: desmontá-lo apagaria
              a conversa quando a cliente volta atrás. */}
          {(stage === "chat" || stage === "offer") && (
            <ChatWindow
              userProfile={userProfile}
              onMessageCount={handleMessageCount}
              offerUnlocked={offerUnlocked}
              onReopenOffer={() => setStage("offer")}
            />
          )}

          {stage === "offer" && (
            <OfferStep
              onAccept={() => setStage("payment")}
              onDecline={() => setStage("chat")}
            />
          )}

          {stage === "payment" && <PaymentForm userProfile={userProfile} />}
        </main>

        <footer className="border-t border-line bg-cream-deep/50">
          <div className="mx-auto max-w-3xl px-5 py-8">
            <ul className="flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:gap-8">
              <li className="flex items-center gap-2 text-sm text-muted">
                <Stethoscope size={16} className="text-gold" />
                Acompanhamento profissional
              </li>
              <li className="flex items-center gap-2 text-sm text-muted">
                <Lock size={16} className="text-gold" />
                Pagamento criptografado
              </li>
              <li className="flex items-center gap-2 text-sm text-muted">
                <ShieldCheck size={16} className="text-gold" />
                Garantia de {clinic.guaranteeDays} dias
              </li>
            </ul>
            <p className="mt-6 text-center text-xs text-muted/70">
              © {new Date().getFullYear()} {clinic.name}. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
