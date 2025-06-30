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
import { Check, Pencil, Save, Trash2, X } from "lucide-react";
import { SearchIcon } from "@/components/ui/custom-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoodboardInformation } from "@/types/types";
import {
  deleteMoodboard,
  patchMoodboard,
} from "@/services/api/moodboard.service";
import { useBrandStore } from "@/store/brand.store";
import { Input } from "@/components/ui/input";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
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
  setSelectedMoodboard: (mb: MoodboardInformation | null) => void;
  campaignId: string;
  onNewMoodboard: () => void;
  isCreatingNew: boolean;
  variant?: "combobox" | "select";
}

export default function MoodboardSelector({
  moodboards,
  selectedMoodboard,
  setSelectedMoodboard,
  campaignId,
  variant = "combobox",
}: MoodboardSelectorProps) {
  const { selectedBrandId } = useBrandStore();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transformedMoodboards, setTransformedMoodboards] = useState<
    TransformedMoodboard[]
  >([]);
  const [filteredMoodboards, setFilteredMoodboards] = useState<
    TransformedMoodboard[]
  >([]);
  const [loading] = useState(false);
  const [selectMoodboards, setSelectMoodboards] = useState<
    MoodboardInformation[]
  >([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(selectedMoodboard?.title || "");

  // Transform moodboards (filtered by campaignId) - for combobox variant
  useEffect(() => {
    if (!campaignId || variant !== "combobox") return;

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
  }, [moodboards, campaignId, variant]);

  // Filter moodboards for select variant
  useEffect(() => {
    if (!campaignId || variant !== "select") return;

    const filtered = moodboards.filter((mb) => mb.campaign_id === campaignId);
    setSelectMoodboards(filtered);
  }, [moodboards, campaignId, variant]);

  // Filter by search query - for combobox variant
  useEffect(() => {
    if (variant !== "combobox") return;

    if (searchQuery.trim() === "") {
      setFilteredMoodboards(transformedMoodboards);
    } else {
      setFilteredMoodboards(
        transformedMoodboards.filter((mb) =>
          mb.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, transformedMoodboards, variant]);

  // Handle selection for combobox variant
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

  // Handle selection for select variant
  const handleSelectValueChange = (value: string) => {
    const selectedMb = selectMoodboards.find((mb) => mb.id === value);
    if (selectedMb) {
      setSelectedMoodboard(selectedMb);
      toast.success(`Moodboard '${selectedMb.title}' selected`, {
        position: "top-right",
      });
    }
  };

  // Handle deletion of a moodboard
  const handleDelete = async (moodboardId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the CommandItem's onSelect
    if (!selectedBrandId) {
      toast.error("No brand selected. Please select a brand and try again.", {
        position: "top-right",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteMoodboard(selectedBrandId, moodboardId);
      toast.success("Moodboard deleted successfully", {
        position: "top-right",
      });

      // Update moodboards by filtering out the deleted one
      const updatedMoodboards = moodboards.filter(
        (mb) => mb.id !== moodboardId
      );
      setTransformedMoodboards((prev) =>
        prev.filter((mb) => mb.id !== moodboardId)
      );
      setFilteredMoodboards((prev) =>
        prev.filter((mb) => mb.id !== moodboardId)
      );

      // If the deleted moodboard was selected, clear the selection
      if (selectedMoodboard?.id === moodboardId) {
        setSelectedMoodboard(null);
      }
    } catch (error) {
      toast.error("Failed to delete moodboard. Please try again.", {
        position: "top-right",
      });
      console.error("Delete error:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBrandId || !selectedMoodboard) {
      toast.error("No brand or moodboard selected. Please try again.", {
        position: "top-right",
      });
      return;
    }

    try {
      const updatedMoodboard = await patchMoodboard(
        selectedBrandId,
        selectedMoodboard.id,
        {
          title: editTitle,
        }
      );
      setSelectedMoodboard(updatedMoodboard);
      setIsEditing(false);
      toast.success("Moodboard title updated successfully", {
        position: "top-right",
      });
    } catch (error) {
      toast.error("Failed to update moodboard title. Please try again.", {
        position: "top-right",
      });
      console.error("Update error:", error);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(selectedMoodboard?.title || "");
  };

  const selectedMoodboardId = selectedMoodboard?.id;

  // Render select variant
  if (variant === "select") {
    return (
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-60 py-[23px] border-[#7F55E0] border-2"
              placeholder="Enter moodboard title"
            />
            <TooltipIconButton
              tooltip="save title"
              onClick={handleSave}
              size="icon"
              variant="ghost"
            >
              <Save className="h-4 w-4" />
            </TooltipIconButton>
            <TooltipIconButton
              tooltip="close edit"
              onClick={handleCancel}
              size="icon"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </TooltipIconButton>
          </>
        ) : (
          <>
            <Select
              value={selectedMoodboard?.id || ""}
              onValueChange={handleSelectValueChange}
            >
              <SelectTrigger className="w-60 py-[23px] border-[#7F55E0] border-2">
                <SelectValue placeholder="Select Moodboard" />
              </SelectTrigger>
              <SelectContent>
                {selectMoodboards.map((mb) => (
                  <SelectItem key={mb.id} value={mb.id}>
                    {mb.title || "Unnamed Moodboard"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMoodboard && (
              <TooltipIconButton
                onClick={() => setIsEditing(true)}
                size="icon"
                variant="ghost"
                tooltip="Edit Title"
              >
                <Pencil className="h-4 w-4" />
              </TooltipIconButton>
            )}
          </>
        )}
      </div>
    );
  }

  // Render combobox variant (default)
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
                  <div className="flex items-center">
                    {selectedMoodboardId === mb.id && (
                      <Check className="h-4 w-4" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(mb.id, e)}
                      disabled={loading}
                      className="hover:bg-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
