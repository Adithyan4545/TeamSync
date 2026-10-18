'use client';

import React, { useState, useEffect } from 'react';
import AuthLayout from '@/components/ui/AuthLayout';
import AuthCard from '@/components/ui/AuthCard';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Mail, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const schema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Must include uppercase letter' })
    .regex(/[a-z]/, { message: 'Must include lowercase letter' })
    .regex(/[0-9]/, { message: 'Must include a number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Must include a special character' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch('password', '');
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    let score = 0;
    if (password.length > 7) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setStrength(score);
  }, [password]);

  const onSubmit = async (data: FormData) => {
    setGeneralError(null);
    try {
      await registerUser(data.name, data.email, data.password);
      toast.success('Registration successful. Please verify your email.');
      router.push('/auth/login');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
      setGeneralError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`;

  return (
    <AuthLayout>
      <AuthCard>
        <div className="space-y-2 mb-6 text-left">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Create your TeamSync account 🚀</h1>
          <p className="text-sm text-muted-foreground">Join hackathons, find teammates, and start building.</p>
        </div>

        {generalError && (
          <div className="p-3.5 mb-5 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Social Login Button */}
        <div className="mb-6">
          <a
            href={googleAuthUrl}
            className="w-full flex items-center justify-center space-x-3 px-4 py-2.5 border border-border/80 rounded-xl shadow-sm bg-card hover:bg-accent/60 text-foreground font-semibold text-sm transition-all duration-200 hover:border-border"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </a>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-background px-3 text-muted-foreground font-semibold">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            id="name" 
            type="text" 
            label="Full Name" 
            placeholder="John Doe" 
            icon={<User size={18} />}
            {...register('name')} 
            error={errors.name?.message} 
          />
          
          <Input 
            id="email" 
            type="email" 
            label="Email Address"
            placeholder="you@example.com" 
            icon={<Mail size={18} />}
            {...register('email')} 
            error={errors.email?.message} 
          />
          
          <div className="space-y-2">
            <PasswordInput 
              label="Password" 
              placeholder="Create a strong password"
              icon={<Lock size={18} />}
              error={errors.password?.message} 
              {...register('password')} 
            />
            
            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="flex gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <motion.div
                    key={level}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.3, delay: level * 0.05 }}
                    className={`h-1 w-full rounded-full ${
                      strength >= level 
                        ? strength < 3 ? 'bg-danger' : strength < 5 ? 'bg-warning' : 'bg-success'
                        : 'bg-muted/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
          <PasswordInput 
            label="Confirm Password" 
            placeholder="Confirm your password"
            icon={<Lock size={18} />}
            error={errors.confirmPassword?.message} 
            {...register('confirmPassword')} 
          />
          
          <Button 
            type="submit" 
            className="w-full mt-3 h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 border border-purple-500/30 transition-all duration-300" 
            disabled={isSubmitting} 
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs font-medium text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline transition-colors inline-flex items-center">
            Sign in <ArrowRight size={14} className="ml-1" />
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
