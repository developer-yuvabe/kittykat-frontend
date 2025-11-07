import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AvatarFallback, Avatar } from "@/components/ui/avatar";
import { SearchIcon } from "@/components/ui/custom-icon";
import { useQueryState } from "nuqs";
import { useBrandStore } from "@/store/brand.store";
import { deleteCampaign } from "@/services/api/brand.service"; // Add import
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TransformedCampaign {
  id: string;
  displayName: string;
  initial: string;
  searchKey: string;
  raw: any;
}

interface CampaignSelectorProps {
  campaigns: any[];
  onCampaignSelect?: (campaignId: string) => void;
}

export default function CampaignSelector({
  campaigns,
  onCampaignSelect,
}: CampaignSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transformedCampaigns, setTransformedCampaigns] = useState<
    TransformedCampaign[]
  >([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<
    TransformedCampaign[]
  >([]);
  const [loading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [, setCampaignIdFromUrl] = useQueryState("campaignId");
  const [, setMoodboardIdFromUrl] = useQueryState("moodboardId");
  const {
    setSelectedCampaignId,
    selectedCampaignId,
    selectedBrandId,
    removeCampaign,
  } = useBrandStore();
  const [campaignToDelete, setCampaignToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const { mutateAsync: deleteCampaignMutate, isPending: isDeleting } =
    useMutation({
      mutationFn: async (variables: {
        brandId: string;
        campaignId: string;
      }) => {
        return deleteCampaign(variables.brandId, variables.campaignId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      },
    });

  // Add delete modal state

  // Transform campaigns on initial load
  useEffect(() => {
    if (campaigns.length > 0) {
      const transformed = campaigns.map((campaign) => {
        const displayName = campaign?.campaign?.title || "Unnamed Campaign";
        return {
          id: campaign.id,
          displayName,
          initial: displayName.charAt(0).toUpperCase(),
          searchKey: `${displayName}::${campaign.id}`,
          raw: campaign,
        };
      });

      setTransformedCampaigns(transformed);
      setFilteredCampaigns(transformed);
    }
  }, [campaigns]);

  // Update filtered campaigns when search query changes
  useEffect(() => {
    if (transformedCampaigns.length === 0) return;

    if (searchQuery.trim() === "") {
      setFilteredCampaigns(transformedCampaigns);
    } else {
      const filtered = transformedCampaigns.filter((campaign) =>
        campaign.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCampaigns(filtered);
    }
  }, [searchQuery, transformedCampaigns]);

  const handleCampaignSelect = (campaignId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    setCampaignIdFromUrl(null);
    setMoodboardIdFromUrl(null);

    if (onCampaignSelect) {
      onCampaignSelect(campaignId);
    }

    setSelectedCampaignId(campaignId);
    setOpen(false);
    toast.success(`Campaign '${campaign.campaign.title}' selected`, {
      position: "top-right",
    });
  };

  // Custom filtering implementation
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
  };
  const handleDeleteCampaign = async () => {
    if (!campaignToDelete || !selectedBrandId) return;

    try {
      await deleteCampaignMutate({
        brandId: selectedBrandId,
        campaignId: campaignToDelete.id,
      });

      toast.success(`Campaign "${campaignToDelete.name}" deleted`);

      removeCampaign(selectedBrandId, campaignToDelete.id);

      setSelectedCampaignId(null);
      setCampaignIdFromUrl(null);
      setMoodboardIdFromUrl(null);
    } catch {
      toast.error("Failed to delete campaign");
    } finally {
      setShowDeleteDialog(false);
      setCampaignToDelete(null);
    }
  };

  return (
    <div className="" onClick={(e) => e.stopPropagation()}>
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-60 justify-start font-light text-gray-800 border-[#BCC1CA]"
              onClick={(e) => e.stopPropagation()}
            >
              <SearchIcon size={10} className="text-black" />
              Select Campaign
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command shouldFilter={false} className="flex-wrap w-full">
              <div className="flex items-center border-b px-3">
                <CommandInput
                  placeholder="Search campaigns..."
                  className="h-9 border-0 outline-none focus-visible:ring-0"
                  value={searchQuery}
                  onValueChange={handleInputChange}
                />
              </div>
              <CommandList className="w-full">
                <CommandEmpty>
                  {loading ? "Loading..." : "No campaigns found."}
                </CommandEmpty>
                <CommandGroup>
                  {filteredCampaigns.map((campaign) => (
                    <CommandItem
                      key={campaign.id}
                      value={campaign.searchKey}
                      onSelect={() => {
                        handleCampaignSelect(campaign.id);
                      }}
                      className="flex items-center justify-between group cursor-pointer px-2 py-2"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="flex items-center min-w-0  w-full">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="bg-blue-500 text-white">
                            {campaign.initial}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">
                          {campaign.displayName} {campaign.displayName}
                        </span>
                      </div>
                      {selectedCampaignId === campaign.id && (
                        <Check className="h-4 w-4" />
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCampaignToDelete({
                            id: campaign.id,
                            name: campaign.displayName,
                          });
                          setShowDeleteDialog(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20 rounded p-1"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <ReusableAlertDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Campaign?"
          description={
            <>
              You’re about to permanently delete{" "}
              <b>“{campaignToDelete?.name}”</b> and all its moodboards. This
              action cannot be undone.
              <br />
              Are you sure you want to continue?
            </>
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteCampaign}
          isLoading={isDeleting}
          danger
        />
      </>
    </div>
  );
}
