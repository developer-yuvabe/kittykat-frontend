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
import { useBrandStore } from "@/store/brand.store";
import { Check } from "lucide-react";
import { useState } from "react";

export default function BrandSelector() {
  const [open, setOpen] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const { brands, selectedBrandId, setSelectedBrandId, isBrandsFetched } =
    useBrandStore();

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
          <Command shouldFilter={false}>
            <div className="flex items-center border-b w-full">
              <CommandInput
                placeholder="Search brands..."
                className="h-9 border-0 outline-none focus-visible:ring-0"
                value={brandSearchQuery}
                disabled={!isBrandsFetched}
                onValueChange={(value) => setBrandSearchQuery(value)}
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
                    value={brand.name}
                    onSelect={() => {
                      setSelectedBrandId(brand.id);
                      setOpen(false);
                    }}
                    className="flex items-center  justify-between group"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex w-[230px] items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {brand.name?.charAt(0).toUpperCase() || "B"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{brand.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
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
