'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(decodeURIComponent(error));
      router.push('/auth/login');
      return;
    }

    if (token) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const decoded = jwtDecode<DecodedToken>(token);
        toast.success('Logged in with Google successfully');
        // Force window reload or redirect to load user context
        window.location.href = '/dashboard';
      } catch (err) {
        toast.error('Failed to process Google authentication token');
        router.push('/auth/login');
      }
    } else {
      router.push('/auth/login');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-muted-foreground">Completing Google authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
