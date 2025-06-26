
'use client';

import type { FC } from 'react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnimatedFloatingRobotIcon } from '@/components/animated-floating-robot-icon'; // Import the animated icon

interface WelcomeScreenProps {
  onStartChat: () => void; // Callback to signal starting the chat
}


const WelcomeScreen: FC<WelcomeScreenProps> = ({ onStartChat }) => {
  return (
    // Apply glassmorphic effect with adjusted background color and blur
    <Card className="flex h-full w-full flex-col overflow-hidden shadow-xl rounded-[25px] border-none glassmorphic bg-card/80 backdrop-blur-sm"> {/* Slightly reduced opacity */}
       {/* Wrap content in a div and adjust padding-top */}
       {/* Added relative for positioning context */}
       <CardContent className="flex flex-1 flex-col items-center justify-center p-4 md:p-6 text-center relative">
          {/* Use negative margin-top to move content up by 20px (mt-5 = 1.25rem = 20px) */}
          <div className="-mt-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full" // Ensure motion div takes full width
            >
               {/* Added "Best Personal" text with updated font size - Added responsive size */}
               <p className="text-2xl md:text-[34px] text-time-foreground mb-1 font-normal">Best Personal</p> {/* Changed font-semibold to font-normal (400) */}
               {/* Title - Added responsive size */}
               <h1 className="text-3xl md:text-4xl font-semibold text-saathi-gradient mb-2 md:mb-4"> {/* Changed font-bold to font-semibold (600) */}
                 S.A.A.T.H.I
               </h1>

               {/* Icon - Use the new AnimatedFloatingRobotIcon - Added responsive size */}
               <AnimatedFloatingRobotIcon className="w-24 h-24 md:w-32 md:h-32 mx-auto my-4 md:my-8 text-icon-header" /> {/* Increased size and adjusted margin */}

               {/* Version Badge - Moved below the icon and centered */}
               <Badge
                 variant="default" // Use primary background and foreground
                 className={cn(
                   "mt-6 md:mt-12 px-3 py-0.5 md:px-4 md:py-1 text-sm md:text-base font-semibold rounded-full shadow-md mx-auto", // Centered badge, removed mb-6, added mt-12 (approx 48px)
                   // Add fixed dimensions and hover glow - Use responsive fixed size
                   "h-[28px] w-[80px] md:h-[31px] md:w-[98px] flex items-center justify-center", // Set size and center content horizontally
                   "transition-shadow duration-300", // Smooth transition for shadow
                   "hover:shadow-[0_0_15px_2px_hsl(var(--primary))]" // Glow effect on hover
                 )}
               >
                 V1.1
               </Badge>
            </motion.div>
             {/* Wrap tagline and button in motion.div */}
             {/* Moved tagline outside the initial motion.div, adjusted positioning and margins */}
             {/* Position absolutely near the bottom, changed bottom-54px to bottom-14px to move it down 40px */}
              {/* Adjusted absolute positioning for responsiveness */}
             <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }} // Slightly delayed fade-in
                 className="w-full absolute bottom-20 md:bottom-[14px] left-0 right-0 px-4 md:px-6" // Decreased bottom value to move down, adjusted padding
             >
                 <p className="text-xs md:text-sm text-time-foreground text-center">Nice to meet you! How can I help you?</p>
             </motion.div>
          </div>
       </CardContent>

      {/* Footer to contain the button */}
       {/* Adjusted footer height, made border transparent, added flex-col centering */}
      <CardFooter className="p-4 h-auto border-t border-transparent flex flex-col items-center justify-center">
         {/* Wrap Button in motion.div */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }} // Slightly more delayed fade-in
            className="w-full flex justify-center" // Center the button container
          >
            <Button
                onClick={onStartChat}
                size="lg"
                // Updated button styling: font-medium, text-user-foreground (color #223100), text-base (16px)
                // Made button width responsive
                className="bg-user-bubble text-user-foreground hover:bg-user-bubble/90 rounded-[18px] px-8 py-2 md:px-10 md:py-3 text-sm md:text-base font-medium transition-all duration-300 shadow-md w-full max-w-[344px] h-[44px] md:h-[50px] mb-0" // Applied font-medium, removed mb-6, adjusted padding/size for mobile
                aria-label="Start Chatting"
            >
                Let&apos;s start chatting
            </Button>
          </motion.div>
      </CardFooter>
    </Card>
  );
};

export { WelcomeScreen };
