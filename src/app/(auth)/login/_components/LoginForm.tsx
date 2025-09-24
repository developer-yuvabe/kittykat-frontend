"use client";

import ErrorMessage from "@/components/shared/ErrorMessage";
import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
import { loginSchema } from "@/schema/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const LoginForm = () => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      setFormError(null);
      const credential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const idToken = await credential.user.getIdToken();

      await fetch("/api/login", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      router.push(AppConfig.HOME_ROUTE);
    } catch (e) {
      const errorMsg = processAuthError(e);

      setFormError(errorMsg);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="shadow-none border-0 w-sm md:w-[28rem]">
        <CardHeader className="flex flex-col items-center md:items-start">
          <Logo />
          <CardTitle className="text-xl">Welcome back!</CardTitle>
          <CardDescription className="text-center md:text-left">
            Please enter your credentials to login to agents platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <FormControl>
                      <PasswordInput placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {formError && <ErrorMessage message={formError} />}

              <Button
                className="w-full"
                type="submit"
                disabled={form.formState.isSubmitting}
                loading={form.formState.isSubmitting}
              >
                Login
              </Button>

              <p className="text-sm text-center">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-primary font-medium hover:underline italic"
                >
                  Sign Up
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
