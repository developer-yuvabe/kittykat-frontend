import type { GalleryCollection } from "@/types/gallery.types";

export function generateSampleData(): GalleryCollection[] {
  const sampleImageUrls = [
    "https://storage.googleapis.com/kk-a2i-images/6729db039e9769f79cba44cb/673317ae564d00e4e618f8ba/v1",
    "https://storage.googleapis.com/kittykat-agents/brand/WAoAYJ9NprRT0XBM80uvo9EqsAm2/3610744432380068764_0.jpg",
    "https://storage.googleapis.com/kittykat-agents/brand/WAoAYJ9NprRT0XBM80uvo9EqsAm2/3626563041803751903_1.jpg",
  ];

  const assetTypes = ["image", "video", "model"];
  const assetSources = [
    "moodboard",
    "a2iimages",
    "pexels",
    "unsplash",
    "uploaded",
  ];
  const creators = ["current_user", "john_doe", "jane_smith"];
  const formats = ["jpg", "png", "mp4", "glb"];
  const titles = [
    "Summer Collection",
    "Product Showcase",
    "Brand Campaign",
    "Fashion Editorial",
    "Lifestyle Shoot",
    "Urban Exploration",
    "Nature Inspired",
    "Studio Portrait",
    "Outdoor Adventure",
    "Minimalist Design",
  ];

  // Generate random aspect ratios to simulate different image dimensions
  const aspectRatios = [
    { width: 1, height: 1 }, // Square
    { width: 3, height: 4 }, // Portrait
    { width: 4, height: 3 }, // Landscape
    { width: 16, height: 9 }, // Widescreen
    { width: 9, height: 16 }, // Tall portrait
    { width: 2, height: 3 }, // Portrait
    { width: 3, height: 2 }, // Landscape
  ];

  const items: GalleryCollection[] = [];

  // Generate 20 sample items
  for (let i = 0; i < 20; i++) {
    const assetType =
      assetTypes[Math.floor(Math.random() * (assetTypes.length - 0.1))]; // Bias toward images
    const format =
      assetType === "image"
        ? formats[Math.floor(Math.random() * 2)]
        : assetType === "video"
        ? "mp4"
        : "glb";
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomImageUrl =
      sampleImageUrls[Math.floor(Math.random() * sampleImageUrls.length)];
    const randomAspectRatio =
      aspectRatios[Math.floor(Math.random() * aspectRatios.length)];

    items.push({
      id: `item-${i}`,
      thread_id: `thread-${Math.floor(i / 4)}`,
      brand_data: {},
      campaign_data: {},
      asset_type: assetType as any,
      asset_source:
        assetSources[Math.floor(Math.random() * assetSources.length)],
      created_by: creators[Math.floor(Math.random() * creators.length)],
      asset_title: `${randomTitle} ${i + 1}`,
      asset_url: randomImageUrl,
      prompt: `A ${randomTitle.toLowerCase()} for the latest campaign`,
      size: `${randomAspectRatio.width * 1000}x${
        randomAspectRatio.height * 1000
      }`,
      format,
      metadata: {
        aspectRatio: `${randomAspectRatio.width}:${randomAspectRatio.height}`,
      },
      user_action:
        Math.random() > 0.7 ? "like" : Math.random() > 0.5 ? "dislike" : null,
      is_favourite: Math.random() > 0.7,
      created_at: new Date(
        Date.now() - Math.random() * 10000000000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return items;
}
