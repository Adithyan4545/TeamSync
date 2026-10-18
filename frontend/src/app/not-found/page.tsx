'use client';
import React from 'react';
import AuthLayout from '@/components/ui/AuthLayout';
import AuthCard from '@/components/ui/AuthCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-4xl font-bold text-center text-gray-800 dark:text-gray-200 mb-4">404 – Page Not Found</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          Oops! The page you are looking for does not exist.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="secondary">Login</Button>
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
