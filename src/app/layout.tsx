import type { Metadata } from 'next';
import { Sora } from 'next/font/google'; // Import Sora font
import './globals.css';

// Initialize Sora font with desired subsets and variable name
const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'W2W | S.A.A.T.H.I', // Updated title
  description: 'A multilingual chatbot',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the Sora font variable to the body */}
      <body className={`${sora.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
