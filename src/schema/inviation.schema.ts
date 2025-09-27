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
  credits: z.number().min(0, "Credits must be a positive number"),
  kittykat_expert_credits: z.number().min(0).optional(),
});

export const invitationAcceptSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(50, { message: "Password must be at most 50 characters long" }),
});
