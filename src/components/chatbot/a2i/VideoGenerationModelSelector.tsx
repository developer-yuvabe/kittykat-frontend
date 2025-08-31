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
import { cn } from "@/lib/utils";
import { useModelsStore } from "@/store/models.store";
import React, { useMemo } from "react";

export default function VideoGenerationModelSelector() {
  const {
    selectedVideoGenearationModel,
    setSelectedVideoGenearationModel,
    models,
    isModelsFetched,
  } = useModelsStore();

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

  const filteredVideoGenerationModels = useMemo(() => {
    return models.filter((m) => m.type === "video");
  }, [models]);

  console.log(selectedVideoGenearationModel);

  return (
    <div className="relative w-max">
      <label
        className={cn(
          "absolute left-3 transition-all duration-200 text-muted-foreground pointer-events-none",
          selectedVideoGenearationModel?.id
            ? "top-0 text-xs font-medium translate-y-[-50%] bg-white px-1"
            : "top-1/2 -translate-y-1/2 text-sm"
        )}
      >
        Model
      </label>

      <Select
        value={selectedVideoGenearationModel?.id}
        onValueChange={(value) => {
          const model = models.find((m) => m.id === value);
          if (model) {
            setSelectedVideoGenearationModel(model);
          }
        }}
      >
        <SelectTrigger
          className={cn("w-full", {
            "min-w-32": !selectedVideoGenearationModel?.id,
          })}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.length > 0 ? (
            <SelectGroup>
              <SelectLabel>Available Models</SelectLabel>
              {filteredVideoGenerationModels.map((model) => (
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
