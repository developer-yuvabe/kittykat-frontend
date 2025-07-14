"use client";

import AuthUiWrapper from "@/components/shared/AuthUiWrapper";
import Logo from "@/components/shared/Logo";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/config/firebase.config";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { ShieldOff } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

const page = () => {
  useEffect(() => {
    const logout = async () => {
      await signOut(auth);
      fetch("/api/logout");
    };

    logout();
  }, []);

  return (
    <AuthUiWrapper>
      <div className="flex flex-col items-center justify-center">
        <Card className="shadow-none border-0 w-sm md:w-[28rem]">
          <CardHeader className="flex flex-col items-center md:items-start">
            <Logo />
            <CardTitle className="text-2xl flex items-center gap-2">
              <ShieldOff />
              Unauthorized Access
            </CardTitle>
            <CardDescription className="text-center md:text-left">
              <p className="text-lg font-semibold">
                You don’t have the required permissions to view this page.
              </p>
              This area is restricted to certain roles or users. If you believe
              this is a mistake, try logging in with a different account or go
              back to a page you can access.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link
              onClick={() => {
                window.location.reload();
              }}
              href={"/login"}
              className={cn(
                buttonVariants({
                  className: "w-full",
                })
              )}
            >
              Go to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </AuthUiWrapper>
  );
};

export default page;
