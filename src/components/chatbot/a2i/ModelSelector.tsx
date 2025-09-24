import ReactMarkdownRender from "@/components/ui/react-markdown";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getProviderIcon } from "@/lib/utils";
import { useUserStore } from "@/store/user.store";
import { Model } from "@/types/a2i-media.types";
import { Info } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getUserModels } from "@/services/api/models.service";

type ModelSelectorProps = {
  onModelChange: (model: Model | null) => void;
  selectedModel: Model | null;
  typeFilter?: Model["type"];
};

export default function ModelSelector({
  onModelChange,
  selectedModel,
  typeFilter,
}: ModelSelectorProps) {
  const { user } = useUserStore();
  const [userAccessibleModels, setUserAccessibleModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      if (!user?.id) {
        setUserAccessibleModels([]);
        setIsLoading(false);
        // Clear selected model when no user
        if (selectedModel) {
          onModelChange(null);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Direct API call to get user models
        const models = await getUserModels(user.id, typeFilter);
        setUserAccessibleModels(models);

        // If no models available, clear the selected model
        if (models.length === 0) {
          if (selectedModel) {
            onModelChange(null);
          }
        }
        // If selected model is not in available models, clear it
        else if (
          selectedModel &&
          !models.find((m) => m.id === selectedModel.id)
        ) {
          onModelChange(null);
        }
        // If there are models but no selection, auto-select first one
        else if (models.length > 0 && !selectedModel) {
          onModelChange(models[0]);
        }
      } catch (err) {
        console.error("Error fetching user models:", err);
        setError("Failed to load models");
        setUserAccessibleModels([]);

        // Clear selected model on error
        if (selectedModel) {
          onModelChange(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [user?.id, typeFilter]); // Removed selectedModel from dependencies to avoid infinite loops

  // Additional effect to validate selected model against available models
  useEffect(() => {
    if (!isLoading && userAccessibleModels.length > 0 && selectedModel) {
      const isValidModel = userAccessibleModels.find(
        (m) => m.id === selectedModel.id
      );
      if (!isValidModel) {
        onModelChange(null);
      }
    }
  }, [userAccessibleModels, selectedModel, isLoading, onModelChange]);

  if (isLoading) {
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
          selectedModel?.id &&
            userAccessibleModels.find((m) => m.id === selectedModel.id)
            ? "top-0 text-xs font-medium translate-y-[-50%] bg-white px-1"
            : "top-1/2 -translate-y-1/2 text-sm"
        )}
      >
        Model
      </label>

      <Select
        value={selectedModel?.id || ""} // Use empty string when no selection
        onValueChange={(value) => {
          if (!value) {
            onModelChange(null);
            return;
          }
          const model = userAccessibleModels.find((m) => m.id === value);
          if (model) {
            queueMicrotask(() => {
              onModelChange(model);
            });
          }
        }}
        disabled={userAccessibleModels.length === 0} // Disable when no models
      >
        <SelectTrigger
          className={cn("w-full", {
            "min-w-32":
              !selectedModel?.id ||
              !userAccessibleModels.find((m) => m.id === selectedModel?.id),
          })}
        >
          {selectedModel &&
          userAccessibleModels.find((m) => m.id === selectedModel.id) ? (
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = getProviderIcon(selectedModel.provider);
                return <Icon />;
              })()}
              <span>{selectedModel.name}</span>
            </div>
          ) : (
            <SelectValue
              placeholder={
                userAccessibleModels.length === 0
                  ? "No models available"
                  : "Select a model"
              }
            />
          )}
        </SelectTrigger>
        <SelectContent>
          {userAccessibleModels.length > 0 ? (
            <SelectGroup onPointerDown={(e) => e.stopPropagation()}>
              {userAccessibleModels.map((model) => {
                const ProviderIcon = getProviderIcon(model.provider);
                return (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    disabled={model.disabled}
                    className="disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <ProviderIcon />
                    {model.name}
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger
                        asChild
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="">
                          <Info className="cursor-pointer" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        data-allow-event-propagation="true"
                        side="right"
                        className="max-w-64"
                      >
                        <ReactMarkdownRender
                          data-allow-event-propagation="true"
                          content={model.description || model.name}
                          components={{
                            a: ({ href, ...props }) => (
                              <a
                                data-allow-event-propagation="true"
                                className="text-blue-500 underline break-words"
                                target="_blank"
                                rel="noreferrer"
                                href={href}
                                onPointerDown={(e) => {
                                  window.open(href, "_blank");
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                {...props}
                              />
                            ),
                          }}
                        />
                      </TooltipContent>
                    </Tooltip>
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
