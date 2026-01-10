import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SearchIcon } from "@/components/ui/custom-icon";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { updateCurrentContextBrandId } from "@/services/api/langgraph.service";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { Check, ChevronDown, ChevronUp, Megaphone, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { RoleProtectedComponent } from "@/components/shared/RoleProtectedComponent";
import { toast } from "sonner";
import { deleteBrand } from "@/services/api/brand.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type BrandSelectorProps = {
  /* Whether or not to show campaigns */
  showCampaigns?: boolean;

  /* Callback when a brand is selected. Do WHATEVER the heck you want when a brand or campaign selected outside of this component */
  onBrandSelect?: (brandId: string, camgaignId: string | null) => void;

  /* Whether or not to show as a modal (default false) */
  modal?: boolean;

  /* Whether or not to show what brand and campaign is selected instead of a placeholder (default false) */
  showSelectedValue?: boolean;

  className?: string;
};

export default function BrandSelector({
  onBrandSelect,
  showCampaigns,
  modal = false,
  showSelectedValue = false,
  className,
}: BrandSelectorProps) {
  const stream = useStreamContext();
  const { user } = useUserStore();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [brandDeleteStep, setBrandDeleteStep] = useState<1 | 2>(1);
  const [brandToDelete, setBrandToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const {
    isBrandsFetched,
    brands,
    selectedBrandId,
    setSelectedBrandId,
    selectedCampaignId,
    setSelectedCampaignId,
    getSelectedBrandName,
    getSelectedCampaignName,
    removeBrand,
  } = useBrandStore();

  const handleBrandSelect = (brandId: string, campaignId: string | null) => {
    setOpen(false);
    setSelectedBrandId(brandId);

    // Check whether campaignId belongs to the selected brand
    if (
      campaignId &&
      brands
        .find((b) => b.id === brandId)
        ?.campaigns.find((c) => c.id === campaignId)
    )
      setSelectedCampaignId(campaignId);
    else setSelectedCampaignId(null);

    if (campaignId) setSelectedCampaignId(campaignId);
    onBrandSelect?.(brandId, campaignId);

    if (user?.thread_id) {
      updateCurrentContextBrandId(
        user.thread_id,
        brandId,
        stream.values.currentBrandContextId
      );
    }
  };

  const filteredAndSortedBrands = useMemo(() => {
    // Sort first
    const sorted = [...brands].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      })
    );

    // If no search query, return sorted as is
    if (!searchQuery?.trim()) return sorted;

    const query = searchQuery.toLowerCase();

    // Filter brands while keeping campaigns grouped
    return sorted.reduce<typeof brands>((acc, brand) => {
      const brandMatch = brand.name?.toLowerCase().includes(query);
      const brandCreatedByMatch = brand.created_by?.name
        ?.toLowerCase()
        .includes(query);
      const campaignMatches = showCampaigns
        ? brand.campaigns.filter((c) => c.title.toLowerCase().includes(query))
        : [];

      if (brandMatch || campaignMatches.length > 0 || brandCreatedByMatch) {
        acc.push({
          ...brand,
          campaigns: brandMatch ? brand.campaigns : campaignMatches,
        });
      }

      return acc;
    }, []);
  }, [brands, searchQuery, showCampaigns]);
  const queryClient = useQueryClient();

  const { mutateAsync: deleteBrandMutate, isPending: isDeleting } = useMutation(
    {
      mutationFn: async (brandId: string) => {
        return deleteBrand(brandId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["brands"] });
      },
    }
  );

  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;

    // Step 1 → ask for confirmation
    if (brandDeleteStep === 1) {
      setBrandDeleteStep(2);
      return;
    }

    // Step 2 → delete
    try {
      await deleteBrandMutate(brandToDelete.id);

      toast.success(`Brand "${brandToDelete.name}" deleted`, {
        position: "top-right",
      });

      removeBrand(brandToDelete.id);

      if (selectedBrandId === brandToDelete.id) {
        setSelectedBrandId(null);
        setSelectedCampaignId(null);
      }

      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["moodboards"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete brand", {
        position: "top-right",
      });
    } finally {
      setShowDeleteDialog(false);
      setBrandToDelete(null);
      setBrandDeleteStep(1); // reset
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen} modal={modal}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-60 justify-start font-light text-foreground border-[#BCC1CA] relative hover:bg-background hover:text-foreground",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {!isBrandsFetched ? (
              <div
                className={cn(
                  "min-w-0 font-medium flex justify-between items-center w-full gap-x-1",
                  className
                )}
              >
                <span className="animate-pulse">Loading Brands...</span>
                <Spinner className="text-muted-foreground" />
              </div>
            ) : (
              <>
                {showSelectedValue && selectedBrandId ? (
                  <div
                    className={cn(
                      "min-w-0 font-medium flex justify-between items-center w-full gap-x-1",
                      className
                    )}
                  >
                    <div className="space-x-2 truncate">
                      <span className="font-medium">
                        {getSelectedBrandName() ?? "Select Brand"}
                      </span>

                      {showCampaigns &&
                        (selectedCampaignId ? (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {getSelectedCampaignName() ?? "Campaign"}
                            </span>
                          </>
                        ) : (
                          <Badge className="text-xs bg-primary/10 rounded-full text-primary">
                            No Campaign selected
                          </Badge>
                        ))}
                    </div>

                    {open ? (
                      <ChevronUp className="h-4 w-4 shrink-0 opacity-50" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    )}
                    <label className="absolute left-3 transition-all duration-200 text-muted-foreground pointer-events-none top-0 text-xs font-medium translate-y-[-50%] px-1 z-10 bg-inherit">
                      Brand
                    </label>
                  </div>
                ) : (
                  <>
                    <SearchIcon size={10} className="text-foreground" />
                    Select Brand
                  </>
                )}
              </>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className={cn("w-[300px] relative  p-0", className)}
          align="start"
        >
          <Command value={selectedBrandId || undefined}>
            <div className="flex items-center border-b w-full">
              <Input
                placeholder={
                  showCampaigns
                    ? "Search brands or campaigns..."
                    : "Search brands..."
                }
                className="h-9 border-0 outline-none focus-visible:ring-0"
                disabled={!isBrandsFetched}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <CommandList>
              <CommandEmpty>
                {!isBrandsFetched ? (
                  <div className="mx-auto w-max">
                    <Spinner className="text-foreground" />
                  </div>
                ) : showCampaigns ? (
                  "No brands or campaigns found."
                ) : (
                  "No brands found."
                )}
              </CommandEmpty>

              {filteredAndSortedBrands.map((brand, index) => (
                <>
                  <CommandItem
                    key={`${brand.id}-${index}`}
                    value={`${brand.name}-${index}`}
                    onSelect={() => handleBrandSelect(brand.id, null)}
                    className="flex items-center justify-between group gap-0 rounded-none"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-start min-w-0 w-full">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {brand.name?.charAt(0).toUpperCase() || "B"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col space-y-1">
                        <span className="break-words">
                          {brand.name}
                          {showCampaigns && (
                            <span className="italic text-xs">{` (${brand?.campaigns?.length} campaigns)`}</span>
                          )}
                        </span>
                        <span className="italic text-xs">
                          Created by{" "}
                          {brand.created_by.id === user?.id
                            ? "You"
                            : brand.created_by.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {selectedBrandId === brand.id && (
                        <Check className="h-4 w-4" />
                      )}

                      <RoleProtectedComponent>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBrandToDelete({
                              id: brand.id,
                              name: brand.name,
                            });
                            setBrandDeleteStep(1); // step-1
                            setShowDeleteDialog(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20 rounded p-1"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </RoleProtectedComponent>
                    </div>
                  </CommandItem>

                  {showCampaigns && brand.campaigns.length > 0 && (
                    <CommandGroup className="pl-8 border-b">
                      {brand.campaigns.map((campaign) => (
                        <CommandItem
                          key={`${campaign.id}-${campaign.title}`}
                          value={campaign.title}
                          className={cn(
                            "flex items-center justify-between group gap-0 my-0.5",
                            {
                              "bg-primary/10 text-primary":
                                selectedCampaignId === campaign.id,
                            }
                          )}
                          onSelect={() =>
                            handleBrandSelect(brand.id, campaign.id)
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <div className="flex items-start min-w-0 w-full">
                            <Megaphone
                              className={cn("mr-2 mt-0.5", {
                                "text-primary":
                                  selectedCampaignId === campaign.id,
                              })}
                              size={20}
                            />

                            <div className="flex flex-col space-y-1">
                              <span className="break-words">
                                {campaign.title}
                              </span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ReusableAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={
          brandDeleteStep === 1 ? "Delete Brand?" : "Confirm Brand Deletion"
        }
        description={
          brandDeleteStep === 1 ? (
            <>
              Deleting the brand <b>{brandToDelete?.name}</b> will also delete
              all campaigns & moodboards.
              <br />
              This cannot be undone. Proceed with caution.
            </>
          ) : (
            <>
              Are you absolutely sure? This will permanently delete{" "}
              <b>{brandToDelete?.name}</b> and all its campaigns & moodboards.
            </>
          )
        }
        confirmLabel={brandDeleteStep === 1 ? "Continue" : "Delete Permanently"}
        cancelLabel="Cancel"
        onConfirm={handleDeleteBrand}
        isLoading={isDeleting}
        danger
      />
    </>
  );
}
