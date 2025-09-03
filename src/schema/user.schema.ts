import { UserRoleId } from "@/types/user.types";
import { z } from "zod";

export const updateInvitedUserSchema = z
  .object({
    contentFilterDisabled: z.boolean(),
    role: z.enum([UserRoleId.ADMIN, UserRoleId.USER], {
      errorMap: () => ({ message: "Please select a role" }),
    }),
    brandAccess: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.role === UserRoleId.USER) {
        return data.brandAccess !== undefined;
      }
      return true;
    },
    {
      message: "Brand access is required when role is USER",
      path: ["brandAccess"],
    }
  );
