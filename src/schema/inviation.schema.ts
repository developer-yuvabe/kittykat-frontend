import { FORM_MESSAGES } from "@/lib/constants";
import { z } from "zod";
import { UserRoleId } from "@/types/user.types";
import { checkIfEmailExists } from "@/services/api/user.service";

export const inviationSchema = z.object({
  email: z
    .string()
    .email({ message: FORM_MESSAGES.INVALID_EMAIL })
    .refine(
      async (email) => {
        return !(await checkIfEmailExists(email));
      },
      {
        message: "Email is already invited.",
      }
    ),
  role: z.enum([UserRoleId.ADMIN, UserRoleId.USER], {
    errorMap: () => ({ message: "Please select a role" }),
  }),
  brandAccess: z.array(z.string()),
});

export const invitationAcceptSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(50, { message: "Password must be at most 50 characters long" }),
});
