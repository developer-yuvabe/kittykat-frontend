import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DeleteIcon, SearchIcon } from "@/components/ui/custom-icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getThreadDisplayName } from "@/lib/langgraph.utils";
import { useThreads } from "@/providers/langgraph/Thread";
import { TransformedThread } from "@/types/langgraph.types";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BrandSelectorProps {
  setThreadId: (id: string | null) => void;
}
export default function BrandSelector({ setThreadId }: BrandSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transformedThreads, setTransformedThreads] = useState<
    TransformedThread[]
  >([]);
  const [filteredThreads, setFilteredThreads] = useState<TransformedThread[]>(
    []
  );
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
    deleteThread,
  } = useThreads();

  // Fetch and transform threads on initial open
  useEffect(() => {
    if (open && threads.length === 0 && !threadsLoading) {
      const fetchThreads = async () => {
        try {
          setThreadsLoading(true);
          const fetchedThreads = await getThreads();
          setThreads(fetchedThreads);

          // Transform threads once on fetch
          const transformed = fetchedThreads.map((thread) => {
            const displayName = getThreadDisplayName(thread);
            return {
              id: thread.thread_id,
              displayName,
              initial: displayName.charAt(0).toUpperCase(),
              searchKey: `${displayName}::${thread.thread_id}`, // Create unique key for each item
              raw: thread,
            };
          });

          setTransformedThreads(transformed);
          setFilteredThreads(transformed);
        } catch (error) {
          console.error("Failed to fetch threads:", error);
        } finally {
          setThreadsLoading(false);
        }
      };
      fetchThreads();
    } else if (open && threads.length > 0 && transformedThreads.length === 0) {
      const transformed = threads.map((thread) => {
        const displayName = getThreadDisplayName(thread);
        return {
          id: thread.thread_id,
          displayName,
          initial: displayName.charAt(0).toUpperCase(),
          searchKey: `${displayName}::${thread.thread_id}`, // Create unique key for each item
          raw: thread,
        };
      });

      setTransformedThreads(transformed);
      setFilteredThreads(transformed);
    }
  }, [
    open,
    threads,
    transformedThreads.length,
    threadsLoading,
    getThreads,
    setThreads,
    setThreadsLoading,
  ]);

  // Update filtered threads when search query changes
  useEffect(() => {
    if (transformedThreads.length === 0) return;

    if (searchQuery.trim() === "") {
      setFilteredThreads(transformedThreads);
    } else {
      const filtered = transformedThreads.filter((thread) =>
        thread.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredThreads(filtered);
    }
  }, [searchQuery, transformedThreads]);

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    setThreadId(threadId);
    setOpen(false);
  };

  // Custom filtering implementation
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
  };

  // Delete thread functionality
  const handleDeleteConfirm = async () => {
    if (!threadToDelete) return;

    setIsDeleting(true);
    try {
      toast.promise(
        async () => {
          deleteThread(threadToDelete);
        },
        {
          loading: "Deleting Brand...",
          success: "Brand deleted successfully!",
          error: "Failed to delete the Brand.",
          position: "top-right",
        }
      );

      // Update the local state
      const updatedTransformed = transformedThreads.filter(
        (thread) => thread.id !== threadToDelete
      );
      setTransformedThreads(updatedTransformed);
      setFilteredThreads(updatedTransformed);

      // If the deleted thread was selected, clear the selection
      if (selectedThreadId === threadToDelete) {
        setSelectedThreadId(null);
        setThreadId(null);
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setThreadToDelete(null);
    }
  };
  // Delete all threads functionality
  const handleDeleteAllConfirm = async () => {
    setIsDeleting(true);
    try {
      const promises = filteredThreads.map(async (thread) => {
        deleteThread(thread.id);
      });
      toast.promise(Promise.allSettled(promises), {
        loading: "Deleting all brands...",
        success: "All brands deleted successfully!",
        error: "An error occurred while deleting all threads.",
        position: "top-right",
      });

      // Clear the local state
      setTransformedThreads([]);
      setFilteredThreads([]);
      setSelectedThreadId(null);
      setThreadId(null);
    } catch (error) {
      console.error("Error deleting all threads:", error);
    } finally {
      setIsDeleting(false);
      setDeleteAllDialogOpen(false);
    }
  };

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
            Load existing Brand
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder="Search brands..."
                className="h-9 border-0 outline-none focus-visible:ring-0"
                value={searchQuery}
                onValueChange={handleInputChange}
              />
            </div>
            <CommandList>
              <CommandEmpty>
                {threadsLoading ? "Loading..." : "No brands found."}
              </CommandEmpty>
              <CommandGroup>
                {filteredThreads.map((thread) => (
                  <CommandItem
                    key={thread.id}
                    value={thread.searchKey} // Use unique searchKey
                    onSelect={() => {
                      handleThreadSelect(thread.id);
                    }}
                    className="flex items-center justify-between group"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {thread.initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{thread.displayName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {selectedThreadId === thread.id && (
                        <Check className="h-4 w-4" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThreadToDelete(thread.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon size={14} />
                      </Button>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {filteredThreads.length > 0 && (
                <div className="p-2 border-t sticky bottom-0 bg-white">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setDeleteAllDialogOpen(true)}
                  >
                    <DeleteIcon size={14} className="mr-2" color="#FFF" />
                    Delete all brands
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Delete Single Brand Dialog */}
      <ReusableAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Brand"
        description="Are you sure you want to delete this brand? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        danger={true}
      />

      {/* Delete All Brands Dialog */}
      <ReusableAlertDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        title="Delete all Bbrands"
        description={`Are you sure you want to delete all brands? This will remove ${
          filteredThreads.length
        } brand${
          filteredThreads.length !== 1 ? "s" : ""
        } and cannot be undone.`}
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        onConfirm={handleDeleteAllConfirm}
        isLoading={isDeleting}
        danger={true}
      />
    </div>
  );
}
