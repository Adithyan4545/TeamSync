'use client';

import React from 'react';
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
import { Mail, AlertCircle, ArrowRight, Lock } from 'lucide-react';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Must include uppercase letter' })
    .regex(/[a-z]/, { message: 'Must include lowercase letter' })
    .regex(/[0-9]/, { message: 'Must include a number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Must include a special character' }),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [generalError, setGeneralError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setGeneralError(null);
    try {
      await login(data.email, data.password, data.rememberMe ?? false);
      toast.success('Logged in successfully');
      router.push('/hackathons');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Invalid email or password';
      setGeneralError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`;

  return (
    <AuthLayout>
      <AuthCard>
        <div className="space-y-2 mb-6 text-left">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Welcome back 👋</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue to TeamSync.</p>
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
            id="email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            icon={<Mail size={18} />}
            {...register('email')}
            error={errors.email?.message}
          />
          
          <PasswordInput 
            label="Password" 
            placeholder="Enter your password"
            icon={<Lock size={18} />}
            error={errors.password?.message} 
            {...register('password')} 
          />
          
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input 
                type="checkbox" 
                {...register('rememberMe')} 
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary transition-colors cursor-pointer bg-background/50" 
              />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Remember me
              </span>
            </label>

            <Link href="/auth/forgot-password" className="text-xs font-semibold text-primary hover:underline transition-colors">
              Forgot password?
            </Link>
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-3 h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 border border-purple-500/30 transition-all duration-300" 
            disabled={isSubmitting} 
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        
        <p className="mt-6 text-center text-xs font-medium text-muted-foreground">
          Don’t have an account?{' '}
          <Link href="/auth/register" className="font-semibold text-primary hover:underline transition-colors inline-flex items-center">
            Create account <ArrowRight size={14} className="ml-1" />
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
