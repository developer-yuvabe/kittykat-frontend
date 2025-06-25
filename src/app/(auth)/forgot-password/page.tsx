"use client";

import AuthUiWrapper from "@/components/shared/AuthUiWrapper";
import ErrorMessage from "@/components/shared/ErrorMessage";
import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
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
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordSchema,
  type ResetPasswordSchema,
} from "@/schema/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { Loader } from "@/components/ui/loader";

type PageMode = "email" | "reset" | "loading" | "error";

const ForgotPasswordPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);


  const loginRoute = "/login";

  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");
  const continueUrl = searchParams.get("continueUrl");

  // Determine initial page mode based on URL parameters
  const [pageMode, setPageMode] = useState<PageMode>(() => {
    if (oobCode && mode === "resetPassword") {
      return "loading";
    }
    return "email";
  });


  const emailForm = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const passwordForm = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const handleResetFlow = async () => {
      if (oobCode && mode === "resetPassword") {
        setPageMode("loading");
        setIsVerifying(true);
        await verifyResetCode();
        setIsVerifying(false);
      } else if (oobCode || mode || continueUrl) {
        setFormError("Invalid or incomplete reset link parameters.");
        setPageMode("error");
      }
    };

    handleResetFlow();
  }, [oobCode, mode, continueUrl]);

  const verifyResetCode = async () => {
    if (!oobCode) {
      setFormError("Missing reset code.");
      setPageMode("error");
      return;
    }

    try {
      console.log("Verifying reset code..."); // Debug log
      const email = await verifyPasswordResetCode(auth, oobCode);
      console.log("Reset code verified for email:", email); // Debug log
        
      setUserEmail(email);
      setPageMode("reset");
      setFormError(null);
    } catch (error) {
      console.error("Reset code verification failed:", error); // Debug log

      const errorMsg = processAuthError(error);
      setFormError(errorMsg || "Invalid or expired reset link.");
      setPageMode("error");
    }
  };

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const onEmailSubmit = async (data: ForgotPasswordSchema) => {
    try {
      setFormError(null);
      setFormSuccess(null);
      setCountdown(null);

      await sendPasswordResetEmail(auth, data.email);

      setFormSuccess("Password reset email sent! Please check your inbox.");
      emailForm.reset();
      setCountdown(5);

      setTimeout(() => {
        router.push(loginRoute);
      }, 5000);
    } catch (e) {
      const errorMsg = processAuthError(e);
      setFormError(errorMsg);
    }
  };

  const onPasswordSubmit = async (data: ResetPasswordSchema) => {
    if (!oobCode) {
      setFormError("Missing reset code.");
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);

      await confirmPasswordReset(auth, oobCode, data.password);

      setFormSuccess("Password reset successfully! Redirecting to login...");
      passwordForm.reset();
      setCountdown(3);

      setTimeout(() => {
        router.push(loginRoute);
      }, 3000);
    } catch (error) {
      const errorMsg = processAuthError(error);
      setFormError(errorMsg || "Failed to reset password. Please try again.");
    }
  };

  const renderLoading = () => (
    <>
      <CardHeader className="flex flex-col items-center md:items-start">
        <Logo />
        <div className="w-28 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Password field skeleton */}
          <div className="space-y-2">
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Confirm password field skeleton */}
          <div className="space-y-2">
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Button skeleton */}
          <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>

          {/* Loading spinner */}
          <div className="flex items-center justify-center">
            <Loader />
          </div>

          {/* Back to login link skeleton */}
          <div className="text-center">
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
          </div>
        </div>
      </CardContent>
    </>
  );


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
              setPageMode("email");
              setFormError(null);
              router.replace("/forgot-password");
            }}
          >
            Request New Reset Link
          </Button>
          <div className="text-center">
            <Link href={loginRoute} className="text-sm font-medium text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </CardContent>
    </>
  );

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
                  Redirecting to login in {countdown !== null ? countdown : 5} seconds...
                </p>
              </div>
            )}

            <Button className="w-full" type="submit" disabled={emailForm.formState.isSubmitting}>
              {emailForm.formState.isSubmitting ? <Loader /> : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <Link href={loginRoute} className="text-sm font-medium text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </>
  );

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
                  Redirecting to login in {countdown !== null ? countdown : 3} seconds...
                </p>
              </div>
            )}

            <Button className="w-full" type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? <Loader /> : "Reset Password"}
            </Button>

            <div className="text-center">
              <Link href={loginRoute} className="text-sm font-medium text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </>
  );

  const renderContent = () => {
    switch (pageMode) {
      case "loading":
        return renderLoading();
      case "error":
        return renderError();
      case "reset":
        return renderResetForm();
      case "email":
        return renderEmailForm();
      default:
        return renderEmailForm();
    }
  };

  return (
    <AuthUiWrapper>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="shadow-none border-0 w-sm md:w-[28rem]">{renderContent()}</Card>
      </div>
    </AuthUiWrapper>
  );
};

const ForgotPasswordPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordPageContent />
    </Suspense>
  );
};

export default ForgotPasswordPage;

