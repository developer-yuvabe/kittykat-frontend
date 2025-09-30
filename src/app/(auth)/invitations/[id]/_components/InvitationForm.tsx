"use client";

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
import { invitationAcceptSchema } from "@/schema/inviation.schema";
import { acceptInvitation } from "@/services/api/user.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, UserCredential } from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const InvitationForm = ({
  email,
  invitationId,
}: {
  email: string;
  invitationId: string;
}) => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof invitationAcceptSchema>>({
    resolver: zodResolver(invitationAcceptSchema),
    defaultValues: {
      password: "",
      username: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof invitationAcceptSchema>) => {
    let credential: UserCredential | null = null;

    try {
      setFormError(null);
      credential = await createUserWithEmailAndPassword(
        auth,
        email,
        data.password
      );

      // Accept the invitation
      await acceptInvitation(invitationId, credential.user.uid, data.username);

      // Sign in the user with the provided email and password
      const idToken = await credential.user.getIdToken();

      await fetch("/api/login", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      router.refresh();
      router.push(AppConfig.HOME_ROUTE);
    } catch (e) {
      if (credential?.user) {
        // If user creation was successful but invitation acceptance failed, delete the created user to avoid orphan accounts.
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
          <CardTitle className="text-xl">
            You have been invited to join the platform.
          </CardTitle>
          <CardDescription className="text-center md:text-left">
            Please fill in your details to create an account and accept the
            invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    disabled
                    placeholder="john@kittykat.ai"
                    value={email}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Jon Doe" {...field} />
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
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationForm;
