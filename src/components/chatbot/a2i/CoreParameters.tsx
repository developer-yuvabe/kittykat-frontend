// components/CoreParameters.tsx

import { ContentSection } from "@/components/shared/ContentSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

type CoreParametersProps = {
  aspectRatio: string;
  setAspectRatio: (val: string) => void;
  previewMode: string;
  setPreviewMode: (val: string) => void;
  variations: number[];
  setVariations: (val: number[]) => void;
  outputFormat: string;
  setOutputFormat: (val: string) => void;
};

export const CoreParameters = ({
  aspectRatio,
  setAspectRatio,
  previewMode,
  setPreviewMode,
  variations,
  setVariations,
  outputFormat,
  setOutputFormat,
}: CoreParametersProps) => {
  return (
    <ContentSection
      title="Core Parameters"
      content={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue placeholder="Select aspect ratio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">1:1 Square</SelectItem>
                <SelectItem value="16:9">16:9 Landscape</SelectItem>
                <SelectItem value="9:16">9:16 Portrait</SelectItem>
                <SelectItem value="4:3">4:3 Standard</SelectItem>
                <SelectItem value="3:2">3:2 Photo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Preview Mode
            </label>
            <Select value={previewMode} onValueChange={setPreviewMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select preview mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="high-quality">High Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Variations: {variations[0]}
            </label>
            <Slider
              value={variations}
              onValueChange={setVariations}
              min={1}
              max={4}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Output Format
            </label>
            <div className="flex gap-2">
              {["jpg", "png", "webp"].map((format) => (
                <Badge
                  key={format}
                  variant={outputFormat === format ? "default" : "outline"}
                  className="cursor-pointer hover:bg-gray-200"
                  onClick={() => setOutputFormat(format)}
                >
                  {format.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
};
