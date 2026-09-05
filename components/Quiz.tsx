import { useState } from "react";
import { ChevronRight } from "lucide-react";

interface QuizProps {
  onComplete: (answers: any) => void;
}

const questions = [
  {
    id: 1,
    question: "Qual é o seu principal problema de pele?",
    options: [
      { label: "Estrias", value: "estrias" },
      { label: "Celulite", value: "celulite" },
      { label: "Flacidez", value: "flacidez" },
      { label: "Combinação dos três", value: "todos" },
    ],
  },
  {
    id: 2,
    question: "Há quanto tempo você tem esse problema?",
    options: [
      { label: "Menos de 1 ano", value: "novo" },
      { label: "1-3 anos", value: "medio" },
      { label: "Mais de 3 anos", value: "cronico" },
    ],
  },
  {
    id: 3,
    question: "Você já tentou algum tratamento antes?",
    options: [
      { label: "Sim, vários", value: "varios" },
      { label: "Sim, alguns", value: "alguns" },
      { label: "Não, é a primeira vez", value: "primeira" },
    ],
  },
  {
    id: 4,
    question: "Qual é o seu principal objetivo?",
    options: [
      { label: "Reduzir a aparência", value: "reduzir" },
      { label: "Eliminar completamente", value: "eliminar" },
      { label: "Melhorar a autoestima", value: "autoestima" },
    ],
  },
  {
    id: 5,
    question: "Como você se sente em relação à sua pele?",
    options: [
      { label: "Muito insatisfeita", value: "muito_insatisfeita" },
      { label: "Insatisfeita", value: "insatisfeita" },
      { label: "Razoável", value: "razoavel" },
    ],
  },
];

export default function Quiz({ onComplete }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers };
    const key = `q${questions[currentQuestion].id}`;
    newAnswers[key] = value;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowForm(true);
    }
  };

  const handleSubmit = () => {
    if (name && email) {
      onComplete({
        ...answers,
        name,
        email,
        issues: answers.q1,
        duration: answers.q2,
        treatments: answers.q3,
        goals: answers.q4,
        sentiment: answers.q5,
      });
    } else {
      alert("Por favor, preencha seu nome e email");
    }
  };

  if (showForm) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-primary h-2 rounded-full w-full"></div>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-4">Excelente! Você tem o perfil perfeito!</h2>
          <p className="text-gray-600 mb-8">
            Com base em suas respostas, você é uma candidata ideal para o método STRIAÉ. Agora vamos conhecer você melhor!
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Seu Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Seu Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition transform hover:scale-105"
        >
          Conversar Agora com a Doutora
          <ChevronRight className="inline ml-2" size={20} />
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          ⏰ Vagas limitadas - Não demore muito!
        </p>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500">
          Pergunta {currentQuestion + 1} de {questions.length}
        </p>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-8">
        {questions[currentQuestion].question}
      </h2>

      <div className="space-y-3">
        {questions[currentQuestion].options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleAnswer(option.value)}
            className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary hover:bg-opacity-5 transition font-medium text-gray-700 hover:text-primary"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
