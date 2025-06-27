import { useState } from 'react';


 declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Chatbot() {
  const [question, setQuestion] = useState('');
  

  

 const startListening = (language: string = "hi-IN") => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = language;
  recognition.interimResults = false;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    console.log("Transcript:", transcript);
    // You can pass this to your message handler
  };

  recognition.start();
};

const handleSend = async (message: string) => {
  setLoading(true);

  try {
    const res = await fetch("https://webhook-uafc.onrender.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryResult: {
          intent: {
            displayName: "wastetype", // or dynamic intent name
          },
          parameters: {
            wastetype: message, // assuming user types "cow dung" etc.
          },
        },
      }),
    });

    const data = await res.json();
    setAnswer(data.fulfillmentText);
  } catch (err) {
    setAnswer("Something went wrong. Please try again.");
  }

  setLoading(false);
};


const [answer, setAnswer] = useState("");
const [loading, setLoading] = useState(false);

return (
  <>
    <input
      type="text"
      value={question}
      onChange={(e) => setQuestion(e.target.value)}
    />
    <button onClick={() => handleSend(question)}>Send</button>

    {loading ? <p>Loading...</p> : <p>{answer}</p>}
  </>
);


  const handleAsk = async () => {
    setLoading(true);
    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setAnswer(data.text);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8, marginTop: 30 }}>
      <h3>🤖 Ask Our App Assistant</h3>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask something about the app..."
        style={{ width: '80%', padding: 8 }}
      />
      <button onClick={handleAsk} disabled={loading} style={{ marginLeft: 10, padding: 8 }}>
        {loading ? 'Thinking...' : 'Ask'}
      </button>
      {answer && (
        <div style={{ marginTop: 20, backgroundColor: '#f9f9f9', padding: 10 }}>
          <strong>Bot:</strong> {answer}
        </div>
      )}
    </div>
  );
}