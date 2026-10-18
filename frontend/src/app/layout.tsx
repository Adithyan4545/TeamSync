import '@/styles/globals.css';

import { UIProvider } from '@/context/UIContext';
import { AuthProvider } from '@/context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GlobalHackathonBackground from '@/components/ui/GlobalHackathonBackground';
import { StarCursor } from '@/components/ui/StarCursor';

export const metadata = {
  title: 'TeamSync',
  description: 'Collaborate, build, and manage teams seamlessly.',
};

import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} dark`}>
      <head />
      <body className="min-h-screen bg-background font-sans antialiased text-foreground relative z-0">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'missing-client-id'}>
          <AuthProvider>
            <UIProvider>
              <GlobalHackathonBackground>
                <div className="relative z-10 w-full h-full">
                  {children}
                </div>
                <StarCursor />
              </GlobalHackathonBackground>
            </UIProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
