'use client';
import React from 'react';
import AuthLayout from '@/components/ui/AuthLayout';
import AuthCard from '@/components/ui/AuthCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-4xl font-bold text-center text-red-600 mb-4">403 - Unauthorized</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          You do not have permission to view this page.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
