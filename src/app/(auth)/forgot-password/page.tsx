"use client";

import AuthUiWrapper from "@/components/shared/AuthUiWrapper";
import ErrorMessage from "@/components/shared/ErrorMessage";
import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AppConfig } from "@/config/app.config";
import { auth } from "@/config/firebase.config";
import { processAuthError } from "@/lib/utils";
import { forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordSchema, type ResetPasswordSchema } from "@/schema/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader } from "@/components/ui/loader";

type PageMode = 'email' | 'reset' | 'loading' | 'error';

const ForgotPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pageMode, setPageMode] = useState<PageMode>('loading');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Get URL parameters
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");
  const continueUrl = searchParams.get("continueUrl");

  // Email form for sending reset link
  const emailForm = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Password reset form
  const passwordForm = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check URL parameters and verify reset code with a delay
  useEffect(() => {
    console.log("URL Parameters:", { oobCode, mode, continueUrl });

    // If URL parameters are present, this is a reset password request
    if (oobCode && mode === "resetPassword") {
      // Show skeleton loader for 1 second before verifying
      setTimeout(() => {
        verifyResetCode();
      }, 1000);
    } else if (oobCode || mode || continueUrl) {
      // Some parameters present but not all correct
      setTimeout(() => {
        setFormError("Invalid or incomplete reset link parameters.");
        setPageMode('error');
      }, 1000);
    } else {
      // No parameters, show email form after delay
      setTimeout(() => {
        setPageMode('email');
      }, 1000);
    }
  }, [oobCode, mode, continueUrl]);

  // Verify the reset code from Firebase
  const verifyResetCode = async () => {
    if (!oobCode) {
      setFormError("Missing reset code.");
      setPageMode('error');
      return;
    }

    try {
      // Verify the password reset code and get the user's email
      const email = await verifyPasswordResetCode(auth, oobCode);
      setUserEmail(email);
      setPageMode('reset');
      setFormError(null);
    } catch (error) {
      console.error("Error verifying reset code:", error);
      const errorMsg = processAuthError(error);
      setFormError(errorMsg || "Invalid or expired reset link.");
      setPageMode('error');
    }
  };

  // Countdown timer effect for redirect
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Handle sending password reset email
  const onEmailSubmit = async (data: ForgotPasswordSchema) => {
    try {
      setFormError(null);
      setFormSuccess(null);
      setCountdown(null);
      
      await sendPasswordResetEmail(auth, data.email, {
        url: AppConfig.RESET_PASSWORD_URL || "http://localhost:3000/forgot-password",
        handleCodeInApp: true,
      });
      
      setFormSuccess("Password reset email sent! Please check your inbox.");
      emailForm.reset();
      setCountdown(5);
      
      setTimeout(() => {
        router.push(AppConfig.LOGIN_ROUTE || "/login");
      }, 5000);
    } catch (e) {
      const errorMsg = processAuthError(e);
      setFormError(errorMsg);
    }
  };

  // Handle password reset
  const onPasswordSubmit = async (data: ResetPasswordSchema) => {
    if (!oobCode) {
      setFormError("Missing reset code.");
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);
      
      // Confirm the password reset with the new password
      await confirmPasswordReset(auth, oobCode, data.password);
      
      setFormSuccess("Password reset successfully! Redirecting to login...");
      passwordForm.reset();
      setCountdown(3);
      
      setTimeout(() => {
        router.push(AppConfig.LOGIN_ROUTE || "/login");
      }, 3000);
    } catch (error) {
      console.error("Error resetting password:", error);
      const errorMsg = processAuthError(error);
      setFormError(errorMsg || "Failed to reset password. Please try again.");
    }
  };

  // Render loading state with skeleton UI
  const renderLoading = () => (
    <>
      <CardHeader className="flex flex-col items-center md:items-start space-y-4">
        {/* Skeleton for Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {/* Skeleton for CardTitle */}
        <div className="w-48 h-7 bg-gray-200 rounded animate-pulse"></div>
        {/* Skeleton for CardDescription */}
        <div className="w-64 h-5 bg-gray-200 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Skeleton for Input Fields */}
        <div className="space-y-4">
          <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {/* Skeleton for Button */}
        <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
        {/* Skeleton for Back to Login Link */}
        <div className="w-32 h-5 bg-gray-200 rounded mx-auto animate-pulse"></div>
      </CardContent>
    </>
  );

  // Render error state
  const renderError = () => (
    <>
      <CardHeader className="flex flex-col items-center md:items-start">
        <Logo />
        <CardTitle className="text-xl">Invalid Reset Link</CardTitle>
        <CardDescription className="text-center md:text-left">
          This password reset link is invalid or has expired.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formError && <ErrorMessage message={formError} />}
        <div className="space-y-4 mt-6">
          <Button 
            className="w-full" 
            onClick={() => {
              setPageMode('email');
              setFormError(null);
              // Clear URL parameters
              router.replace('/forgot-password');
            }}
          >
            Request New Reset Link
          </Button>
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-primary hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </CardContent>
    </>
  );

  // Render email input form
  const renderEmailForm = () => (
    <>
      <CardHeader className="flex flex-col items-center md:items-start">
        <Logo />
        <CardTitle className="text-xl">Forgot Password</CardTitle>
        <CardDescription className="text-center md:text-left">
          Enter your email to receive a password reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@kittykat.ai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError && <ErrorMessage message={formError} />}
            {formSuccess && (
              <div className="text-left">
                <p className="text-sm text-green-600">{formSuccess}</p>
                <p className="text-sm mt-2">
                  Redirecting to login in{" "}
                  {countdown !== null ? countdown : 5} seconds...
                </p>
              </div>
            )}

            <Button
              className="w-full"
              type="submit"
              disabled={emailForm.formState.isSubmitting}
            >
              {emailForm.formState.isSubmitting ? <Loader /> : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-primary hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </>
  );

  // Render password reset form
  const renderResetForm = () => (
    <>
      <CardHeader className="flex flex-col items-center md:items-start">
        <Logo />
        <CardTitle className="text-xl">Reset Password</CardTitle>
        <CardDescription className="text-center md:text-left">
          {userEmail ? `Resetting password for ${userEmail}` : "Enter your new password below."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Enter your new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Confirm your new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError && <ErrorMessage message={formError} />}
            {formSuccess && (
              <div className="text-left">
                <p className="text-sm text-green-600">{formSuccess}</p>
                <p className="text-sm mt-2">
                  Redirecting to login in{" "}
                  {countdown !== null ? countdown : 3} seconds...
                </p>
              </div>
            )}

            <Button
              className="w-full"
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
            >
              {passwordForm.formState.isSubmitting ? <Loader /> : "Reset Password"}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-primary hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </>
  );

  // Main render logic
  const renderContent = () => {
    switch (pageMode) {
      case 'loading':
        return renderLoading();
      case 'error':
        return renderError();
      case 'reset':
        return renderResetForm();
      case 'email':
      default:
        return renderEmailForm();
    }
  };

  return (
    <AuthUiWrapper>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="shadow-none border-0 w-sm md:w-[28rem]">
          {renderContent()}
        </Card>
      </div>
    </AuthUiWrapper>
  );
};

export default ForgotPasswordPage;