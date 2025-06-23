import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import { SearchIcon } from "@/components/ui/custom-icon";
import { MoodboardInformation } from "@/types/types";

interface TransformedMoodboard {
  id: string;
  displayName: string;
  initial: string;
  searchKey: string;
  raw: MoodboardInformation;
}

interface MoodboardSelectorProps {
  moodboards: MoodboardInformation[];
  selectedMoodboard: MoodboardInformation | null;
  setSelectedMoodboard: (mb: MoodboardInformation) => void;
  campaignId: string;
  onNewMoodboard: () => void;
  isCreatingNew: boolean;
}

export default function MoodboardSelector({
  moodboards,
  selectedMoodboard,
  setSelectedMoodboard,
  campaignId,
}: MoodboardSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transformedMoodboards, setTransformedMoodboards] = useState<
    TransformedMoodboard[]
  >([]);
  const [filteredMoodboards, setFilteredMoodboards] = useState<
    TransformedMoodboard[]
  >([]);
  const [loading] = useState(false);

  // Transform moodboards (filtered by campaignId)
  useEffect(() => {
    if (!campaignId) return;

    const filtered = moodboards.filter((mb) => mb.campaign_id === campaignId);
    const transformed = filtered.map((mb) => {
      const displayName = mb.title || "Unnamed Moodboard";
      return {
        id: mb.id,
        displayName,
        initial: displayName.charAt(0).toUpperCase(),
        searchKey: `${displayName}::${mb.id}`,
        raw: mb,
      };
    });

    setTransformedMoodboards(transformed);
    setFilteredMoodboards(transformed);
  }, [moodboards, campaignId]);

  // Filter by search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMoodboards(transformedMoodboards);
    } else {
      setFilteredMoodboards(
        transformedMoodboards.filter((mb) =>
          mb.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, transformedMoodboards]);

  // Auto-select moodboard when campaignId changes

  const handleSelect = (id: string) => {
    const match = moodboards.find((mb) => mb.id === id);
    if (match) {
      setSelectedMoodboard(match);
      setOpen(false);
      toast.success(`Moodboard '${match.title}' selected`, {
        position: "top-right",
      });
    }
  };

  const selectedMoodboardId = selectedMoodboard?.id;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-60 justify-start font-light text-gray-800 border-[#BCC1CA] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <SearchIcon size={10} className="text-black mr-1" />
          {selectedMoodboard?.title || "Select Moodboard"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder="Search moodboards..."
              className="h-9 border-0 outline-none focus-visible:ring-0"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : "No moodboards found."}
            </CommandEmpty>
            <CommandGroup>
              {filteredMoodboards.map((mb) => (
                <CommandItem
                  key={mb.id}
                  value={mb.searchKey}
                  onSelect={() => handleSelect(mb.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center min-w-0 w-full">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className="bg-blue-500 text-white">
                        {mb.initial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{mb.displayName}</span>
                  </div>
                  {selectedMoodboardId === mb.id && (
                    <Check className="h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
