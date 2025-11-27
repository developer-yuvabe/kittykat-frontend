import { FORM_MESSAGES } from "@/lib/constants";
import { z } from "zod";
import { UserRoleId } from "@/types/user.types";

export const inviationSchema = z.object({
  email: z.string().email({ message: FORM_MESSAGES.INVALID_EMAIL }),

  role: z.enum([UserRoleId.ADMIN, UserRoleId.USER], {
    errorMap: () => ({ message: "Please select a role" }),
  }),
  brandAccess: z.array(z.string()),
  modelAccess: z.array(z.string()),
  contentFilterDisabled: z.boolean(),
  tokens: z.number().min(0, "Tokens must be a positive number"),
  credits: z
    .number()
    .min(0, "KittyKat Expert Credits must be a positive number"),
});

export const invitationAcceptSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(50, { message: "Password must be at most 50 characters long" }),
});
