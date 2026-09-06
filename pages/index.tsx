import { useState } from "react";
import Head from "next/head";
import Quiz from "../components/Quiz";
import ChatWindow from "../components/ChatWindow";
import ExitIntent from "../components/ExitIntent";
import { clinic } from "../config/clinic";

type Stage = "quiz" | "chat";

export default function Home() {
  const [stage, setStage] = useState<Stage>("quiz");
  const [userProfile, setUserProfile] = useState<any>(null);
  // Destravado se ela aceitar ficar no aviso de saída; vale até o fim.
  const [rescue, setRescue] = useState(false);

  const handleQuizComplete = (answers: any) => {
    setUserProfile(answers);
    setStage("chat");
  };

  return (
    <>
      <Head>
        {/* String única: interpolar texto solto faz o React vazar
            separadores de nó (<!-- -->) para dentro do título. */}
        <title>{`${clinic.name} — Avaliação personalizada da sua pele`}</title>
      </Head>

      {/* Vale em qualquer etapa: quiz, conversa ou pagamento. */}
      <ExitIntent onStay={() => setRescue(true)} />

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

        <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-6 sm:px-5 sm:py-14">
          {stage === "quiz" && <Quiz onComplete={handleQuizComplete} />}

          {/* Oferta, dados e PIX acontecem dentro da conversa. */}
          {stage === "chat" && (
            <ChatWindow userProfile={userProfile} rescue={rescue} />
          )}
        </main>

        <footer className="px-5 py-6">
          <p className="text-center text-xs text-muted/70">
            © {new Date().getFullYear()} {clinic.name}. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </>
  );
}
