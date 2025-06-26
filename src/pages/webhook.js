// src/pages/api/webhook.js
// /src/pages/api/webhook.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    const intent = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;

    let responseText = '';

    if (intent === 'wastetype') {
      const wastetype = parameters['wastetype']?.toLowerCase();
      if (wastetype === 'cow dung') {
        responseText = 'Industries are buying cow dung for ₹2/kg.';
      } else if (wastetype === 'husk') {
        responseText = 'Industries are buying husk for ₹3/kg.';
      } else if (wastetype === 'sugarcane waste') {
        responseText = 'Industries are buying sugarcane waste from ₹2/kg to ₹4/kg.';
      } else {
        responseText = "Sorry, I don't have info about that waste.";
      }
    }

    res.status(200).json({ fulfillmentText: responseText });
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
