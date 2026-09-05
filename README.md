# STRIAÉ - Sales Funnel

Sales funnel application for STRIAÉ method with AI-powered chat, quiz, and PIX payment integration.

## Features

- 🎯 **5-Question Quiz** - Determines if user is a good candidate
- 💬 **AI Chat** - Human-like conversation with Claude API
- 🎁 **Exclusive Offer** - 40% discount displayed after 3 chat messages
- ⏰ **Scarcity & Urgency** - Countdown timer and limited spots messaging
- 💳 **PIX Payment** - Brazilian payment method integration
- 📱 **Responsive Design** - Works on desktop and mobile

## Project Structure

```
stria-app/
├── pages/
│   ├── _app.tsx              # App wrapper
│   ├── _document.tsx         # HTML document
│   ├── index.tsx             # Main funnel page
│   └── api/
│       ├── chat.ts           # Claude API integration
│       └── payment.ts        # PIX payment handler
├── components/
│   ├── Quiz.tsx              # 5-question quiz component
│   ├── ChatWindow.tsx        # AI chat interface
│   ├── OfferStep.tsx         # Exclusive offer modal
│   └── PaymentForm.tsx       # Payment form & PIX generation
├── styles/
│   └── globals.css           # Global styles
├── public/                   # Static files
└── package.json
```

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/vinicin0102/stria-.git
cd stria-app
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
- `ANTHROPIC_API_KEY` - Your Claude API key from https://console.anthropic.com
- `PIX_API_KEY` - Your payment provider API key
- `PIX_API_URL` - Your payment provider endpoint

4. **Run development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Funnel Flow

1. **Quiz Stage** (Pages: 1-5)
   - 5 questions about skin issues
   - Collects name and email
   - Shows success message

2. **Chat Stage**
   - AI doctor conversation
   - Powered by Claude API
   - Natural, empathetic responses
   - Tracks message count

3. **Offer Stage** (Triggered after 3 messages)
   - 40% discount offer (R$ 1200 → R$ 720)
   - 5-minute countdown timer
   - Scarcity messaging
   - Call-to-action button

4. **Payment Stage**
   - Collect address details
   - Generate PIX QR code
   - Payment confirmation
   - Success page with next steps

## Configuration

### Colors
Edit `tailwind.config.js` to change brand colors:
- `primary`: Main brand color (currently: #d4006d - pink)
- `secondary`: Accent color (currently: #ffa500 - orange)

### Chat System Prompt
Customize doctor behavior in `pages/api/chat.ts`:
- Modify `systemPrompt` to change conversation style
- Adjust `max_tokens` for response length
- Change `model` to use different Claude version

### Pricing
Update payment amounts in:
- `components/OfferStep.tsx` - Offer display
- `components/PaymentForm.tsx` - Final price
- `pages/api/payment.ts` - Backend processing

### Timer
Modify offer countdown in `components/OfferStep.tsx`:
- Change `useState(300)` to adjust seconds (300 = 5 minutes)

## API Integration

### Claude API (Chat)
The chat endpoint calls Claude API to generate human-like responses:
```
POST /api/chat
Body: { message, userProfile, messageCount }
Returns: { message, messageCount }
```

### PIX Payment
The payment endpoint generates PIX data:
```
POST /api/payment
Body: { userProfile, amount }
Returns: { success, pix, message }
```

Currently returns placeholder PIX data. Replace with your payment provider:
- Mercado Pago
- Stripe
- Your custom payment backend

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel login
vercel
```

### Railway / Render
1. Connect GitHub repo
2. Set environment variables in dashboard
3. Deploy

## Customization

### Quiz Questions
Edit questions array in `components/Quiz.tsx`

### Chat Messages
Modify `systemPrompt` in `pages/api/chat.ts`

### Offer Details
Update pricing, discount, and messaging in `components/OfferStep.tsx`

### Payment Fields
Add/remove fields in `components/PaymentForm.tsx`

## Security Notes

- Never commit `.env.local` file
- Use strong API keys
- Validate all user input on backend
- Use HTTPS in production
- Implement CSRF protection
- Sanitize user data before storage

## Performance Tips

- Lazy load components
- Optimize images
- Enable compression
- Cache static assets
- Use CDN for media files

## Troubleshooting

**Chat not working:**
- Check `ANTHROPIC_API_KEY` is set correctly
- Verify API key has access to Claude models
- Check network tab for API errors

**PIX not generating:**
- Verify payment API endpoint is correct
- Check environment variables
- Test API endpoint separately

**Quiz not submitting:**
- Ensure name and email are filled
- Check browser console for errors
- Verify form validation logic

## Support

For issues or questions:
- Create GitHub issue
- Email: support@stria.com
- WhatsApp: +55 11 99999-9999

## License

All rights reserved © 2024 STRIAÉ

## Contributing

Pull requests welcome! Please follow coding standards and add tests.

---

**Made with ❤️ for STRIAÉ - Your Path to Perfect Skin**
