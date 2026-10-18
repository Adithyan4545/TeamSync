'use client';

import React from 'react';
import AuthLayout from '@/components/ui/AuthLayout';
import AuthCard from '@/components/ui/AuthCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await axios.post('/auth/request-password-reset', { email: data.email });
      if (res.data.success) {
        toast.success('Password reset link sent. Please check your email.');
      } else {
        toast.error(res.data.message || 'Failed to send reset link');
      }
    } catch (err) {
      const message = (err as unknown as { response?: { data?: { message?: string } } }).response?.data?.message || 'An error occurred';
      toast.error(message);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div className="space-y-2 mb-6 text-left">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Forgot Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your registered email and we'll send you a link to reset your password.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            icon={<Mail size={18} />}
            {...register('email')}
            error={errors.email?.message}
          />
          <Button 
            type="submit" 
            className="w-full mt-2 h-11 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20" 
            disabled={isSubmitting} 
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/auth/login" className="inline-flex items-center text-xs font-semibold text-primary hover:underline transition-colors">
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Sign in
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
