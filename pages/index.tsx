import Head from "next/head";
import { useState } from "react";
import Quiz from "../components/Quiz";
import ChatWindow from "../components/ChatWindow";
import { clinic } from "../config/clinic";

export default function Home() {
  // null = ainda no quiz. Preenchido = ela já respondeu e vai para o chat.
  const [perfil, setPerfil] = useState<any>(null);

  return (
    <>
      <Head>
        {/* String única: interpolar texto solto faz o React vazar
            separadores de nó (<!-- -->) para dentro do título. */}
        <title>{`${clinic.name} — Converse com a ${clinic.doctor.name}`}</title>
      </Head>

      {/* Trava de rolagem só no chat. O quiz é mais alto que a tela do
          celular, e prender a página cortaria as últimas alternativas. */}
      <div
        className={`flex flex-col bg-cream ${perfil ? "app-shell" : "min-h-screen"}`}
      >
        {/* Cabeçalho, margens e rodapé encolhem no celular para devolver
            altura à conversa; no computador sobra tela e eles ficam como
            estavam. */}
        <header className="shrink-0 border-b border-line bg-cream/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 px-5 py-3 sm:gap-2 sm:py-7">
            <h1 className="font-display text-2xl font-normal tracking-[.22em] text-ink sm:text-5xl">
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

        {/* Quiz para entender o caso, depois a conversa com a doutora:
            descoberta, oferta, dados e PIX, tudo no mesmo lugar. */}
        {/* min-h-0: sem isso o filho flex se recusa a encolher e volta a
            empurrar a página para baixo. */}
        <main className="mx-auto flex w-full min-h-0 max-w-3xl flex-1 px-2 py-2 sm:px-5 sm:py-14">
          {perfil ? (
            <ChatWindow userProfile={perfil} />
          ) : (
            <div className="w-full self-start">
              <Quiz onComplete={setPerfil} />
            </div>
          )}
        </main>

        {/* Some do celular durante a conversa: ali a tela é disputada e o
            aviso de copyright é a linha que menos faz falta. */}
        <footer
          className={`shrink-0 px-5 py-3 sm:py-6 ${perfil ? "hidden sm:block" : ""}`}
        >
          <p className="text-center text-xs text-muted/70">
            © {new Date().getFullYear()} {clinic.name}. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </>
  );
}
