import { useState } from "react";
import Quiz from "../components/Quiz";
import ChatWindow from "../components/ChatWindow";
import OfferStep from "../components/OfferStep";
import PaymentForm from "../components/PaymentForm";

export default function Home() {
  const [stage, setStage] = useState<"quiz" | "summary" | "chat" | "offer" | "payment">("quiz");
  const [quizAnswers, setQuizAnswers] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [showOffer, setShowOffer] = useState(false);

  const handleQuizComplete = (answers: any) => {
    setQuizAnswers(answers);
    setUserProfile({
      issues: answers.issues,
      duration: answers.duration,
      treatments: answers.treatments,
      goals: answers.goals,
      name: answers.name,
    });
    setStage("chat");
  };

  const handleChatMessage = (messageCount: number) => {
    setMessageCount(messageCount);
    if (messageCount >= 3 && !showOffer) {
      setShowOffer(true);
      setStage("offer");
    }
  };

  const handleAcceptOffer = () => {
    setStage("payment");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-8 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-2">STRIAÉ</h1>
          <p className="text-center text-pink-100">Seu Caminho para a Pele Perfeita</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {stage === "quiz" && (
          <Quiz onComplete={handleQuizComplete} />
        )}

        {stage === "chat" && (
          <ChatWindow
            userProfile={userProfile}
            onMessageCount={handleChatMessage}
            showOffer={showOffer}
          />
        )}

        {stage === "offer" && (
          <OfferStep
            userProfile={userProfile}
            onAccept={handleAcceptOffer}
            onDecline={() => setStage("chat")}
          />
        )}

        {stage === "payment" && (
          <PaymentForm userProfile={userProfile} />
        )}
      </div>

      {/* Footer */}
      <div className="bg-dark text-light text-center py-8 mt-16">
        <p className="text-sm">© 2024 STRIAÉ. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
