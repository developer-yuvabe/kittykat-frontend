export interface PhotosWithTotalResults {
  page: number; // Current page number
  per_page: number; // Number of items per page (requested)
  photos: Photo[]; // Array of photos
  total_results: number; // Total results available
  next_page?: string; // (Optional) URL for the next page
  prev_page?: string; // (Optional) URL for the previous page
}

export interface Photo {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string | null;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}
