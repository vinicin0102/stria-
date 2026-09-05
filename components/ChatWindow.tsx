import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import axios from "axios";

interface ChatWindowProps {
  userProfile: any;
  onMessageCount: (count: number) => void;
  showOffer: boolean;
}

export default function ChatWindow({ userProfile, onMessageCount, showOffer }: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting from doctor
    const greeting = `Olá ${userProfile?.name}! 👋\n\nSou a Dra. Sarah, especialista em dermatologia da clínica STRIAÉ. Vi aqui que você tem interesse em resolver seus problemas com ${userProfile?.issues}.\n\nEu adoraria ajudar você a transformar sua pele! Como você se sente em relação à sua situação atual?`;

    setMessages([{ role: "assistant", content: greeting, isDoctor: true }]);
  }, [userProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage, isDoctor: false }]);

    try {
      const response = await axios.post("/api/chat-gemini", {
        message: userMessage,
        userProfile,
        messageCount: messageCount + 1,
      });

      setMessageCount((prev) => prev + 1);
      onMessageCount(messageCount + 1);

      // Add assistant response
      setMessages((prev) => [...prev, { role: "assistant", content: response.data.message, isDoctor: true }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, tive um problema para responder. Tente novamente!",
          isDoctor: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (showOffer) {
    return null; // The offer will be shown by parent component
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-2xl mx-auto">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <h2 className="text-2xl font-bold">Chat com Dra. Sarah</h2>
        <p className="text-pink-100 text-sm">Especialista em Dermatologia</p>
        {messageCount >= 2 && (
          <p className="text-yellow-200 text-xs mt-2">⚡ Oferta especial chegando em breve!</p>
        )}
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-6 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-4 flex ${msg.isDoctor ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg whitespace-pre-wrap ${
                msg.isDoctor
                  ? "bg-primary text-white rounded-bl-none"
                  : "bg-secondary text-white rounded-br-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-primary text-white px-4 py-3 rounded-lg rounded-bl-none">
              <span className="inline-block w-2 h-2 bg-white rounded-full mr-1 animate-bounce"></span>
              <span className="inline-block w-2 h-2 bg-white rounded-full mr-1 animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Digite sua mensagem..."
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 font-semibold flex items-center gap-2"
          >
            <Send size={18} />
            Enviar
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">💬 {messageCount}/3 mensagens antes da oferta</p>
      </div>
    </div>
  );
}
