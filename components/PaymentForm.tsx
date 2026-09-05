import { useState } from "react";
import { Copy, Check, Phone, Mail } from "lucide-react";
import axios from "axios";

interface PaymentFormProps {
  userProfile: any;
}

export default function PaymentForm({ userProfile }: PaymentFormProps) {
  const [step, setStep] = useState<"form" | "pix" | "success">("form");
  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGeneratePix = async () => {
    if (!formData.phone || !formData.address || !formData.city || !formData.state) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/payment", {
        userProfile: { ...userProfile, ...formData },
        amount: 720, // 40% discount price
      });

      setPixData(response.data.pix);
      setStep("pix");
    } catch (error) {
      console.error("Error generating PIX:", error);
      alert("Erro ao gerar PIX. Tente novamente!");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === "form") {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-primary mb-2">Finalize Seu Pedido</h2>
        <p className="text-gray-600 mb-8">Preencha seus dados para gerar o PIX de pagamento</p>

        <div className="space-y-6 mb-8">
          {/* Display user info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Cliente</p>
            <p className="font-bold text-gray-800">{userProfile.name}</p>
            <p className="text-sm text-gray-600">{userProfile.email}</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Phone size={16} className="inline mr-2" />
              Telefone/WhatsApp
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(11) 9 9999-9999"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Endereço</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Rua, número, complemento"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* City and State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cidade</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="São Paulo"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="SP"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-primary bg-opacity-10 border-2 border-primary rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Preço original:</span>
              <span className="text-gray-700 line-through">R$ 1.200,00</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Desconto (40%):</span>
              <span className="text-red-600 font-bold">-R$ 480,00</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold text-primary border-t border-primary border-opacity-20 pt-2">
              <span>Total a pagar:</span>
              <span>R$ 720,00</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleGeneratePix}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition transform hover:scale-105 disabled:opacity-50"
        >
          {loading ? "Gerando PIX..." : "Gerar PIX para Pagamento"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          ✅ Todos os seus dados estão seguros e criptografados
        </p>
      </div>
    );
  }

  if (step === "pix") {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">PIX Gerado com Sucesso!</h2>
          <p className="text-gray-600">Escaneie o QR code ou use a chave de pagamento abaixo</p>
        </div>

        {/* PIX QR Code Placeholder */}
        <div className="bg-gray-100 rounded-lg p-8 mb-8 text-center">
          <div className="bg-white inline-block p-4 rounded-lg border-4 border-primary">
            <div className="w-64 h-64 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white">
              <div className="text-center">
                <p className="text-sm mb-2">QR CODE</p>
                <p className="text-xs">{pixData?.pixKey}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">Dados da Transferência:</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">Chave PIX:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white p-2 rounded border border-gray-300 text-sm font-mono">
                  {pixData?.pixKey}
                </code>
                <button
                  onClick={() => copyToClipboard(pixData?.pixKey)}
                  className="bg-primary text-white p-2 rounded hover:bg-opacity-90 transition"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Valor:</p>
              <p className="font-bold text-lg text-gray-800">R$ {pixData?.amount.toLocaleString("pt-BR")}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Referência:</p>
              <p className="font-mono text-sm text-gray-800">{pixData?.reference}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Expira em:</p>
              <p className="text-sm text-red-600 font-bold">1 hora</p>
            </div>
          </div>
        </div>

        {/* After Payment Instructions */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <p className="font-bold text-yellow-800 mb-2">📲 Próximos Passos:</p>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Faça a transferência PIX agora mesmo</li>
            <li>Envie o comprovante para nosso WhatsApp</li>
            <li>Marque sua primeira sessão com a doutora</li>
          </ol>
        </div>

        {/* Contact */}
        <div className="bg-primary bg-opacity-10 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-gray-800 mb-4">Dúvidas? Fale Conosco:</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-bold">
              <Phone size={18} />
              Chamar no WhatsApp
            </button>
            <button className="w-full flex items-center gap-2 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-bold">
              <Mail size={18} />
              Enviar Email
            </button>
          </div>
        </div>

        <button
          onClick={() => setStep("success")}
          className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transition"
        >
          Já Efetuei o Pagamento
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto text-center">
      <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
        <span className="text-6xl">🎉</span>
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Parabéns!</h2>
      <p className="text-gray-600 text-lg mb-8">
        Sua compra foi realizada com sucesso! Você receberá um email de confirmação em breve.
      </p>

      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-600 mb-2">Referência do Pedido:</p>
        <p className="font-bold text-2xl text-green-600">{pixData?.reference}</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-100 p-6 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Próximo Passo:</p>
          <p className="font-bold text-gray-800 mb-3">Nossa equipe entrará em contato em breve para agendar sua primeira sessão!</p>
          <p className="text-gray-600 text-sm">Fique atento ao seu email e WhatsApp</p>
        </div>

        <a
          href="https://wa.me/5511999999999?text=Olá! Realizei a compra do pacote STRIAÉ e gostaria de agendar minha primeira sessão."
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-green-500 text-white py-4 rounded-lg font-bold hover:bg-green-600 transition"
        >
          💬 Conversar no WhatsApp
        </a>
      </div>
    </div>
  );
}
