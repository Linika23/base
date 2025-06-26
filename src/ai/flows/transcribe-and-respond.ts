
'use server';
/**
 * @fileOverview Transcribes voice input, detects the language, handles identity questions, and generates a response.
 *
 * - transcribeAndRespond - A function that handles voice transcription, language detection, identity checks, and response generation.
 * - TranscribeAndRespondInput - The input type for the transcribeAndRespond function.
 * - TranscribeAndRespondOutput - The return type for the transcribeAndRespond function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { searchAnythingTool } from './tools/search'; // Corrected import path

const TranscribeAndRespondInputSchema = z.object({
  voiceDataUri: z
    .string()
    .describe(
      "A voice recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAndRespondInput = z.infer<typeof TranscribeAndRespondInputSchema>;

const TranscribeAndRespondOutputSchema = z.object({
  transcribedText: z.string().describe('The transcribed text from the voice input.'),
  detectedLanguage: z.string().describe('The detected language code of the transcribed text (e.g., en, es, fr, hi, bn).'),
  responseText: z.string().describe('The AI-generated response in the detected language.'),
});
export type TranscribeAndRespondOutput = z.infer<typeof TranscribeAndRespondOutputSchema>;


// Predefined identity responses (consistent with detect-and-respond)
const identityResponses: { [key: string]: string } = {
  en: "Hi, I’m Saathi – your multilingual farming friend. Ask me anything about agri-waste, farming methods, or help!",
  hi: "नमस्कार! मैं आपका साथी – जो आपकी भाषा में बात करता है और खेती से जुड़े हर सवाल का हल जानता है।",
  bn: "নমস্কার! আমি সাথী – যে আপনার ভাষায় বোঝে আর কৃষির বর্জ্যকে রূপান্তর করে আয়ে। চলুন শুরু করি!",
};

// Keywords to detect identity questions (case-insensitive, consistent with detect-and-respond)
const identityKeywords: { [key: string]: string[] } = {
  en: ["who are you", "what are you", "your name", "introduce yourself", "what is saathi", "who is saathi"],
  hi: ["आप कौन हैं", "तुम्हारा नाम क्या है", "अपना परिचय दें", "साथी क्या है", "साथी कौन है", "tum kaun ho", "aap kaun hain", "saathi kaun hai"],
  bn: ["আপনি কে", "তোমার নাম কি", "আপনার পরিচয় দিন", "সাথী কি", "সাথী কে", "tumi ke", "apni ke", "saathi ke"],
};


export async function transcribeAndRespond(
  input: TranscribeAndRespondInput
): Promise<TranscribeAndRespondOutput> {
  return transcribeAndRespondFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transcribeAndRespondPrompt',
  tools: [searchAnythingTool], // Make search tool available
  input: {
    schema: TranscribeAndRespondInputSchema,
  },
  output: {
    schema: TranscribeAndRespondOutputSchema,
  },
  // Updated prompt to include identity check and search tool usage
  prompt: `You are a helpful multilingual assistant named S.A.A.T.H.I. Your primary purpose is to help users with farming-related queries, especially regarding agri-waste.

  1.  **Transcribe** the following voice recording accurately: {{media url=voiceDataUri}}
  2.  **Identify the primary language** spoken in the transcription. Provide the language code (e.g., 'en' for English, 'es' for Spanish, 'hi' for Hindi, 'bn' for Bengali).
  3.  **Check for Identity Questions:** Based on the transcription, if the user asks about your identity (e.g., "who are you?", "आपका नाम क्या है?", "তুমি কে?"), DO NOT generate a new response. Instead, use the predefined identity response for the detected language.
       - English: "${identityResponses.en}"
       - Hindi: "${identityResponses.hi}"
       - Bengali: "${identityResponses.bn}"
       If the detected language is not English, Hindi, or Bengali, use the English identity response as a fallback.
  4.  **Check for Real-time Data Needs:** If the transcribed text requires current, real-time information (like market prices, weather forecasts, news), use the 'searchAnythingTool' to find the relevant information online. Summarize the search results in your response. **Only use the tool if explicitly needed for real-time data.** Do not use it for general knowledge questions.
  5.  **General Response:** If it's not an identity question and doesn't require real-time data, generate a relevant and helpful response to the transcribed text *in the same language you identified*.
  6.  **Return Format:** Return the transcription, the detected language code, and your response (either predefined identity, search result summary, or generated response). Ensure your output strictly follows the requested JSON format.
  `,
});

const transcribeAndRespondFlow = ai.defineFlow<
  typeof TranscribeAndRespondInputSchema,
  typeof TranscribeAndRespondOutputSchema
>(
  {
    name: 'transcribeAndRespondFlow',
    inputSchema: TranscribeAndRespondInputSchema,
    outputSchema: TranscribeAndRespondOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('AI model did not return a valid output structure for transcription/response.');
      }

      // Validate transcription
      if (!output.transcribedText || typeof output.transcribedText !== 'string') {
           console.warn(`Model returned invalid transcription: '${output.transcribedText}'. Setting to empty string.`);
           output.transcribedText = ''; // Fallback transcription
      }
      const lowerTranscribedText = output.transcribedText.toLowerCase().trim();


      // Validate language code format (simple check)
      const langRegex = /^[a-z]{2,3}(?:-[A-Z]{2,3})?$/;
      if (!output.detectedLanguage || !langRegex.test(output.detectedLanguage)) {
          console.warn(`Model returned invalid language code: '${output.detectedLanguage}'. Falling back to 'en'.`);
          output.detectedLanguage = 'en'; // Fallback language
      }

      // Post-check for identity based on transcription (Safety net)
      let identityHandled = false;
      for (const lang in identityKeywords) {
        if (identityKeywords[lang].some(keyword => lowerTranscribedText.includes(keyword))) {
           console.log(`Identity question detected in transcription post-AI for lang: ${lang}`);
           const responseLang = identityResponses[lang] ? lang : 'en';
           // Override AI response if it missed the identity instruction
           if (output.responseText !== (identityResponses[responseLang] || identityResponses.en)) {
               console.log("Overriding AI response with predefined identity response based on transcription.");
               output.responseText = identityResponses[responseLang] || identityResponses.en;
               // Ensure detectedLanguage matches the identity response language
               output.detectedLanguage = responseLang;
           }
           identityHandled = true;
           break; // Exit loop once detected
        }
      }

       // If identity was handled, ensure the detected language matches the response language
       if (identityHandled && output.detectedLanguage !== (identityResponses[output.detectedLanguage] ? output.detectedLanguage : 'en')) {
           console.warn(`Adjusting detectedLanguage to match identity response language: ${identityResponses[output.detectedLanguage] ? output.detectedLanguage : 'en'}`);
           output.detectedLanguage = identityResponses[output.detectedLanguage] ? output.detectedLanguage : 'en';
       }

      return output;

    } catch (error: any) {
      console.error('Error in transcribeAndRespond flow:', error);

      // Check for specific API errors (like 503)
      if (error.message && error.message.includes('503 Service Unavailable')) {
          console.error('Google AI Service Unavailable (503). Model may be overloaded.');
          throw new Error('The AI service is temporarily unavailable (overloaded). Please try again in a moment.');
      }
       // Check for authentication errors
       if (error.message && (error.message.includes('API key not valid') || error.message.includes('Could not refresh access token'))) {
           console.error('Authentication error with Google AI API.');
           throw new Error('There was an authentication issue with the AI service. Please check the configuration.');
       }
        // Check for tool-related errors
        if (error.message && error.message.includes('PermissionDenied')) {
            console.error('Tool execution permission denied:', error);
            throw new Error('Could not execute the required tool due to permission issues. Please check the configuration.');
        }
        if (error.message && error.message.includes('failed to call tool')) {
           console.error('Tool call failed:', error);
           throw new Error('There was an issue using an internal tool to fulfill your request.');
       }


      // General error
      throw new Error(`Failed to transcribe or get response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
