'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';

/**
 * Reset Password Page - Callback after clicking reset link
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Check if user has a valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsValidSession(!!session);
    });

    // Listen for auth state changes (recovery token exchange)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Password strength checker
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const length = password.length;

    const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (length >= 8 && score >= 3) {
      setPasswordStrength('strong');
    } else if (length >= 6 && score >= 2) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('weak');
    }
  }, [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to reset password'
      );
    } finally {
      setLoading(false);
    }
  }

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  if (isValidSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800">Invalid Link</h1>
          <p className="mt-4 text-gray-600">
            This password reset link is invalid or has expired.
          </p>
          <div className="mt-6">
            <Link
              href="/forgot-password"
              className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
          <h1 className="text-2xl font-bold text-green-600">Password Reset!</h1>
          <p className="mt-4 text-gray-600">
            Your password has been successfully updated. Redirecting to
            dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-gray-800">Set New Password</h1>
        <p className="mt-2 text-gray-600">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />

          {passwordStrength && (
            <div className="mb-4 -mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-200 rounded">
                  <div
                    className={`h-1 rounded transition-all ${strengthColors[passwordStrength]}`}
                    style={{
                      width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%',
                    }}
                  />
                </div>
                <span className={`text-xs ${passwordStrength === 'weak' ? 'text-red-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            </div>
          )}

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
