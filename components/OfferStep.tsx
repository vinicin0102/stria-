import { useState, useEffect } from "react";
import { Zap, X, AlertCircle } from "lucide-react";

interface OfferStepProps {
  userProfile: any;
  onAccept: () => void;
  onDecline: () => void;
}

export default function OfferStep({ userProfile, onAccept, onDecline }: OfferStepProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const originalPrice = 1200;
  const discountPercent = 40;
  const discountedPrice = originalPrice * (1 - discountPercent / 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onDecline}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary text-white p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 text-white opacity-20 text-8xl font-bold">🎁</div>
          <h2 className="text-4xl font-bold mb-2 relative z-10">Oferta Exclusiva!</h2>
          <p className="text-pink-100 text-lg relative z-10">Apenas para você que chegou até aqui</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Scarcity Alert */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
            <div>
              <p className="font-bold text-yellow-800">⚠️ Oferta Limitada</p>
              <p className="text-yellow-700 text-sm">
                Apenas {Math.floor(Math.random() * 3) + 2} clientes restantes neste horário!
              </p>
            </div>
          </div>

          {/* Offer Details */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Tratamento Completo STRIAÉ
            </h3>

            <div className="flex items-center justify-center gap-4 mb-6">
              <div>
                <p className="text-gray-500 line-through text-2xl">R$ {originalPrice.toLocaleString("pt-BR")}</p>
              </div>
              <div className="bg-primary text-white px-4 py-2 rounded-full font-bold text-lg">
                -{discountPercent}%
              </div>
              <div>
                <p className="text-primary text-4xl font-bold">R$ {discountedPrice.toLocaleString("pt-BR")}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-2">Você economiza: <span className="font-bold text-primary">R$ {(originalPrice - discountedPrice).toLocaleString("pt-BR")}</span></p>
          </div>

          {/* What's Included */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h4 className="font-bold text-gray-800 mb-4">O que está incluído:</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-primary font-bold">✓</span> 4 sessões de tratamento STRIAÉ
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary font-bold">✓</span> Acompanhamento personalizado com doutora
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary font-bold">✓</span> Produtos cosméticos complementares
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary font-bold">✓</span> Garantia de satisfação 100%
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary font-bold">✓</span> Suporte via WhatsApp 24/7
              </li>
            </ul>
          </div>

          {/* Timer */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-8 text-center">
            <p className="text-red-800 font-bold text-lg mb-2">⏰ Oferta expira em:</p>
            <p className="text-4xl font-bold text-red-600">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </p>
            <p className="text-red-700 text-sm mt-2">Depois desse tempo, o preço volta ao normal!</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onAccept}
              className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Zap size={20} />
              Aproveitar Oferta Agora!
            </button>
            <button
              onClick={onDecline}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded-lg font-bold hover:bg-gray-50 transition"
            >
              Recusar
            </button>
          </div>

          {/* Trust Signal */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              ✅ 100% seguro | 🔒 Pagamento criptografado | 📱 PIX aceito
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
