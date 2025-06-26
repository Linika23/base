
'use client';

import type { FC } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Loader2, ChevronLeft, Circle, Volume2, VolumeX } from 'lucide-react'; // Added VolumeX
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from '@/components/message-bubble';
import { detectAndRespond } from '@/ai/flows/detect-and-respond';
import { transcribeAndRespond } from '@/ai/flows/transcribe-and-respond';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion'; // Import motion
import { cn } from '@/lib/utils'; // Import cn
import { AnimatedFloatingRobotIcon } from '@/components/animated-floating-robot-icon'; // Import the new icon

interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  originalText?: string;
  language?: string; // Detected language (e.g., 'en', 'es')
  isGenerating?: boolean;
  timestamp: Date; // Add timestamp field
  error?: boolean; // Flag to indicate if this is an error message
}

// Helper function to generate a more unique ID
const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

interface ChatInterfaceProps {
  onGoBack: () => void; // Add prop for going back
}


const ChatInterface: FC<ChatInterfaceProps> = ({ onGoBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // Corrected initialization
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // State to track TTS playback
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [placeholder, setPlaceholder] = useState('A');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderBaseText = "Ask me something...";


  // Placeholder animation effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (!inputText && !isSending && !isRecording && !isProcessingVoice) {
      intervalId = setInterval(() => {
        setPlaceholderIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % (placeholderBaseText.length + 1);
          setPlaceholder(placeholderBaseText.substring(0, nextIndex) + (nextIndex < placeholderBaseText.length ? '|' : ''));
           // Reset placeholder if it reaches the end
           if (nextIndex === placeholderBaseText.length) {
              // Short pause before restarting
              setTimeout(() => setPlaceholderIndex(0), 1000);
           }
          return nextIndex;
        });
      }, 150); // Adjust typing speed here
    } else {
      // Clear interval and reset placeholder if user starts typing or interacts
      setPlaceholder(placeholderBaseText); // Set back to default or empty
    }

    return () => clearInterval(intervalId);
  }, [inputText, isSending, isRecording, isProcessingVoice]); // Rerun effect if interaction state changes


   // --- Browser-based Speech Synthesis (Fallback/Alternative) ---
   const speakResponse = useCallback((text: string, lang?: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
          console.warn('SpeechSynthesis API not available.');
           toast({
               title: 'Speech Synthesis Not Available',
               description: 'Your browser does not support speaking responses.',
               variant: 'destructive',
           });
          return;
      }

      window.speechSynthesis.cancel(); // Stop previous speech if any

      const utterance = new SpeechSynthesisUtterance(text);

       let voiceFound = false;
       if (lang) {
           const voices = window.speechSynthesis.getVoices();
           // Prioritize exact match (e.g., 'en-US')
           let targetVoice = voices.find(voice => voice.lang === lang);
           // Fallback to matching language code (e.g., 'en')
           if (!targetVoice) {
              targetVoice = voices.find(voice => voice.lang.startsWith(lang.split('-')[0]));
           }
           // Further fallback: try finding any voice for the base language if regional variant wasn't found
           if (!targetVoice) {
               const baseLang = lang.split('-')[0];
               targetVoice = voices.find(voice => voice.lang.startsWith(baseLang));
           }
          // Specific check for Bengali (bn)
          if (!targetVoice && lang.startsWith('bn')) {
             targetVoice = voices.find(voice => voice.lang.startsWith('bn'));
             if (targetVoice) {
                console.log("Found specific Bengali voice:", targetVoice.name);
             } else {
                 console.warn("No dedicated Bengali (bn) voice found, attempting browser default for Bengali.");
             }
          }
           // Specific check for Hindi (hi)
           if (!targetVoice && lang.startsWith('hi')) {
              targetVoice = voices.find(voice => voice.lang.startsWith('hi'));
              if (targetVoice) {
                 console.log("Found specific Hindi voice:", targetVoice.name);
              } else {
                  console.warn("No dedicated Hindi (hi) voice found, attempting browser default for Hindi.");
              }
           }


           if (targetVoice) {
              utterance.voice = targetVoice;
              utterance.lang = targetVoice.lang; // Use the voice's specific lang tag
              voiceFound = true;
              console.log(`Using voice: ${targetVoice.name} (${targetVoice.lang}) for requested language: ${lang}`);
           } else {
               console.warn(`No specific voice found for language code starting with: ${lang}. Using browser default.`);
               utterance.lang = lang; // Still set the lang attr for browser fallback attempt
                 // Don't toast for this fallback, rely on the speaker icon interaction
           }
       } else {
           console.warn("No language provided for speech synthesis. Using browser default.");
            // Don't toast for this fallback
       }


      utterance.onstart = () => { console.log('Speech started...'); setIsSpeaking(true); };
      utterance.onend = () => { console.log('Speech finished.'); setIsSpeaking(false); };
      utterance.onerror = (event) => {
          // Don't log or toast the 'interrupted' error as it's expected when stopping speech early.
          if (event.error === 'interrupted') {
             console.log('Speech interrupted.'); // Optionally log for debugging, but not as an error
             setIsSpeaking(false); // Still reset speaking state
             return; // Prevent further processing for interrupted errors
          }

          // Log other errors and show a toast
          console.error('SpeechSynthesisUtterance Error:', event.error);
          setIsSpeaking(false); // Ensure speaking state is reset on error
          toast({
              title: 'Speech Error',
              description: `Could not speak the response: ${event.error}`,
              variant: 'destructive',
          });
      };

      // Ensure voices are loaded before speaking
       if (window.speechSynthesis.getVoices().length > 0) {
           window.speechSynthesis.speak(utterance);
       } else {
           // Wait for voices to load if they haven't already
           window.speechSynthesis.onvoiceschanged = () => {
                // Try speaking again once voices are loaded
                // Re-find the voice just in case the list changed
                if (lang) {
                   const voices = window.speechSynthesis.getVoices();
                    let targetVoice = voices.find(voice => voice.lang === lang) ||
                                       voices.find(voice => voice.lang.startsWith(lang.split('-')[0])) ||
                                       voices.find(voice => voice.lang.startsWith(lang.split('-')[0].split('_')[0])); // Broader match
                     if (targetVoice) {
                        utterance.voice = targetVoice;
                        utterance.lang = targetVoice.lang;
                        console.log(`Using voice after load: ${targetVoice.name} (${targetVoice.lang})`);
                     } else {
                         console.warn(`Voice for ${lang} still not found after voices loaded. Using default.`);
                         utterance.lang = lang;
                     }
                }
                window.speechSynthesis.speak(utterance);
                // Remove the listener after the first time to avoid multiple triggers
                window.speechSynthesis.onvoiceschanged = null;
           };
            console.log("Waiting for voices to load before speaking...");
            // Trigger loading if necessary (some browsers might need this)
            window.speechSynthesis.getVoices();
       }

   }, [toast]); // Removed setIsSpeaking from dependencies as it's a setter


    // Function to stop speech synthesis
    const stopSpeaking = useCallback(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        console.log('Speech stopped by user.');
      }
    }, []); // Removed setIsSpeaking from dependencies


   // Preload voices
   useEffect(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
          const loadVoices = () => {
              const voices = window.speechSynthesis.getVoices();
              if (voices.length > 0) {
                   console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
                   // Try finding specific voices
                   const bengaliVoice = voices.find(voice => voice.lang.startsWith('bn'));
                   const hindiVoice = voices.find(voice => voice.lang.startsWith('hi'));
                   if (bengaliVoice) console.log("Found Bengali voice:", bengaliVoice.name); else console.warn("No Bengali voice found.");
                   if (hindiVoice) console.log("Found Hindi voice:", hindiVoice.name); else console.warn("No Hindi voice found.");

              } else {
                 console.log("Waiting for voices to load...");
                 // Explicitly trigger loading if needed by the browser
                 window.speechSynthesis.getVoices();
              }
          };

          // Check if voices are already loaded
          if (window.speechSynthesis.getVoices().length > 0) {
            loadVoices();
          } else {
             // If not, set up the event listener
             if (window.speechSynthesis.onvoiceschanged !== undefined) {
                 window.speechSynthesis.onvoiceschanged = loadVoices;
             } else {
                 // Fallback for browsers without onvoiceschanged (less common)
                 setTimeout(loadVoices, 100); // Check after a short delay
             }
          }
      }
   }, []);

   // Cleanup speech on unmount
   useEffect(() => {
      return () => {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
              window.speechSynthesis.cancel(); // Ensure speech stops when component unmounts
              setIsSpeaking(false);
          }
      };
   }, []); // Removed setIsSpeaking from dependencies


  // --- Core Chat Logic ---

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage = { ...message, id: generateUniqueId(), timestamp: new Date() }; // Add current timestamp
    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTo({ top: scrollViewport.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }, []);


  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]); // Depend on messages instead of messages.length for complex state

  // Handles TEXT input
  const handleSend = async () => {
    if (!inputText.trim() || isSending || isRecording || isProcessingVoice) return;

    const userMessageText = inputText;
    setInputText('');
    setIsSending(true);
    stopSpeaking(); // Stop any ongoing speech

    const userMessageId = addMessage({ sender: 'user', text: userMessageText });
    scrollToBottom(); // Scroll after adding user message

    // Add placeholder *after* user message is added
    const aiMessageId = addMessage({
       sender: 'ai',
       text: '...',
       isGenerating: true,
       language: '...',
     });
     scrollToBottom(); // Scroll after adding placeholder AI message


    try {
      const result = await detectAndRespond({
        inputText: userMessageText,
      });

       // Basic regex for common language codes (e.g., en, en-US, es, fr-CA, hi, bn)
       const langRegex = /^[a-z]{2,3}(?:-[A-Z]{2,3})?$/;
       const detectedLanguage = result.detectedLanguage && langRegex.test(result.detectedLanguage)
           ? result.detectedLanguage
           : '??'; // Indicate unknown/failed detection

      updateMessage(aiMessageId, {
        text: result.responseText,
        isGenerating: false,
        language: detectedLanguage, // Store the detected language code
        error: false, // Ensure error flag is false on success
      });

      // Automatically speak the AI response after a short delay using browser TTS
      if (result.responseText && detectedLanguage !== '??') {
        console.log(`Attempting to speak response in: ${detectedLanguage}`); // Log language for speech
        setTimeout(() => speakResponse(result.responseText, detectedLanguage), 300); // Delay slightly
      }

    } catch (error: any) {
      console.error('Error processing text:', error);
      stopSpeaking(); // Stop speech on error

      const isServiceUnavailable = error.message && error.message.includes('503');
      const isAuthError = error.message && (error.message.includes('API key not valid') || error.message.includes('Could not refresh access token'));
      const isToolError = error.message && (error.message.includes('PermissionDenied') || error.message.includes('failed to call tool'));


      let errorMessageText = `Sorry, I encountered an error: ${error.message || 'Unknown error'}`;
      if (isServiceUnavailable) {
        errorMessageText = 'The AI service is temporarily overloaded. Please try again shortly.';
      } else if (isAuthError) {
        errorMessageText = 'There was an authentication issue with the AI service. Please check configuration.';
      } else if (isToolError) {
        errorMessageText = 'There was an issue using an internal tool to fulfill your request.';
      }


      updateMessage(aiMessageId, {
        text: errorMessageText,
        isGenerating: false,
        sender: 'system', // Use system sender for errors
        language: 'Error',
        error: true, // Mark as error message
      });
       toast({
        title: 'Error',
        description: error.message || 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      // Always set to false to allow user to send new message regardless.
      setIsSending(false);
      // No need to scroll here again, already scrolled after adding/updating messages
    }
  };

  // Handles VOICE input
  const startRecording = async () => {
    if (isRecording || isProcessingVoice || isSending) return;
    stopSpeaking(); // Stop any ongoing speech

    let recordingMsgId: string | null = null;
    let processingMsgId: string | null = null; // Track the processing message ID
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Common mime types ordered by preference/compatibility
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: supportedMimeType || undefined });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsProcessingVoice(true);
        processingMsgId = addMessage({ sender: 'system', text: 'Processing voice...', isGenerating: true }); // Mark as generating
        scrollToBottom();

        // Clear the 'Recording started...' message
        if (recordingMsgId) {
          removeMessage(recordingMsgId);
          recordingMsgId = null; // Reset ID
        }

        if (audioChunksRef.current.length === 0) {
            console.warn("No audio data collected.");
            if (processingMsgId) {
              updateMessage(processingMsgId, { text: "No audio recorded.", isGenerating: false, error: true, sender: 'system' });
            }
            setIsProcessingVoice(false);
            toast({ title: "Recording Error", description: "No audio was recorded. Please try again.", variant: "destructive" });
            return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          if (!base64Audio) {
             if (processingMsgId) {
               updateMessage(processingMsgId, { text: "Could not read audio data.", isGenerating: false, error: true, sender: 'system' });
             }
             toast({ title: "Error", description: "Could not read audio data.", variant: "destructive" });
             setIsProcessingVoice(false);
             return;
          }

          // Declare variables outside try block
          let userMessageId: string | null = null;
          let aiMessageId: string | null = null;

          try {
            // Call the AI flow first to get both transcription and response
            const result = await transcribeAndRespond({
              voiceDataUri: base64Audio,
            });

            // Use regex for language validation
            const langRegex = /^[a-z]{2,3}(?:-[A-Z]{2,3})?$/;
            const detectedLanguageUser = result.detectedLanguage && langRegex.test(result.detectedLanguage)
                 ? result.detectedLanguage
                 : '??'; // Fallback for user language display
            const detectedLanguageAI = detectedLanguageUser; // Assuming AI responds in the same detected language

             // Remove the "Processing voice..." message *before* adding the real messages
             if (processingMsgId) {
               removeMessage(processingMsgId);
               processingMsgId = null;
             }

             // Add user's transcribed message *first*
             userMessageId = addMessage({ sender: 'user', text: result.transcribedText, language: `(Heard: ${detectedLanguageUser})` });
             scrollToBottom(); // Scroll after adding user message

             // Add AI's response message *after* user message
             aiMessageId = addMessage({
               sender: 'ai',
               text: result.responseText,
               isGenerating: false, // It's already generated
               language: detectedLanguageAI, // Store detected language for AI
               error: false, // Ensure error flag is false on success
             });
             scrollToBottom(); // Scroll after adding AI message


             // Speak the AI response after a short delay using browser TTS
             if (result.responseText && detectedLanguageAI !== '??') {
               console.log(`Attempting to speak response in: ${detectedLanguageAI}`); // Log language for speech
               setTimeout(() => speakResponse(result.responseText, detectedLanguageAI), 300); // Delay slightly
             }


          } catch (error: any) {
            console.error('Error processing voice:', error);
            stopSpeaking(); // Stop speech on error

            const isServiceUnavailable = error.message && error.message.includes('503');
             const isAuthError = error.message && (error.message.includes('API key not valid') || error.message.includes('Could not refresh access token'));
             const isToolError = error.message && (error.message.includes('PermissionDenied') || error.message.includes('failed to call tool'));

            let errorText = `Sorry, I encountered an error processing your voice: ${error.message || 'Unknown error'}`;
             if (isServiceUnavailable) {
                 errorText = 'The AI service is temporarily overloaded. Please try again shortly.';
             } else if (isAuthError) {
                 errorText = 'There was an authentication issue with the AI service. Please check configuration.';
             } else if (isToolError) {
                 errorText = 'There was an issue using an internal tool to fulfill your request.';
             }


             // If an AI message placeholder was somehow added, remove it
             if (aiMessageId) removeMessage(aiMessageId);
             // Remove user message if it was added before the error
             if (userMessageId) removeMessage(userMessageId);

            // Update the 'Processing...' message to show the error, if it still exists
             if (processingMsgId) {
                updateMessage(processingMsgId, {
                  text: errorText,
                  isGenerating: false,
                  sender: 'system',
                  language: 'Error',
                  error: true,
                });
             } else {
                 // If processing message was already removed, add a new error message
                 addMessage({ sender: 'system', text: errorText, error: true });
                 scrollToBottom();
             }


             toast({
              title: 'Error',
              description: error.message || 'Failed to process voice',
              variant: 'destructive',
            });

          } finally {
             setIsProcessingVoice(false); // Stop processing state
             // No need to scroll here again, handled within the try/catch/addMessage
          }
        };
        reader.onerror = () => {
          console.error("FileReader error");
          if (processingMsgId) {
            updateMessage(processingMsgId, { text: "Failed to read audio file.", isGenerating: false, error: true, sender: 'system' });
          }
          toast({ title: "Error", description: "Failed to read audio file.", variant: "destructive" });
          setIsProcessingVoice(false);
        };
      };

      mediaRecorderRef.current.onerror = (event: Event) => {
          console.error("MediaRecorder Error:", event);
          setIsRecording(false); // Ensure recording state is reset
          setIsProcessingVoice(false); // Ensure processing state is reset
          // Clear the 'Recording started...' message if it exists
          if (recordingMsgId) {
            removeMessage(recordingMsgId);
            recordingMsgId = null; // Reset ID
          }
           // Clear the 'Processing voice...' message if it exists
           if (processingMsgId) {
               removeMessage(processingMsgId);
               processingMsgId = null;
           }
          toast({
              title: 'Recording Error',
              description: 'An error occurred during recording.',
              variant: 'destructive',
          });
           // Attempt to stop tracks to release microphone
           try {
              mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
              console.log("Media tracks stopped after recorder error.");
           } catch (e) {
                console.error("Error stopping media tracks after recorder error:", e);
           }
      };


      mediaRecorderRef.current.start();
      setIsRecording(true);
      recordingMsgId = addMessage({ sender: 'system', text: 'Recording started...' }); // Add system message
      scrollToBottom(); // Scroll after adding message

    } catch (error) {
      console.error('Error accessing microphone:', error);
       // Provide more specific feedback based on the error type
       let message = 'Could not access microphone.';
        if (error instanceof DOMException) {
          if (error.name === 'NotAllowedError') {
            message = 'Microphone permission denied. Please allow access in your browser settings.';
          } else if (error.name === 'NotFoundError') {
            message = 'No microphone found. Please ensure one is connected and enabled.';
          } else if (error.name === 'NotReadableError') {
             message = 'Microphone is already in use or cannot be accessed. Please check other applications or browser settings.';
          }
        }
       toast({
        title: 'Microphone Error',
        description: message,
        variant: 'destructive',
      });
       if(recordingMsgId) {
         removeMessage(recordingMsgId);
       }
        // Ensure processing message is removed if it somehow got created
        if (processingMsgId) {
            removeMessage(processingMsgId);
        }
       setIsRecording(false);
       setIsProcessingVoice(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
       if (mediaRecorderRef.current.state === 'recording') {
          try {
             mediaRecorderRef.current.stop();
             setTimeout(() => {
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
             }, 100);
          } catch (e) {
             console.error("Error calling MediaRecorder.stop():", e);
             setIsRecording(false);
             setIsProcessingVoice(false); // Reset processing as well
             toast({
                title: 'Recording Error',
                description: 'Could not stop recording properly.',
                variant: 'destructive',
             });
          }
       } else {
           console.warn("Attempted to stop recording, but state was not 'recording'. Current state:", mediaRecorderRef.current.state);
           setIsRecording(false); // Reset UI state
       }
    } else {
        console.warn("Stop recording called but no active recorder or not recording.");
        setIsRecording(false); // Ensure UI state is reset
    }
  };


  // Handle Enter key for sending text message
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent newline in textarea
      handleSend();
    }
  };

  // Determine if send button should have glow effect
  const canSend = inputText.trim() && !isSending && !isRecording && !isProcessingVoice;

  // Determine if AI is currently generating a response or processing voice
  // Exclude system messages that are errors from the 'isAiWorking' check
   const isAiWorking = isSending || isProcessingVoice || messages.some(msg => msg.isGenerating && msg.sender !== 'system');



  return (
     <Card className="flex h-full w-full flex-col overflow-hidden shadow-xl rounded-[25px] border-none glassmorphic bg-card/80 backdrop-blur-sm"> {/* Applied glassmorphic effect with reduced opacity */}
      {/* Increased height of CardHeader, adjusted padding for mobile */}
      <CardHeader className="flex flex-row items-center justify-between p-3 md:p-4 relative h-[60px] md:h-[70px]">
         {/* Back button - adjusted size */}
         <Button variant="ghost" size="icon" className="text-icon-header hover:bg-accent/20 h-8 w-8 md:h-10 md:w-10" onClick={onGoBack}>
             <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.5} /> {/* Increased strokeWidth */}
             <span className="sr-only">Back</span>
         </Button>
         {/* Centered Title and Online Indicator - Adjusted font size/margins */}
          <div className="flex flex-col items-center flex-1 mx-2"> {/* Added margin for spacing */}
            {/* Apply gradient text class - adjusted font size */}
            <h1 className="text-base md:text-lg font-semibold text-saathi-gradient truncate max-w-[150px] md:max-w-none"> {/* Added truncate for small screens */}
             S.A.A.T.H.I
            </h1>
             {/* Online indicator - adjusted font size/margins */}
            <div className="flex items-center text-[10px] md:text-xs text-time-foreground mt-0.5 md:mt-1"> {/* Changed text color */}
                <Circle className="h-1.5 w-1.5 md:h-2 md:w-2 fill-current mr-1 text-primary" /> {/* Changed circle color to primary */}
                Online
            </div>
          </div>
          {/* Icon container - Keep this positioned relative to the header - adjusted size/position */}
          <motion.div
            className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 cursor-pointer" // Set width and height
            whileHover={!isAiWorking ? { rotateY: 180 } : {}} // Flip on hover only if not generating
            animate={isAiWorking ? { // Animate when AI is working (generating or processing voice)
                rotateY: [0, 180, 360], // Continuous flip
                scale: [1, 1.1, 1], // Pulse scale
                filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'], // Brightness pulse (subtle glow)
                transition: {
                    rotateY: { repeat: Infinity, duration: 1, ease: "linear" },
                    scale: { repeat: Infinity, duration: 0.8, ease: "easeInOut" },
                    filter: { repeat: Infinity, duration: 0.8, ease: "easeInOut" }
                }
            } : {
                rotateY: 0, // Reset rotation when not generating
                scale: 1,
                filter: 'brightness(1)'
            }}
            transition={{ duration: 0.5 }} // Default transition for hover
            style={{ perspective: '1000px' }} // Add perspective for 3D effect
          >
             {/* BANANA - This is where the AnimatedFloatingRobotIcon is placed */}
             {/* Replaced PlantBotIcon2 with AnimatedFloatingRobotIcon */}
             <AnimatedFloatingRobotIcon className="w-full h-full text-icon-header" />
          </motion.div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
         {/* Update ScrollArea: Move padding to the ScrollArea container */}
         <ScrollArea ref={scrollAreaRef} className="h-full w-full p-3 md:p-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                 <MessageBubble
                     key={msg.id} // Ensure key is unique and stable
                     {...msg}
                     onSpeak={speakResponse} // Pass the speak function
                     isSpeaking={isSpeaking && window.speechSynthesis?.speaking} // Indicate if this message *might* be the one speaking
                     onStopSpeak={stopSpeaking} // Pass stop function
                 />
              ))}
            </AnimatePresence>
          </ScrollArea>
      </CardContent>

      <CardFooter className="border-t bg-card p-3 md:p-4">
        <div className="flex w-full items-center gap-2">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder} // Use animated placeholder
            className={cn(
               "flex-1 resize-none bg-background text-foreground border-time-foreground placeholder:text-time-foreground rounded-full px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base focus-visible:ring-0 focus-visible:ring-offset-0 transition-opacity duration-200 focus:opacity-100 opacity-80", // Adjusted padding/text size
               // Glassmorphic adjustments for textarea
               "bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/70 focus:border-white/40"
            )}
            rows={1}
            disabled={isSending || isRecording || isProcessingVoice}
            aria-label="Chat input"
          />
          {/* Send Button - adjusted size */}
          <Button
            onClick={handleSend}
            disabled={!canSend && !isSending} // Button should be disabled if not `canSend` OR if `isSending`
            size="icon"
            aria-label="Send message"
            className={cn(
               "bg-primary text-primary-foreground rounded-full transition-all duration-300 h-9 w-9 md:h-10 md:w-10", // Adjusted size
               // Always apply hover effect, but change intensity based on `canSend`
               "hover:bg-accent",
               // Apply glow effect only when ready to send and hovered
               canSend ? "hover:shadow-[0_0_15px_2px_hsl(var(--primary))]" : "opacity-70", // Inactive: lower opacity, Active: full opacity
               isSending ? "opacity-50" : "" // Dim further when sending
            )}
             title={isSending ? "Sending..." : canSend ? "Send Message" : "Type a message"}
          >
            {isSending ? <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> : <Send className="h-4 w-4 md:h-5 md:w-5" />}
          </Button>
          {/* Microphone Button - adjusted size */}
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSending || isProcessingVoice} // Disable if sending text or processing voice
            size="icon"
            // Change variant based on recording state
            variant={isRecording ? "default" : "outline"} // Use primary color when recording
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            className={cn(
                "rounded-full transition-all duration-300 h-9 w-9 md:h-10 md:w-10", // Adjusted size
                isRecording
                    ? "animate-pulse !bg-primary !text-primary-foreground hover:!bg-accent" // Use primary colors and pulse effect when recording
                    : "hover:bg-accent hover:shadow-[0_0_15px_2px_hsl(var(--primary))] hover:border-accent", // Add hover glow when not recording
                    isProcessingVoice ? "!bg-muted !text-muted-foreground opacity-50" : "" // Style for processing state, dimmed
            )}
            title={isRecording ? "Stop Recording" : isProcessingVoice ? "Processing..." : "Start Recording"}
          >
            {isProcessingVoice ? (
              <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" /> // Show loader when processing
            ) : (
              // Icon color will inherit from button's text color
              <Mic className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>

        </div>
      </CardFooter>
    </Card>
  );
};


export { ChatInterface };

