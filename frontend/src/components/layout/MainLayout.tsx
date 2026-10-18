'use client';
import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Toaster } from 'react-hot-toast';
import { TeamSyncAIChatbot } from '../ai/TeamSyncAIChatbot';
import { TeamSyncAtmosphere } from '../ui/TeamSyncAtmosphere';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* TeamSync Authenticated Atmosphere Environment */}
      <TeamSyncAtmosphere />

      {/* Main Authenticated Application (Layer z-10+) */}
      <Sidebar />
      <div className="flex flex-1 flex-col lg:pl-56 transition-all duration-300 relative z-10">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10">
          {children}
        </main>
      </div>
      <TeamSyncAIChatbot />
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          duration: 4000, 
          style: { 
            background: '#12151E', 
            color: '#fff', 
            borderRadius: '0.75rem',
            border: '1px solid rgba(255,255,255,0.1)'
          } 
        }} 
      />
    </div>
  );
}
