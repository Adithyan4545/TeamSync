'use client';

import React, { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GradientBackground } from '@/components/ui/bloom-field-gradient';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark auth-theme min-h-screen flex w-full relative overflow-hidden text-foreground selection:bg-primary/30 selection:text-white items-center justify-center p-4 sm:p-8">
      
      {/* Bloom Field Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <GradientBackground className="h-full w-full" />
      </div>

      {/* Centered Auth Card Container */}
      <div className="relative z-10 w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-10 overflow-hidden relative"
        >
          {/* Subtle Inner Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full blur-[2px]" />
          
          {/* Logo Header */}
          <div className="flex flex-col items-center justify-center space-y-4 mb-8">
            <Link href="/" className="group flex items-center justify-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 p-[2px] shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-400 font-extrabold text-2xl tracking-wider">T</span>
                </div>
              </div>
            </Link>
            <h2 className="text-2xl font-black tracking-tight text-white">TeamSync</h2>
          </div>

          <div className="relative z-20">
            {children}
          </div>
        </motion.div>
        
        {/* Footer Text */}
        <div className="mt-8 text-center relative z-10">
          <p className="text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} TeamSync Inc. All rights reserved.
          </p>
        </div>
      </div>
      
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          duration: 4000, 
          style: { 
            background: 'rgba(15, 23, 42, 0.9)', 
            color: '#fff', 
            borderRadius: '1rem',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)'
          } 
        }} 
      />
    </div>
  );
}
