import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { brandService } from "@/services/api/brand.service";
import { BrandResponse } from "@/types/brand.types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";

interface BrandSelectorProps {
  onBrandSelected: (brand: BrandResponse) => void;
}

export default function BrandSelector({ onBrandSelected }: BrandSelectorProps) {
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      const fetchInitialBrands = async () => {
        try {
          setLoading(true);
          const response = await brandService.getAllBrands(0, 10);
          setBrands(response.brands);
        } catch (error) {
          console.error("Failed to fetch brands:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchInitialBrands();
    }
  }, [open]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length > 0) {
      try {
        setLoading(true);
        const results = await brandService.searchBrands(query);
        setBrands(results);
      } catch (error) {
        console.error("Failed to search brands:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getBrandInitial = (brandName: string) =>
    brandName.charAt(0).toUpperCase();

  return (
    <div className="flex w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-60 justify-start font-light text-[#BCC1CA] border-[#BCC1CA]"
            onClick={(e) => e.stopPropagation()}
          >
            <Search size={10} className="text-black" />
            Load existing Brand
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder="Search brands..."
                className="h-9 border-0 outline-none focus-visible:ring-0"
                value={searchQuery}
                onValueChange={handleSearch}
              />
            </div>
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading..." : "No brands found."}
              </CommandEmpty>
              <CommandGroup>
                {brands.map((brand) => (
                  <CommandItem
                    key={brand.id}
                    value={brand.id}
                    onSelect={() => {
                      onBrandSelected(brand);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {getBrandInitial(brand.brand.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{brand.brand.name}</span>
                    </div>
                    <Check className="ml-auto h-4 w-4 opacity-0" />
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
