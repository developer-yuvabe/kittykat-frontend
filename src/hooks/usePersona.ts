"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generatePersonas,
  listPersonas,
  getPersonaById,
  updatePersona,
  deletePersona,
  deleteAllPersonas,
  batchUpdatePersonas,
  batchDeletePersonas,
} from "@/services/api/persona.service";
import { PersonaUpdateRequest } from "@/types/persona.types";

/**
 * useGeneratePersonas - Generate personas for a brand
 */
export function useGeneratePersonas() {
  return useMutation({
    mutationFn: ({
      brandId,
      n,
      saveToDb,
    }: {
      brandId: string;
      n?: number;
      saveToDb?: boolean;
    }) => generatePersonas(brandId, n, saveToDb),
  });
}

/**
 * useListPersonas - Fetch all personas for a brand
 */
export function useListPersonas(brandId: string) {
  return useQuery({
    queryKey: ["personas", brandId],
    queryFn: () => listPersonas(brandId),
  });
}

/**
 * useGetPersona - Fetch a specific persona by ID
 */
export function useGetPersona(brandId: string, personaId: string) {
  return useQuery({
    queryKey: ["persona", brandId, personaId],
    queryFn: () => getPersonaById(brandId, personaId),
  });
}

/**
 * useUpdatePersona - Update a persona
 */
export function useUpdatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      brandId,
      personaId,
      updates,
    }: {
      brandId: string;
      personaId: string;
      updates: PersonaUpdateRequest;
    }) => updatePersona(brandId, personaId, updates),
    onSuccess: (data, { brandId, personaId }) => {
      // Invalidate persona query
      queryClient.invalidateQueries({
        queryKey: ["persona", brandId, personaId],
      });
      // Invalidate list query
      queryClient.invalidateQueries({ queryKey: ["personas", brandId] });
    },
  });
}

/**
 * useDeletePersona - Delete a persona
 */
export function useDeletePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      brandId,
      personaId,
    }: {
      brandId: string;
      personaId: string;
    }) => deletePersona(brandId, personaId),
    onSuccess: (_, { brandId, personaId }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["persona", brandId, personaId] });
      // Invalidate list query
      queryClient.invalidateQueries({ queryKey: ["personas", brandId] });
    },
  });
}

/**
 * useDeleteAllPersonas - Delete all personas for a brand
 */
export function useDeleteAllPersonas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandId: string) => deleteAllPersonas(brandId),
    onSuccess: (_, brandId) => {
      // Clear all persona queries for this brand
      queryClient.removeQueries({ queryKey: ["personas", brandId] });
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === "persona" && query.queryKey[1] === brandId,
      });
    },
  });
}

/**
 * useBatchUpdatePersonas - Update multiple personas
 */
export function useBatchUpdatePersonas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      brandId,
      updates,
    }: {
      brandId: string;
      updates: Array<{ id: string; updates: PersonaUpdateRequest }>;
    }) => batchUpdatePersonas(brandId, updates),
    onSuccess: (_, { brandId }) => {
      // Invalidate all persona queries for this brand
      queryClient.invalidateQueries({ queryKey: ["personas", brandId] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "persona" && query.queryKey[1] === brandId,
      });
    },
  });
}

/**
 * useBatchDeletePersonas - Delete multiple personas
 */
export function useBatchDeletePersonas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ brandId, ids }: { brandId: string; ids: string[] }) =>
      batchDeletePersonas(brandId, ids),
    onSuccess: (_, { brandId, ids }) => {
      // Remove deleted personas from cache
      ids.forEach((id) => {
        queryClient.removeQueries({ queryKey: ["persona", brandId, id] });
      });
      // Invalidate list query
      queryClient.invalidateQueries({ queryKey: ["personas", brandId] });
    },
  });
}

/**
 * Convenience namespace exporting all persona operations
 */
export const usePersona = {
  useGeneratePersonas,
  useListPersonas,
  useGetPersona,
  useUpdatePersona,
  useDeletePersona,
  useDeleteAllPersonas,
  useBatchUpdatePersonas,
  useBatchDeletePersonas,
};
