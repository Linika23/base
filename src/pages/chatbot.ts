// import type { NextApiRequest, NextApiResponse } from 'next';
// import { GoogleGenerativeAI } from '@google/generative-ai';

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

//   const { question } = req.body;

//   const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

//  const prompt = `
// You are SAATHI, a smart multilingual AI chatbot for the Waste-to-Wealth (W2W) platform.

// W2W is a platform that helps Indian farmers earn money by selling agricultural waste to industries. Here's exactly how it works:

// 💡 *Platform Workflow:*

// 1. 🧑‍🌾 Farmers register by filling a simple form (with help if needed).
// 2. 📤 They upload details of agricultural waste (like type, quantity, location) in any language or via voice.
// 3. 🏭 Industries register and post their waste needs.
// 4. 💰 The app has a *bidding system* where industries bid on waste listings.
// 5. ✅ Farmers choose the best bid and confirm the deal.
// 6. 🚛 A logistics team is auto-assigned to pick up and deliver the waste.
// 7. 📱 Both sides can track all deals and payments through a dashboard.
// 8. 🌐 Chatbot SAATHI supports *voice + any Indian language* to guide farmers at every step.

// 🎯 You must respond as if you're this expert chatbot. Answer in clear, simple language. 
// Give full explanations for questions like:
// - What is the use of the app?
// - What is the workflow?
// - How can an illiterate farmer use it?
// - How do industries connect?
// - How does bidding work?

// 📵 If the user asks something unrelated (e.g., jokes, weather), say:
// "I'm designed to help with the Waste-to-Wealth platform. Please ask about farming, waste, or industries."

// User's question: ${question}
// `;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = result.response.text();
//     res.status(200).json({ reply: response });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ reply: 'Something went wrong. Please try again.' });
//   }
// }

import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { question } = req.body;

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
You are SAATHI, a smart multilingual AI chatbot for the Waste-to-Wealth (W2W) platform.

W2W is a platform that helps Indian farmers earn money by selling agricultural waste to industries. Here's how it works:

1.  Farmers register by filling a simple form.
2.  They upload agri-waste info (type, quantity, location).
3. Industries register and post waste needs.
4.  Industries bid on farmer listings.
5. Farmers pick best offer.
6.  Platform arranges pickup and delivery.
7.  Both parties track deals on dashboards.
8.   SAATHI supports voice and local language chat.

 Always respond clearly and only about this app. If asked irrelevant things, say:
"I'm here to assist only with the Waste-to-Wealth platform."

Now answer this user question clearly:
"${question}"
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ text });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ text: "Sorry, I couldn't process your request." });
  }
}
// src/pages/api/chat.ts or app/api/chat/route.ts (based on Next.js routing)
