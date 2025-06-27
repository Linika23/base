
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { v4 as uuidv4 } from 'uuid';


export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // Switch to gemini-1.5-flash as it might be less prone to overload issues
  model: 'googleai/gemini-1.5-flash',
});

import { SessionsClient } from '@google-cloud/dialogflow';
import path from 'path';



const sessionClient = new SessionsClient({
 keyFilename: path.join(process.cwd(), 'credentials', 'plucky-cascade-xxxxx.json'),



});

export async function detectIntentFromDialogflow(text: string) {
  const sessionId = uuidv4(); // unique session per user
  const sessionPath = sessionClient.projectAgentSessionPath(
    'plucky-cascade-464113', // your GCP project ID
    sessionId
  );

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text,
        languageCode: 'en', // or 'hi', 'fr', etc.
      },
    },
  };

  const responses = await sessionClient.detectIntent(request);
  const result = responses[0].queryResult;
  return result;
}




export default sessionClient;



