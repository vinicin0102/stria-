import Head from "next/head";
import ChatWindow from "../components/ChatWindow";
import { clinic } from "../config/clinic";

export default function Home() {
  return (
    <>
      <Head>
        {/* String única: interpolar texto solto faz o React vazar
            separadores de nó (<!-- -->) para dentro do título. */}
        <title>{`${clinic.name} — Converse com a ${clinic.doctor.name}`}</title>
      </Head>

      <div className="app-shell flex flex-col bg-cream">
        <header className="shrink-0 border-b border-line bg-cream/90 backdrop-blur-sm">
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

        {/* Funil inteiro numa conversa só: apresentação, descoberta,
            oferta, dados e PIX. */}
        {/* min-h-0: sem isso o filho flex se recusa a encolher e volta a
            empurrar a página para baixo. */}
        <main className="mx-auto flex w-full min-h-0 max-w-3xl flex-1 px-3 py-6 sm:px-5 sm:py-14">
          <ChatWindow />
        </main>

        <footer className="shrink-0 px-5 py-6">
          <p className="text-center text-xs text-muted/70">
            © {new Date().getFullYear()} {clinic.name}. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </>
  );
}
