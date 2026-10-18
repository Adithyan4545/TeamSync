'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthLayout from '@/components/ui/AuthLayout';
import AuthCard from '@/components/ui/AuthCard';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const passwordSchema = z.object({
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

type FormData = z.infer<typeof passwordSchema>;

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(passwordSchema) });

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
    try {
      const res = await axios.post('/auth/reset-password', {
        token,
        newPassword: data.password,
      });
      if (res.data.success) {
        toast.success('Password reset successful. You can now log in.');
        router.push('/auth/login');
      } else {
        toast.error(res.data.message || 'Reset failed');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Reset Password</h1>
          <p className="text-muted-foreground">
            Choose a new strong password for your account.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              error={errors.password?.message}
              {...register('password')}
            />
            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <motion.div
                    key={level}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.3, delay: level * 0.05 }}
                    className={`h-1 w-full rounded-full ${
                      strength >= level 
                        ? strength < 3 ? 'bg-danger' : strength < 5 ? 'bg-warning' : 'bg-success'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm new password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" className="w-full mt-2" disabled={isSubmitting} isLoading={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Reset Password'}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
