import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  MoreHorizontal,
  PlusCircle,
  Plus,
} from "lucide-react";
import { BrandSection } from "./BrandSection";
import BrandSelector from "./BrandSelector";

import { BrandResponse } from "@/types/brand.types";
import { brandService } from "@/services/api/brand.service";

interface LeftPanelProps {
  expandedSection: string | null;
  toggleSection: (section: string) => void;
}

const MOCK_BRAND: BrandResponse = {
  id: "mock-id",
  brand: {
    name: "No Brand Available",
    tagline: "Tagline goes here",
    mission: "Mission statement goes here",
    vision: "Vision statement goes here",
    values: ["Value 1", "Value 2", "Value 3"],
  },
  created_by: "system",
};

export function LeftPanel({ expandedSection, toggleSection }: LeftPanelProps) {
  const [brandData, setBrandData] = useState<BrandResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchBrand();
  }, []);

  const fetchBrand = async () => {
    try {
      setIsLoading(true);
      const response = await brandService.getAllBrands(0, 1);
      if (response.brands && response.brands.length > 0) {
        setBrandData(response.brands[0]);
      } else {
        setBrandData(MOCK_BRAND);
      }
      setError(null);
    } catch (err) {
      setError("Failed to fetch brand data");
      console.error("Error fetching brand:", err);
      setBrandData(MOCK_BRAND);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandSelected = (brand: BrandResponse) => {
    setBrandData(brand);
  };

  const handleBrandCreated = (brand: BrandResponse) => {
    setBrandData(brand);
    if (expandedSection !== "brand") {
      toggleSection("brand");
    }
  };

  const openCreateBrandDialog = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsCreateDialogOpen(true);
  };

  const brandInitial = brandData
    ? brandData.brand.name.charAt(0).toUpperCase()
    : "M";

  return (
    <div className="w-full md:w-[65%] rounded-2xl mx-4 mb-4 bg-[#f3f4f6] p-8 overflow-y-auto max-h-[calc(100vh-120px)]">
      <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection("brand")}
        >
          <div className="flex items-center">
            {expandedSection === "brand" ? (
              <ChevronDown className="text-[#6e7787] mr-2" size={20} />
            ) : (
              <ChevronRight className="text-[#6e7787] mr-2" size={20} />
            )}
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3 overflow-hidden">
              <span className="text-white font-bold">{brandInitial}</span>
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-medium">
                Brand: {brandData?.brand.name || "No Brand Created"}
              </div>
              <div className="text-xs text-[#6e7787]">
                Set-Up, switch and modify your Brand
              </div>
            </div>
          </div>

          {expandedSection !== "brand" ? (
            <div className="flex items-center space-x-4">
              <button className="text-[#6e7787]">
                <Pencil size={16} />
              </button>
              <button className="text-[#6e7787]">
                <MoreHorizontal size={20} />
              </button>
            </div>
          ) : (
            <div className="flex gap-x-2 justify-end ml-2">
              <BrandSelector onBrandSelected={handleBrandSelected} />
              <button onClick={openCreateBrandDialog}>
                <PlusCircle size={20} className="cursor-pointer" />
              </button>
            </div>
          )}
        </div>

        {expandedSection === "brand" && brandData && (
          <BrandSection brandData={brandData} setBrandData={setBrandData} />
        )}
      </div>
    </div>
  );
}
