import { z } from "zod";
import { TeamRolesEnum } from "@/types/team.types";

export const teamMemberSchema = z.object({
  id: z.string().min(1, "Member ID is required"),
  role: z.nativeEnum(TeamRolesEnum).optional(),
});

export const teamCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name is too long"),
  credits: z.number().min(0, "Credits must be non-negative").optional(),
  tokens: z.number().min(0, "Tokens must be non-negative").optional(),
  members: z.array(teamMemberSchema).optional(),
  brands: z.array(z.string()).optional(),
  has_all_brands_access: z.boolean().optional(),
});

export const teamUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name is too long")
    .optional(),
  credits: z
    .number()
    .min(0, "Credits must be non-negative")
    .nullable()
    .optional(),
  tokens: z
    .number()
    .min(0, "Tokens must be non-negative")
    .nullable()
    .optional(),
  members: z.array(teamMemberSchema).optional(),
  brands: z.array(z.string()).optional(),
  has_all_brands_access: z.boolean().optional(),
  avatar_url: z.string().url("Please enter a valid URL").nullable().optional(),
});

export const addMembersSchema = z.object({
  members: z.array(teamMemberSchema).min(1, "At least one member is required"),
});

export const removeMembersSchema = z.object({
  memberIds: z.array(z.string()).min(1, "At least one member ID is required"),
});
