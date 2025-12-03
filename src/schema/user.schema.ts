import { UserRoleId } from "@/types/user.types";
import { z } from "zod";

export const updateInvitedUserSchema = z
  .object({
    contentFilterDisabled: z.boolean(),
    role: z.enum([UserRoleId.ADMIN, UserRoleId.USER], {
      errorMap: () => ({ message: "Please select a role" }),
    }),
    modelAccess: z.array(z.string()).optional(),
    name: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === UserRoleId.USER) {
        return data.modelAccess !== undefined;
      }
      return true;
    },
    {
      message: "Model access is required when role is USER",
      path: ["modelAccess"],
    }
  );
