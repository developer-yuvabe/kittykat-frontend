"use server";

import { createClient, PhotosWithTotalResults, ErrorResponse } from "pexels";
import { env } from "@/config/env";

const client = createClient(env.PEXELS_API_KEY);

export async function searchPexelsPhotos(
  query: string,
  page: number = 1,
  perPage: number = 30
): Promise<PhotosWithTotalResults | ErrorResponse> {
  try {
    const result = await client.photos.search({
      query,
      per_page: perPage,
      page,
    });
    return result;
  } catch (error: any) {
    return { error: error.message || "Pexels API Error" };
  }
}
