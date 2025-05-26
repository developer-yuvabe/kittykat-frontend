import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
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

interface TransformedCampaign {
  id: string;
  displayName: string;
  initial: string;
  searchKey: string;
  raw: any;
}

interface CampaignSelectorProps {
  campaigns: any[];
  setSelectedCampaignIndex: (index: number) => void;
  selectedCampaignIndex: number;
}

export default function CampaignSelector({
  campaigns,
  setSelectedCampaignIndex,
  selectedCampaignIndex,
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
    const index = campaigns.findIndex((campaign) => campaign.id === campaignId);
    if (index !== -1) {
      setSelectedCampaignIndex(index);
      setOpen(false);
      toast.success(`Campaign '${campaigns[index].campaign.title}' selected`, {
        position: "top-right",
      });
    }
  };

  // Custom filtering implementation
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
  };

  const selectedCampaignId = campaigns[selectedCampaignIndex]?.id;

  return (
    <div className="">
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
                    className="flex items-center justify-between"
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
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
