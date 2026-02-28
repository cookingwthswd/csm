'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';

/**
 * Forgot Password Page
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send reset email'
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h1 className="text-2xl font-bold text-gray-800">Check Your Email</h1>
          <p className="mt-4 text-gray-600">
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
            Please check your inbox and follow the instructions.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
        <p className="mt-2 text-gray-600">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
