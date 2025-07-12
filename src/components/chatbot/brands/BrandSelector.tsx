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
import { SearchIcon } from "@/components/ui/custom-icon";
import { Loader } from "@/components/ui/loader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { Check } from "lucide-react";
import { useState } from "react";

export default function BrandSelector() {
  const { user } = useUserStore();
  const [open, setOpen] = useState(false);
  const stream = useStreamContext();

  const { brands, selectedBrandId, setSelectedBrandId, isBrandsFetched } =
    useBrandStore();

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrandId(brandId);
    setOpen(false);

    if (user?.thread_id) {
      stream.client.threads.updateState(user?.thread_id, {
        values: {
          currentBrandContextId: brandId,
        },
      });
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
        <PopoverContent className="w-[300px] relative  p-0" align="start">
          <Command>
            <div className="flex items-center border-b w-full">
              <CommandInput
                placeholder="Search brands..."
                className="h-9 border-0 outline-none focus-visible:ring-0"
                disabled={!isBrandsFetched}
              />
            </div>
            <CommandList>
              <CommandEmpty>
                {!isBrandsFetched ? (
                  <div className="mx-auto w-max">
                    <Loader className="fill-foreground" />
                  </div>
                ) : (
                  "No existing brands found."
                )}
              </CommandEmpty>
              <CommandGroup>
                {brands.map((brand) => (
                  <CommandItem
                    key={brand.id}
                    onSelect={() => handleBrandSelect(brand.id)}
                    className="flex items-center justify-between group gap-0"
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
                        <span className="line-clamp- break-words">
                          {brand.name}
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
                    </div>
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
