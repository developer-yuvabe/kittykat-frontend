import { FORM_MESSAGES } from "@/lib/constants";
import { z } from "zod";
import { UserRoleId } from "@/types/user.types";
import { TeamRolesEnum } from "@/types/team.types";

// ============================================================================
// Team Invitation Form Schema (for forms - simpler structure)
// ============================================================================
export const teamInvitationFormSchema = z.object({
  email: z.string().email({ message: FORM_MESSAGES.INVALID_EMAIL }),
  teamRole: z.nativeEnum(TeamRolesEnum),
  modelAccess: z.array(z.string().optional()),
});

// ============================================================================
// Team Invitation Schema (New flow - invite to team)
// Supports two cases:
// 1. Existing platform user -> Only adds to team members with status="invited"
// 2. New user -> Creates platform invitation + adds to team members
// ============================================================================
export const teamInvitationSchema = z.object({
  email: z.string().email({ message: FORM_MESSAGES.INVALID_EMAIL }),
  teamId: z.string().min(1, { message: "Team ID is required" }),
  teamRole: z.nativeEnum(TeamRolesEnum).default(TeamRolesEnum.MEMBER),
  // Platform role for new users (optional - defaults to USER on backend)
  role: z
    .enum([UserRoleId.ADMIN, UserRoleId.USER])
    .optional()
    .default(UserRoleId.USER),
  modelAccess: z.array(z.string()).optional().default([]),
  contentFilterDisabled: z.boolean().optional().default(false),
});

// ============================================================================
// Combined Invitation Schema (for API - supports both flows)
// ============================================================================
export const invitationSchema = z.object({
  email: z.string().email({ message: FORM_MESSAGES.INVALID_EMAIL }),
  role: z.enum(
    [UserRoleId.ADMIN, UserRoleId.USER, UserRoleId.KK_CREATIVE_USER],
    {
      errorMap: () => ({ message: "Please select a role" }),
    }
  ),
  modelAccess: z.array(z.string()),
  contentFilterDisabled: z.boolean(),
  // Team invitation fields (optional)
  teamId: z.string().optional(),
  teamRole: z.nativeEnum(TeamRolesEnum).optional(),
  credits: z.number().optional(),
  tokens: z.number().optional(),
});

export const invitationAcceptSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(50, { message: "Password must be at most 50 characters long" }),
});

export const teamInvitationAcceptSchema = z.object({
  teamId: z.string().min(1, { message: "Team ID is required" }),
});

export type TeamInvitationFormInput = z.infer<typeof teamInvitationFormSchema>;
export type TeamInvitationInput = z.infer<typeof teamInvitationSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
export type InvitationAcceptInput = z.infer<typeof invitationAcceptSchema>;
export type TeamInvitationAcceptInput = z.infer<
  typeof teamInvitationAcceptSchema
>;
