# SETUP GUIDE - STRIAÉ Funnel

## Quick Start (5 minutes)

### 1. Clone and Install
```bash
git clone https://github.com/vinicin0102/stria-.git
cd stria-app
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
ANTHROPIC_API_KEY=your_claude_api_key_here
PIX_API_KEY=your_pix_api_key_here
PIX_API_URL=https://api.payment-provider.com
```

### 3. Get Your Claude API Key

1. Go to https://console.anthropic.com
2. Sign in or create account
3. Create new API key
4. Copy and paste in `.env.local`

### 4. Run Locally
```bash
npm run dev
```

Open http://localhost:3000 and test the funnel!

---

## Funnel Test Flow

1. **Quiz** - Answer 5 questions
   - Issue type
   - Duration
   - Previous treatments
   - Goals
   - Sentiment
   - Fill name & email

2. **Chat** - Talk with AI doctor
   - Send 3 messages minimum
   - AI will respond naturally
   - Scarcity message appears

3. **Offer** - 40% discount
   - Review terms
   - Click "Aproveitar Oferta"

4. **Payment** - PIX Generation
   - Fill address data
   - Generate PIX QR code
   - Success page

---

## Customization

### Change Discount %
File: `components/OfferStep.tsx`
```typescript
const discountPercent = 40; // Change to 30, 50, etc.
```

### Change Price
File: `components/PaymentForm.tsx`
```typescript
const originalPrice = 1200; // Change to your price
```

### Change Doctor Name
File: `components/ChatWindow.tsx`
```typescript
const greeting = `Olá ${userProfile?.name}! 👋\n\nSou a Dra. Sarah...`
// Change "Dra. Sarah" to another name
```

### Change Offer Timer
File: `components/OfferStep.tsx`
```typescript
const [timeLeft, setTimeLeft] = useState(300); // 300 = 5 min
// Change to 600 (10 min), 180 (3 min), etc.
```

### Change Brand Colors
File: `tailwind.config.js`
```javascript
colors: {
  primary: "#d4006d",    // Pink - change to your color
  secondary: "#ffa500",  // Orange - change to your color
}
```

### Customize Quiz Questions
File: `components/Quiz.tsx`
```typescript
const questions = [
  {
    id: 1,
    question: "Your question here?",
    options: [
      { label: "Option 1", value: "opt1" },
      // Add more options
    ],
  },
  // Add more questions
];
```

---

## API Integration

### Current Setup
- **Chat**: Claude API (working)
- **Payment**: Placeholder (need to integrate)

### To Replace Payment Integration

Option 1: Mercado Pago
```bash
npm install mercado-pago
```

File: `pages/api/payment.ts`
```typescript
import mercadopago from "mercado-pago";

mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

// Generate PIX QR code
const qrCode = await mercadopago.createPaymentLink({
  items: [{ id: "1", title: "STRIAÉ", amount: 720 }],
  payer_email: userProfile.email,
});
```

Option 2: Stripe
```bash
npm install stripe
```

Option 3: Your Custom Backend
```typescript
const response = await fetch(process.env.PIX_API_URL, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.PIX_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amount: 720,
    customer_email: userProfile.email,
    // Your fields
  })
});
```

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Select your GitHub repo
5. Add environment variables
6. Deploy!

### Deploy to Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Select your repo
5. Add environment variables
6. Deploy!

### Deploy to Render

1. Go to https://render.com
2. Click "New +"
3. Select "Web Service"
4. Connect GitHub
5. Add environment variables
6. Deploy!

---

## Testing Checklist

- [ ] Quiz loads and submits
- [ ] Chat receives messages
- [ ] AI responds (check console for errors)
- [ ] Offer shows after 3 messages
- [ ] Timer counts down
- [ ] Payment form loads
- [ ] PIX data generates
- [ ] Mobile responsive

---

## Troubleshooting

### "ANTHROPIC_API_KEY is not valid"
- Check if key is copied correctly
- Don't add spaces before/after
- Try creating new key

### "Chat returns empty message"
- Check Claude API status page
- Verify API key permissions
- Check browser console for errors
- Look at Network tab in DevTools

### "PIX doesn't generate"
- Check if payment API endpoint is correct
- Verify all form fields are filled
- Check browser console errors
- Test API endpoint separately

### Page shows white screen
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests
- Try clearing browser cache

---

## Next Steps

1. ✅ Local setup working
2. 🔄 Integrate real payment system
3. 📧 Add email notifications
4. 📱 Add WhatsApp integration
5. 📊 Add analytics/tracking
6. 🎨 Customize branding
7. 🚀 Deploy to production

---

## Support Files

- **README.md** - Full documentation
- **.env.example** - Environment variables template
- **SETUP.md** - This file
- **package.json** - Dependencies

---

**Questions? Check README.md or contact support!**
