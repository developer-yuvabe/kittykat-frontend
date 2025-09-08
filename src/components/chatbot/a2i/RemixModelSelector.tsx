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
import React from "react";

export default function RemixModelSelector() {
  const { selectedRemixModel, setSelectedRemixModel, models, isModelsFetched } =
    useModelsStore();

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
          selectedRemixModel?.id
            ? "top-0 text-xs font-medium translate-y-[-50%] bg-white px-1"
            : "top-1/2 -translate-y-1/2 text-sm"
        )}
      >
        Model
      </label>

      <Select
        value={selectedRemixModel?.id}
        onValueChange={(value) => {
          const model = models.find((m) => m.id === value);
          if (model) {
            setSelectedRemixModel(model);
          }
        }}
      >
        <SelectTrigger
          className={cn("w-full", {
            "min-w-32": !selectedRemixModel?.id,
          })}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.length > 0 ? (
            <SelectGroup>
              <SelectLabel>Available Models</SelectLabel>
              {models
                .filter((m) => m.type === "remix")
                .map((model) => {
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
