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
import { useModelsStore } from "@/store/models.store";
import { Model } from "@/types/a2i-media.types";
import { Info } from "lucide-react";
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
            queueMicrotask(() => {
              onModelChange(model);
            });
          }
        }}
      >
        <SelectTrigger
          className={cn("w-full", {
            "min-w-32": !selectedModel?.id,
          })}
        >
          {selectedModel ? (
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = getProviderIcon(selectedModel.provider);
                return <Icon />;
              })()}
              <span>{selectedModel.name}</span>
            </div>
          ) : (
            <SelectValue placeholder="Select a model" />
          )}
        </SelectTrigger>
        <SelectContent>
          {models.length > 0 ? (
            <SelectGroup onPointerDown={(e) => e.stopPropagation()}>
              <SelectLabel>Available Models</SelectLabel>
              {filteredModels.map((model) => {
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
