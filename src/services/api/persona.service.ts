import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { BrandPersona, PersonaUpdateRequest } from "@/types/persona.types";

/**
 * Generate differentiated, prompt-ready buyer personas for a brand.
 *
 * @param brandId - The brand identifier
 * @param n - Number of personas to generate (1-10, default: 3)
 * @param saveToDb - Whether to save generated personas to brand document (default: true)
 * @returns Generated personas with differentiation summary
 */
export async function generatePersonas(
  brandId: string,
  n: number = 3,
  saveToDb: boolean = true
): Promise<{
  personas: BrandPersona[];
  differentiation_summary: string;
  saved_to_brand: boolean;
  count: number;
}> {
  return handleApiRequest<{
    personas: BrandPersona[];
    differentiation_summary: string;
    saved_to_brand: boolean;
    count: number;
  }>(
    axiosInstance.post(`/brands/${brandId}/personas/generate`, {
      n,
      save_to_brand: saveToDb,
    })
  );
}

/**
 * List all personas for a brand.
 *
 * @param brandId - The brand identifier
 * @returns All personas with metadata
 */
export async function listPersonas(brandId: string): Promise<BrandPersona[]> {
  return handleApiRequest<BrandPersona[]>(
    axiosInstance.get(`/brands/${brandId}/personas`)
  );
}

/**
 * Retrieve a specific persona by ID.
 *
 * @param brandId - The brand identifier
 * @param personaId - The persona identifier
 * @returns Single persona details
 */
export async function getPersonaById(
  brandId: string,
  personaId: string
): Promise<BrandPersona> {
  return handleApiRequest<BrandPersona>(
    axiosInstance.get(`/brands/${brandId}/personas/${personaId}`)
  );
}

/**
 * Create a new persona for a brand.
 *
 * @param brandId - The brand identifier
 * @param personaData - Persona data
 * @returns Created persona details
 */
export async function createPersona(
  brandId: string,
  personaData: PersonaUpdateRequest
): Promise<BrandPersona> {
  return handleApiRequest<BrandPersona>(
    axiosInstance.post(`/brands/${brandId}/personas`, personaData)
  );
}

/**
 * Update a specific persona with new data.
 *
 * @param brandId - The brand identifier
 * @param personaId - The persona identifier
 * @param updates - Fields to update
 * @returns Updated persona details
 */
export async function updatePersona(
  brandId: string,
  personaId: string,
  updates: PersonaUpdateRequest
): Promise<BrandPersona> {
  return handleApiRequest<BrandPersona>(
    axiosInstance.patch(`/brands/${brandId}/personas/${personaId}`, updates)
  );
}

/**
 * Delete a specific persona from a brand.
 *
 * @param brandId - The brand identifier
 * @param personaId - The persona identifier
 * @returns Deletion confirmation
 */
export async function deletePersona(
  brandId: string,
  personaId: string
): Promise<{ persona_id: string; brand_id: string }> {
  return handleApiRequest<{ persona_id: string; brand_id: string }>(
    axiosInstance.delete(`/brands/${brandId}/personas/${personaId}`)
  );
}

/**
 * Delete all personas for a brand.
 *
 * @param brandId - The brand identifier
 * @returns Deletion confirmation
 */
export async function deleteAllPersonas(
  brandId: string
): Promise<{ brand_id: string }> {
  return handleApiRequest<{ brand_id: string }>(
    axiosInstance.delete(`/brands/${brandId}/personas`)
  );
}

/**
 * Batch update multiple personas for a brand.
 *
 * @param brandId - The brand identifier
 * @param personaUpdates - Array of persona updates with IDs
 * @returns Updated personas
 */
export async function batchUpdatePersonas(
  brandId: string,
  personaUpdates: Array<{ id: string; updates: PersonaUpdateRequest }>
): Promise<BrandPersona[]> {
  const updatePromises = personaUpdates.map(({ id, updates }) =>
    updatePersona(brandId, id, updates)
  );

  return Promise.all(updatePromises);
}

/**
 * Batch delete multiple personas.
 *
 * @param brandId - The brand identifier
 * @param personaIds - Array of persona IDs to delete
 * @returns Deletion results
 */
export async function batchDeletePersonas(
  brandId: string,
  personaIds: string[]
): Promise<Array<{ persona_id: string; brand_id: string }>> {
  const deletePromises = personaIds.map((id) => deletePersona(brandId, id));

  return Promise.all(deletePromises);
}
