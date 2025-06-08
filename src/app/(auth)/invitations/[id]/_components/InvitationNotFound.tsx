"use client";

import Logo from "@/components/shared/Logo";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Ban } from "lucide-react";
import Link from "next/link";

const InvitationNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="shadow-none border-0 w-sm md:w-[28rem]">
        <CardHeader className="flex flex-col items-center md:items-start">
          <Logo />
          <CardTitle className="text-2xl flex items-center gap-2">
            <Ban />
            Invitation Not Found
          </CardTitle>
          <CardDescription className="text-center md:text-left">
            <p className="text-lg font-semibold">
              We couldn’t find an invitation with this link.
            </p>
            It’s possible the link has expired, is invalid, or the invitation
            has already been accepted. Please check the link or contact the
            person who invited you.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
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
  );
};

export default InvitationNotFound;
