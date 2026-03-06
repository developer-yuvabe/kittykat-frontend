import { useQuery } from "@tanstack/react-query";
import { getGalleryImageParameters } from "@/services/api/gallery.service";

export function getA2iParametersQueryKey(id?: string) {
  return ["a2i-parameters", id];
}

interface UseA2iParametersOptions {
  galleryItemId: string | undefined;
  generationId?: string; // fallback for failed generations (no image/video id yet)
  brandId: string;
  enabled?: boolean;
}

export function useA2iParameters({
  galleryItemId,
  generationId,
  brandId,
  enabled = false, // lazy by default — triggered via refetch()
}: UseA2iParametersOptions) {
  const id = galleryItemId ?? generationId;
  return useQuery({
    queryKey: getA2iParametersQueryKey(id),
    queryFn: () =>
      galleryItemId
        ? getGalleryImageParameters(brandId, galleryItemId)
        : getGalleryImageParameters(brandId, undefined, generationId),
    enabled: enabled && !!id,
    staleTime: Infinity,
    retry: false,
  });
}
