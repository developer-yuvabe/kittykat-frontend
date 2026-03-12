import { UserRoleId } from "@/types/user.types";
import { z } from "zod";

export const updateInvitedUserSchema = z
  .object({
    contentFilterDisabled: z.boolean(),
    role: z.enum(
      [UserRoleId.ADMIN, UserRoleId.USER, UserRoleId.KK_CREATIVE_USER],
      {
        errorMap: () => ({ message: "Please select a role" }),
      }
    ),
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

export const tokenUsageExportSchema = z
  .object({
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    workspace_id: z.array(z.string()).optional(),
    user_id: z.array(z.string()).optional(),
    brand_id: z.array(z.string()).optional(),
    model_id: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (!data.start_date) return true;
      const today = new Date().toISOString().split("T")[0];
      return data.start_date <= today;
    },
    { message: "Start date cannot be in the future", path: ["start_date"] }
  )
  .refine(
    (data) =>
      !data.start_date || !data.end_date || data.end_date >= data.start_date,
    { message: "End date must be on or after start date", path: ["end_date"] }
  )
  .refine(
    (data) => {
      if (!data.end_date) return true;
      const today = new Date().toISOString().split("T")[0];
      return data.end_date <= today;
    },
    { message: "End date cannot be in the future", path: ["end_date"] }
  );

export type TokenUsageExportFormData = z.infer<typeof tokenUsageExportSchema>;

