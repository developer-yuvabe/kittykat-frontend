import { useQuery } from "@tanstack/react-query";
import { getGalleryImageParameters } from "@/services/api/gallery.service";

export function getA2iParametersQueryKey(galleryItemId?: string) {
  return ["a2i-parameters", galleryItemId];
}

interface UseA2iParametersOptions {
  galleryItemId: string | undefined;
  brandId: string;
  enabled?: boolean;
}

export function useA2iParameters({
  galleryItemId,
  brandId,
  enabled = false, // lazy by default — triggered via refetch()
}: UseA2iParametersOptions) {
  return useQuery({
    queryKey: getA2iParametersQueryKey(galleryItemId),
    queryFn: () => getGalleryImageParameters(brandId, galleryItemId!),
    enabled: enabled && !!galleryItemId,
    staleTime: Infinity,
    retry: false,
  });
}
