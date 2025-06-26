
import type { FC } from 'react';
import { User, Loader2, Volume2, VolumeX, AlertTriangle } from 'lucide-react'; // Added VolumeX, AlertTriangle
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns'; // Import date-fns for formatting
import { AnimatedFloatingRobotIcon } from '@/components/animated-floating-robot-icon'; // Import the new icon

interface MessageBubbleProps {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  isGenerating?: boolean; // Is the text response being generated?
  originalText?: string;
  language?: string;
  timestamp: Date; // Add timestamp prop
  onSpeak?: (text: string, lang?: string) => void; // Callback for TTS
  isSpeaking?: boolean; // Is speech currently active?
  onStopSpeak?: () => void; // Callback to stop TTS
  error?: boolean; // Is this an error message?
}


const MessageBubble: FC<MessageBubbleProps> = ({
  id,
  sender,
  text,
  isGenerating = false,
  originalText,
  language,
  timestamp, // Destructure timestamp
  onSpeak, // Destructure onSpeak callback
  isSpeaking, // Destructure isSpeaking prop
  onStopSpeak, // Destructure onStopSpeak callback
  error = false, // Destructure error prop
}) => {
  const isUser = sender === 'user';
  const isSystem = sender === 'system';
  const isAI = sender === 'ai';

  const bubbleClasses = cn(
    'relative flex max-w-[85%] md:max-w-[80%] items-start gap-2 md:gap-3 rounded-lg p-2 md:p-3 shadow-md transition-all duration-300 ease-in-out', // Adjusted max-width and padding
    // Apply Tailwind classes defined in globals.css
    isUser ? 'bg-user-bubble text-user-foreground rounded-br-none' : '', // Sharp bottom-right for user
    isAI ? 'bg-ai-bubble text-ai-foreground rounded-bl-none' : '', // Sharp bottom-left for AI
    isSystem ? 'bg-muted text-muted-foreground text-xs italic' : '',
    // Error styling for system messages
    isSystem && error ? 'bg-destructive/20 text-destructive-foreground border border-destructive' : '',
  );

  const containerClasses = cn(
    'flex flex-col mb-2', // Add bottom margin to the container
    isUser ? 'items-end' : 'items-start',
    isSystem ? 'items-center' : '' // Center system messages
  );

  const iconClasses = 'mt-1 h-5 w-5 md:h-6 md:w-6 shrink-0'; // Kept size consistent, adjusted for mobile

  const getStatusIcon = () => {
    if (isGenerating) return <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin text-primary" />; // Adjusted size
    if (isSystem && error) return <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-destructive mr-1" />; // Error icon
    return null;
  };

   const getLanguageText = () => {
    if (isSystem || !language || isGenerating) return null; // Don't show language for system messages
    if (language === 'Error' || language === 'Detecting...' || language === '??') return `(${language})`;
    if (language.startsWith('(Heard:')) return language; // Keep format for user voice input
    return `(${language})`; // Default display for AI responses
   };

   // Format time as h:mm AM/PM (e.g., 11:32 AM)
   const formattedTime = format(timestamp, 'p');

   const handleSpeakClick = () => {
     // Only allow speaking for AI messages that are not generating and not errors
     if (isAI && onSpeak && !isGenerating && !error && text) {
       onSpeak(text, language);
     }
   };

   const handleStopSpeakClick = () => {
      if (onStopSpeak) {
        onStopSpeak();
      }
   };

  return (
    <div className={containerClasses} data-key={id}>
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={bubbleClasses}
            aria-live={isAI && !isGenerating ? 'polite' : 'off'} // Announce AI messages when ready
            role="log"
        >
        {/* Render icon based on sender type and error state */}
        {isUser && <div className={iconClasses}><User /></div>}
        {isAI && <div className={iconClasses}><AnimatedFloatingRobotIcon className="text-ai-foreground/90" /></div>}
        {/* System messages don't have a specific user/AI icon, but might show an error icon */}

        <div className="flex flex-1 flex-col">
            {/* Apply the correct text color class based on sender - Adjusted text size */}
            <p className={cn(
                "whitespace-pre-wrap break-words text-sm md:text-base",
                 isUser ? "text-user-foreground" : "",
                 isAI ? "text-ai-foreground" : "",
                 isSystem && !error ? "text-muted-foreground" : "",
                 isSystem && error ? "text-destructive-foreground font-medium" : "" // Error text style
            )}>
                {getStatusIcon()} {/* Show status/error icon before text for system messages */}
                {text === '...' && isGenerating ? 'Thinking...' : text}
            </p>
            <div className="mt-1 md:mt-1.5 flex items-center justify-between gap-2 text-[10px] md:text-xs text-muted-foreground/80"> {/* Adjusted opacity and font size */}
                <div className="flex items-center gap-1 md:gap-2"> {/* Group status and language */}
                    {/* Moved getStatusIcon for system messages, keep here for AI generating */}
                    {isAI && getStatusIcon()}
                    {getLanguageText()}
                    {originalText && !isGenerating && <span className="italic">(Original: {originalText})</span>}
                </div>
                {/* Speaker/Stop Speaker Icon for AI messages - Adjusted size/padding */}
                 {isAI && !isGenerating && !error && ( // Only show speaker for non-error, non-generating AI messages
                    isSpeaking ? (
                        onStopSpeak && (
                            <button
                                onClick={handleStopSpeakClick}
                                className="ml-auto p-0.5 md:p-1 rounded-full text-[#884d2c] hover:bg-[#884d2c]/20 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-[#884d2c] focus:ring-offset-1" // Custom brown color
                                aria-label="Stop speaking"
                                title="Stop speaking"
                            >
                                <VolumeX className="h-3 w-3 md:h-4 md:w-4" />
                            </button>
                        )
                    ) : (
                        onSpeak && (
                           <button
                             onClick={handleSpeakClick}
                             className="ml-auto p-0.5 md:p-1 rounded-full hover:bg-primary/20 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-ring focus:ring-offset-1"
                             aria-label="Speak response"
                             title="Speak response"
                           >
                             <Volume2 className="h-3 w-3 md:h-4 md:w-4 text-ai-foreground/70 hover:text-ai-foreground" />
                           </button>
                         )
                    )
                 )}
            </div>
        </div>
        </motion.div>
        {/* Display the formatted time below the bubble - Adjusted font size */}
        <time dateTime={timestamp.toISOString()} className="text-[10px] md:text-[11px] text-time-foreground mt-0.5 md:mt-1 px-1"> {/* Changed font size */}
            {formattedTime}
        </time>
    </div>
  );
};

export { MessageBubble };
