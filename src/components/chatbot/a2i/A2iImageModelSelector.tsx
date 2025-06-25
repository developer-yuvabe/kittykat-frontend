import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMAGE_GENERATION_MODELS } from "@/lib/a2i.utils";
import { cn } from "@/lib/utils";
import { useA2iStore } from "@/store/a2i.store";
import React from "react";

export default function A2iImageModelSelector() {
  const { selectedModel, setSelectedModel } = useA2iStore();

  return (
    <div className="relative w-max">
      <label
        className={cn(
          "absolute left-3 transition-all duration-200 text-muted-foreground pointer-events-none",
          selectedModel.id
            ? "top-0 text-xs font-medium translate-y-[-50%] bg-white px-1"
            : "top-1/2 -translate-y-1/2 text-sm"
        )}
      >
        Model
      </label>

      <Select
        value={selectedModel.id}
        onValueChange={(value) => {
          const model = IMAGE_GENERATION_MODELS.find((m) => m.id === value);
          if (model) {
            setSelectedModel(model);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Available Models</SelectLabel>
            {IMAGE_GENERATION_MODELS.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                disabled={model.disabled}
                className="disabled:cursor-not-allowed"
              >
                {model.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
