import { UserRoleId } from "@/types/user.types";
import { z } from "zod";

export const updateInvitedUserSchema = z.object({
  role: z.enum([UserRoleId.ADMIN, UserRoleId.USER], {
    errorMap: () => ({ message: "Please select a role" }),
  }),
  brandAccess: z.array(z.string()),
});
