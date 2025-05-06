import { FORM_MESSAGES } from "@/lib/constants";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: FORM_MESSAGES.INVALID_EMAIL }),
  password: z.string().min(6, { message: FORM_MESSAGES.INVALID_PASSWORD }),
});

export const signupSchema = z.object({
  username: z.string().min(1, { message: FORM_MESSAGES.INVALID_USERNAME }),
  email: z.string().email({ message: FORM_MESSAGES.INVALID_EMAIL }),
  password: z.string().min(6, { message: FORM_MESSAGES.INVALID_PASSWORD }),
});
