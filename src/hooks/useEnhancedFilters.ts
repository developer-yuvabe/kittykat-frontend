import {
  useQueryState,
  parseAsArrayOf,
  parseAsString,
  parseAsBoolean,
} from "nuqs";

export interface EnhancedSelectedFilters {
  brands: string[];
  campaigns: string[];
  moodboards: string[];
  product_categories: string[];
  has_product?: boolean | null;
  has_people?: boolean | null;
  has_lifestyle_context?: boolean | null;
  asset_types: string[];
  asset_sources: string[];
  media_format: string[];
  aspect_ratio: string[];
  workflow_status: string[];
  is_favourite?: boolean | null;
  is_archived?: boolean | null;
}

export const useEnhancedFilters = ({
  campaignId,
  initialTab,
}: {
  campaignId?: string;
  initialTab?: string;
}) => {
  // Main filters
  const [brands, setBrands] = useQueryState(
    "brands",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [campaigns, setCampaigns] = useQueryState(
    "campaigns",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [moodboards, setMoodboards] = useQueryState(
    "moodboards",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [product_categories, setProductCategories] = useQueryState(
    "productCategories",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [asset_types, setAssetTypes] = useQueryState(
    "assetTypes",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [asset_sources, setAssetSources] = useQueryState(
    "assetSources",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [media_format, setMediaFormats] = useQueryState(
    "mediaFormats",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [aspect_ratio, setAspectRatios] = useQueryState(
    "aspectRatios",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [workflow_status, setWorkflowStatus] = useQueryState(
    "workflowStatus",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  // Optional boolean filters
  const [has_product, setHasProduct] = useQueryState(
    "hasProduct",
    parseAsBoolean
  );
  const [has_people, setHasPeople] = useQueryState("hasPeople", parseAsBoolean);
  const [has_lifestyle_context, setHasLifestyleContext] = useQueryState(
    "hasLifestyleContext",
    parseAsBoolean
  );
  const [is_favourite, setIsFavourite] = useQueryState(
    "isFavourite",
    parseAsBoolean
  );
  const [is_archived, setIsArchived] = useQueryState(
    "isArchived",
    parseAsBoolean
  );

  // Extra states (outside EnhancedSelectedFilters)
  const [favorites, setFavorites] = useQueryState(
    "favorites",
    parseAsBoolean.withDefault(false)
  );
  const [source, setSource] = useQueryState(
    "source",
    parseAsString.withDefault(initialTab || "")
  );
  const [creator, setCreator] = useQueryState(
    "creator",
    parseAsString.withDefault("Anyone")
  );
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [showFilters, setShowFilters] = useQueryState(
    "showFilters",
    parseAsBoolean.withDefault(false)
  );
  const [selectedCampaignId, setSelectedCampaignId] = useQueryState(
    "campaignId",
    parseAsString.withDefault(campaignId || "")
  );
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault(initialTab || "")
  );

  return {
    // Main filters grouped together
    preselectedFilters: {
      brands,
      campaigns,
      moodboards,
      product_categories,
      asset_types,
      asset_sources,
      media_format,
      aspect_ratio,
      workflow_status,
      has_product,
      has_people,
      has_lifestyle_context,
      is_favourite,
      is_archived,
    } as EnhancedSelectedFilters,

    // Setters for filters
    setters: {
      setBrands,
      setCampaigns,
      setMoodboards,
      setProductCategories,
      setAssetTypes,
      setAssetSources,
      setMediaFormats,
      setAspectRatios,
      setWorkflowStatus,
      setHasProduct,
      setHasPeople,
      setHasLifestyleContext,
      setIsFavourite,
      setIsArchived,
    },

    // Extra state values (outside EnhancedSelectedFilters)
    favorites,
    setFavorites,
    source,
    setSource,
    creator,
    setCreator,
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    selectedCampaignId,
    setSelectedCampaignId,
    activeTab,
    setActiveTab,
  };
};
