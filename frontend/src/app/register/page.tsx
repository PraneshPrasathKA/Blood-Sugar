'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Droplet, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { RegisterFormValues, registerFormSchema } from '@/lib/validations';
import { ApiError } from '@/services/api';

export default function RegisterPage() {
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerUser(values);
      router.replace('/dashboard');
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError('Unable to create account. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Droplet className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            Create your Sweety account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start logging daily readings and viewing monthly glucose reports.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              All readings are private to your account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {serverError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Pranesh Sharma"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create account
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-border pt-4 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="ml-1 font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

