// components/parameters/ParameterInput.tsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Parameter, NumberParameter, EnumParameter } from "@/types/a2i.types";
import { FileUploadInput } from "./FileUploadInput";
import {
  getParameterDisplayTitle,
  roundToNearestMultiple,
} from "@/lib/a2i.utils";

interface ParameterInputProps {
  paramKey: string;
  parameter: Parameter;
  value: any;
  onChange: (key: string, value: any) => void;
  isRequired?: boolean;
}

export const ParameterInput: React.FC<ParameterInputProps> = ({
  paramKey,
  parameter,
  value,
  onChange,
  isRequired = false,
}) => {
  const displayTitle = getParameterDisplayTitle(paramKey, parameter);

  const renderInput = () => {
    switch (parameter.type) {
      case "file":
        return (
          <FileUploadInput
            value={value}
            onChange={(newValue) => onChange(paramKey, newValue)}
            accept="image/*"
            label={displayTitle}
            description={parameter.description}
          />
        );

      case "string":
        if (parameter.format === "uri") {
          return (
            <Input
              type="url"
              placeholder={`Enter ${displayTitle.toLowerCase()}...`}
              value={value || ""}
              onChange={(e) => onChange(paramKey, e.target.value || undefined)}
              className="transition-all duration-200 focus:ring-2"
            />
          );
        }
        if (paramKey === "prompt") {
          return (
            <Textarea
              placeholder="Describe your vision in detail... The more specific you are, the better the result!"
              value={value || ""}
              onChange={(e) => onChange(paramKey, e.target.value)}
              className="min-h-[120px] transition-all duration-200 focus:ring-2 resize-none"
            />
          );
        }
        return (
          <Input
            placeholder={`Enter ${displayTitle.toLowerCase()}...`}
            value={value || ""}
            onChange={(e) => onChange(paramKey, e.target.value)}
            className="transition-all duration-200 focus:ring-2"
          />
        );

      case "integer":
      case "number":
        const numParam = parameter as NumberParameter;
        if (numParam.minimum !== undefined && numParam.maximum !== undefined) {
          const currentValue = value ?? numParam.default ?? numParam.minimum;
          const shouldRound = paramKey === "width" || paramKey === "height";

          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-primary">
                  {currentValue}
                </span>
                {shouldRound && (
                  <Badge variant="outline" className="text-xs">
                    Rounded to multiples of 32
                  </Badge>
                )}
              </div>
              <Slider
                value={[currentValue]}
                onValueChange={([newValue]) => {
                  const finalValue = shouldRound
                    ? roundToNearestMultiple(newValue)
                    : newValue;
                  onChange(paramKey, finalValue);
                }}
                min={numParam.minimum}
                max={numParam.maximum}
                step={parameter.type === "integer" ? 1 : 0.01}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Min: {numParam.minimum}</span>
                <span>Max: {numParam.maximum}</span>
              </div>
            </div>
          );
        }
        return (
          <Input
            type="number"
            placeholder={`Enter ${displayTitle.toLowerCase()}...`}
            value={value ?? ""}
            onChange={(e) => {
              const newValue = e.target.value
                ? parameter.type === "integer"
                  ? parseInt(e.target.value)
                  : parseFloat(e.target.value)
                : undefined;
              onChange(paramKey, newValue);
            }}
            min={numParam.minimum}
            max={numParam.maximum}
            className="transition-all duration-200 focus:ring-2"
          />
        );

      case "boolean":
        return (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {value ? "Enabled" : "Disabled"}
              </p>
              {parameter.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {parameter.description}
                </p>
              )}
            </div>
            <Switch
              checked={value ?? parameter.default ?? false}
              onCheckedChange={(checked) => onChange(paramKey, checked)}
            />
          </div>
        );

      case "enum":
        const enumParam = parameter as EnumParameter;
        return (
          <Select
            value={value ?? parameter.default ?? enumParam.enum[0]}
            onValueChange={(newValue) => onChange(paramKey, newValue)}
          >
            <SelectTrigger className="transition-all duration-200 focus:ring-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {enumParam.enum.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  if (parameter.type === "boolean") {
    return (
      <div className="space-y-3">
        <Label htmlFor={paramKey} className="text-sm font-medium">
          {displayTitle}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {renderInput()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={paramKey} className="text-sm font-medium">
        {displayTitle}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderInput()}
      {parameter.description && paramKey !== "prompt" && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {parameter.description}
        </p>
      )}
    </div>
  );
};
