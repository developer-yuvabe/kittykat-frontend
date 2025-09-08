import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getProviderIcon } from "@/lib/utils";
import { useModelsStore } from "@/store/models.store";
import { Model } from "@/types/a2i-media.types";
import React from "react";

type ModelSelectorProps = {
  onModelChange: (model: Model) => void;
  selectedModel: Model | null;
  typeFilter?: Model["type"];
};

export default function ModelSelector({
  onModelChange,
  selectedModel,
  typeFilter,
}: ModelSelectorProps) {
  const { models, isModelsFetched } = useModelsStore();

  const filteredModels = typeFilter
    ? models.filter((m) => m.type === typeFilter)
    : models;

  if (!isModelsFetched) {
    return (
      <div className="p-1 rounded-md w-44 h-10 border-2">
        <Skeleton className="w-full h-full flex items-center justify-center">
          <p className="text-xs italic text-muted-foreground">
            Loading models...
          </p>
        </Skeleton>
      </div>
    );
  }

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
          const model = filteredModels.find((m) => m.id === value);
          if (model) {
            onModelChange(model);
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
          {models.length > 0 ? (
            <SelectGroup>
              <SelectLabel>Available Models</SelectLabel>
              {filteredModels.map((model) => {
                const ProviderIcon = getProviderIcon(model.provider);
                return (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    disabled={model.disabled}
                    className="disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ProviderIcon />
                    {model.name}
                  </SelectItem>
                );
              })}
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
