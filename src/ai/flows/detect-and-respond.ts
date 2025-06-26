
'use server';
/**
 * @fileOverview Detects the language of the input text and generates a response in the detected language,
 * handling specific identity questions and real-time data requests.
 *
 * - detectAndRespond - A function that handles language detection and response generation for text input.
 * - DetectAndRespondInput - The input type for the detectAndRespond function.
 * - DetectAndRespondOutput - The return type for the detectAndRespond function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { searchAnythingTool } from './tools/search'; // Corrected import path

const DetectAndRespondInputSchema = z.object({
  inputText: z.string().describe('The input text to be processed.'),
});
export type DetectAndRespondInput = z.infer<typeof DetectAndRespondInputSchema>;

const DetectAndRespondOutputSchema = z.object({
  detectedLanguage: z.string().describe('The detected language code of the input text (e.g., en, es, fr, hi, bn).'),
  responseText: z.string().describe('The AI-generated response in the detected language.'),
});
export type DetectAndRespondOutput = z.infer<typeof DetectAndRespondOutputSchema>;

export async function detectAndRespond(input: DetectAndRespondInput): Promise<DetectAndRespondOutput> {
  return detectAndRespondFlow(input);
}

// Predefined identity responses
const identityResponses: { [key: string]: string } = {
  en: "Hi, I’m Saathi – your multilingual farming friend. Ask me anything about agri-waste, farming methods, or help!",
  hi: "नमस्कार! मैं आपका साथी – जो आपकी भाषा में बात करता है और खेती से जुड़े हर सवाल का हल जानता है।",
  bn: "নমস্কার! আমি সাথী – যে আপনার ভাষায় বোঝে আর কৃষির বর্জ্যকে রূপান্তর করে আয়ে। চলুন শুরু করি!",
};

// Keywords to detect identity questions (case-insensitive)
const identityKeywords: { [key: string]: string[] } = {
  en: ["who are you", "what are you", "your name", "introduce yourself", "what is saathi", "who is saathi"],
  hi: ["आप कौन हैं", "तुम्हारा नाम क्या है", "अपना परिचय दें", "साथी क्या है", "साथी कौन है", "tum kaun ho", "aap kaun hain", "saathi kaun hai"],
  bn: ["আপনি কে", "তোমার নাম কি", "আপনার পরিচয় দিন", "সাথী কি", "সাথী কে", "tumi ke", "apni ke", "saathi ke"],
};

const prompt = ai.definePrompt({
  name: 'detectAndRespondPrompt',
  tools: [searchAnythingTool], // Make the search tool available
  input: {
    schema: DetectAndRespondInputSchema,
  },
  output: {
    schema: DetectAndRespondOutputSchema,
  },
  // Updated prompt to explicitly handle identity and use search tool
  prompt: `You are a multilingual assistant named S.A.A.T.H.I. Your primary purpose is to help users with farming-related queries, especially regarding agri-waste.

  Analyze the following text input: {{{inputText}}}

  1.  **Identify the primary language** used in the input text. Provide the language code (e.g., 'en' for English, 'es' for Spanish, 'hi' for Hindi, 'bn' for Bengali).
  2.  **Check for Identity Questions:** If the input asks about your identity (e.g., "who are you?", "आपका नाम क्या है?", "তুমি কে?"), DO NOT generate a new response. Instead, use the predefined identity response for the detected language.
       - English: "${identityResponses.en}"
       - Hindi: "${identityResponses.hi}"
       - Bengali: "${identityResponses.bn}"
       If the detected language is not English, Hindi, or Bengali, use the English identity response as a fallback. Set the detectedLanguage field accordingly.
  3.  **Check for Real-time Data Needs:** If the input requires current, real-time information (like market prices, weather forecasts, news), use the 'searchAnythingTool' to find the relevant information online. Summarize the search results in your response. **Only use the tool if explicitly needed for real-time data.** Do not use it for general knowledge questions.
  4.  **General Response:** If it's not an identity question and doesn't require real-time data, generate a relevant and helpful response to the input text *in the same language you identified*.
  5.  **Return Format:** Return the detected language code and your response (either predefined identity, search result summary, or generated response). Ensure your output strictly follows the requested JSON format.
  `,
});


const detectAndRespondFlow = ai.defineFlow<
  typeof DetectAndRespondInputSchema,
  typeof DetectAndRespondOutputSchema
>(
  {
    name: 'detectAndRespondFlow',
    inputSchema: DetectAndRespondInputSchema,
    outputSchema: DetectAndRespondOutputSchema,
  },
  async (input) => {
    try {
      // 1. Basic check for identity questions client-side (optional pre-filtering)
      const lowerInput = input.inputText.toLowerCase().trim();
      for (const lang in identityKeywords) {
        if (identityKeywords[lang].some(keyword => lowerInput.includes(keyword))) {
           console.log(`Identity question detected client-side for lang: ${lang}`);
           // Return predefined response directly if a clear match exists
           const responseLang = identityResponses[lang] ? lang : 'en'; // Fallback to English if lang not hi/bn
           return {
               detectedLanguage: responseLang,
               responseText: identityResponses[responseLang] || identityResponses.en,
           };
        }
      }

      // 2. If not an identity question, proceed with the AI prompt
      console.log("Calling AI prompt for general query or real-time data...");
      const { output } = await prompt(input);

      if (!output) {
        throw new Error('AI model did not return a valid output structure.');
      }

      // Validate language code format (simple check)
       const langRegex = /^[a-z]{2,3}(?:-[A-Z]{2,3})?$/;
       if (!output.detectedLanguage || !langRegex.test(output.detectedLanguage)) {
           console.warn(`Model returned invalid language code: '${output.detectedLanguage}'. Falling back to 'en'.`);
           output.detectedLanguage = 'en'; // Fallback language
       }


      // 3. Post-check for identity (if model didn't handle it via prompt instructions)
      // This is a safety net. The prompt should handle it ideally.
      for (const lang in identityKeywords) {
        if (identityKeywords[lang].some(keyword => lowerInput.includes(keyword))) {
           console.log(`Identity question detected post-AI for lang: ${lang}`);
           const responseLang = identityResponses[lang] ? lang : 'en';
           // Override AI response if it missed the identity instruction
           if (output.responseText !== (identityResponses[responseLang] || identityResponses.en)) {
                console.log("Overriding AI response with predefined identity response.");
                output.responseText = identityResponses[responseLang] || identityResponses.en;
                output.detectedLanguage = responseLang;
           }
           break; // Exit loop once detected
        }
      }


      return output;

    } catch (error: any) {
      console.error('Error in detectAndRespond flow:', error);

      // Check for specific API errors (like 503)
      if (error.message && error.message.includes('503 Service Unavailable')) {
        console.error('Google AI Service Unavailable (503). Model may be overloaded.');
        throw new Error('The AI service is temporarily unavailable (overloaded). Please try again in a moment.');
      }
       // Check for authentication errors explicitly if possible (structure depends on genkit/googleai errors)
       if (error.message && (error.message.includes('API key not valid') || error.message.includes('Could not refresh access token'))) {
           console.error('Authentication error with Google AI API.');
           throw new Error('There was an authentication issue with the AI service. Please check the configuration.');
       }
       // Check for tool-related errors (often indicate configuration or permission issues)
       if (error.message && error.message.includes('PermissionDenied')) {
            console.error('Tool execution permission denied:', error);
            throw new Error('Could not execute the required tool due to permission issues. Please check the configuration.');
       }
        if (error.message && error.message.includes('failed to call tool')) {
           console.error('Tool call failed:', error);
           throw new Error('There was an issue using an internal tool to fulfill your request.');
       }


      // General error
      throw new Error(`Failed to get response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
