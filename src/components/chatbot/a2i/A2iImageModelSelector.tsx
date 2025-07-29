import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useModelsStore } from "@/store/models.store";
import React from "react";

export default function A2iImageModelSelector() {
  const { selectedModel, setSelectedModel, models, isModelsFetched } =
    useModelsStore();

  return (
    <div className="relative w-max">
      <label
        className={cn(
          "absolute left-3 transition-all duration-200 text-muted-foreground pointer-events-none",
          selectedModel?.id
            ? "top-0 text-xs font-medium translate-y-[-50%] bg-white px-1"
            : "top-1/2 -translate-y-1/2 text-sm"
        )}
      >
        Model
      </label>

      <Select
        value={selectedModel?.id}
        onValueChange={(value) => {
          const model = models.find((m) => m.id === value);
          if (model) {
            setSelectedModel(model);
          }
        }}
      >
        <SelectTrigger
          className={cn("w-full", {
            "min-w-32": !selectedModel?.id,
          })}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {!isModelsFetched ? (
            <div className="p-4 text-center text-sm text-muted-foreground italic">
              <p>Loading models...</p>
            </div>
          ) : models.length > 0 ? (
            <SelectGroup>
              <SelectLabel>Available Models</SelectLabel>
              {models.map((model) => (
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
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground italic">
              <p>No models available.</p>
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
