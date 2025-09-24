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
import { signupSchema } from "@/schema/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createUser } from "@/services/api/user.service";

const SignUpForm = () => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    let credential = null;
    try {
      setFormError(null);
      credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const idToken = await credential.user.getIdToken();

      await createUser({
        uid: credential.user.uid,
        email: data.email,
        name: data.name,
      });

      await fetch("/api/login", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      router.push(AppConfig.HOME_ROUTE);
    } catch (e) {
      if (credential?.user) {
        // If user creation succeeded but something else failed, delete the user to avoid orphaned accounts
        await credential.user.delete();
      }

      const errorMsg = processAuthError(e);

      setFormError(errorMsg);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="shadow-none border-0 w-sm md:w-[28rem]">
        <CardHeader className="flex flex-col items-center md:items-start">
          <Logo />
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription className="text-center md:text-left">
            Start your journey with us today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormLabel>Password</FormLabel>

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
                Sign Up
              </Button>

              <p className="text-sm text-center">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary font-medium hover:underline italic"
                >
                  Login
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpForm;
