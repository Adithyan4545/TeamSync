'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthLayout from '@/components/ui/AuthLayout';
import AuthCard from '@/components/ui/AuthCard';
import { Button } from '@/components/ui/Button';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Please wait while we verify your email address.');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`/auth/verify-email?token=${token}`);
        if (res.data.success) {
          setStatus('success');
          setMessage('Email verified successfully. You can now log in.');
          toast.success('Email verified successfully');
          setTimeout(() => router.push('/auth/login'), 2000);
        } else {
          setStatus('error');
          setMessage(res.data.message || 'Verification failed');
          toast.error(res.data.message || 'Verification failed');
        }
      } catch (err: unknown) {
        setStatus('error');
        const error = err as { response?: { data?: { message?: string } } };
        const errMsg = error.response?.data?.message || 'An error occurred during verification';
        setMessage(errMsg);
        toast.error(errMsg);
      }
    };
    if (token) verify();
  }, [token, router]);

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center space-y-4 mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex justify-center mb-6"
          >
            {status === 'loading' && <Loader2 className="h-16 w-16 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle className="h-16 w-16 text-success" />}
            {status === 'error' && <XCircle className="h-16 w-16 text-danger" />}
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>
        <div className="flex justify-center">
          {status === 'loading' ? (
            <Button disabled isLoading className="w-full">Processing</Button>
          ) : (
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              Return to Login
            </Button>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
