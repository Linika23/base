
'use client'; // Add this directive because we need useState

import React, { useState } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { WelcomeScreen } from '@/components/welcome-screen'; // Import the new component
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  const [showChat, setShowChat] = useState(false); // State to control which screen is shown

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleGoBack = () => {
    setShowChat(false);
  };


  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      // Use a seeded picsum URL for a consistent farm background image
      style={{  }}
    >
      {/* Container with responsive dimensions */}
      {/* Use w-full for mobile, max-w-md for larger screens to constrain width */}
      {/* Use h-full within a flex item or set a specific aspect ratio/height */}
      <div className="w-full max-w-md h-[576px] md:h-[640px]"> {/* Adjusted height for better aspect ratio */}
        {showChat ? (
          <ChatInterface onGoBack={handleGoBack} /> // Pass handleGoBack
        ) : (
          <WelcomeScreen onStartChat={handleStartChat} /> // Pass the handler
        )}
      </div>
      <Toaster />
    </main>
  );
}

