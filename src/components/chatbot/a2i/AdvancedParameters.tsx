// components/AdvancedParameters.tsx

import { ContentSection } from "@/components/shared/ContentSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

type AdvancedParametersProps = {
  generationModel: string;
  setGenerationModel: (val: string) => void;
  samplerType: string;
  setSamplerType: (val: string) => void;
  cfgScale: number[];
  setCfgScale: (val: number[]) => void;
  denoisingStrength: number[];
  setDenoisingStrength: (val: number[]) => void;
  steps: number[];
  setSteps: (val: number[]) => void;
  faceRestoration: boolean;
  setFaceRestoration: (val: boolean) => void;
};

// ---- ✅ Constants for options ----
const GENERATION_MODELS = [
  { label: "Stable Diffusion XL", value: "stable-diffusion-xl" },
  { label: "Stable Diffusion 2.1", value: "stable-diffusion-2" },
  { label: "Midjourney", value: "midjourney" },
  { label: "DALL-E 3", value: "dalle-3" },
];

const SAMPLERS = [
  { label: "DPM++ 2M Karras", value: "dpm++" },
  { label: "Euler", value: "euler" },
  { label: "DDIM", value: "ddim" },
  { label: "Heun", value: "heun" },
];

export const AdvancedParameters = ({
  generationModel,
  setGenerationModel,
  samplerType,
  setSamplerType,
  cfgScale,
  setCfgScale,
  denoisingStrength,
  setDenoisingStrength,
  steps,
  setSteps,
  faceRestoration,
  setFaceRestoration,
}: AdvancedParametersProps) => {
  return (
    <ContentSection
      title="Advanced Parameters"
      collapsible
      defaultOpen={false}
      content={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Generation Model */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Generation Model
            </label>
            <Select value={generationModel} onValueChange={setGenerationModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {GENERATION_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sampler */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Sampler Type
            </label>
            <Select value={samplerType} onValueChange={setSamplerType}>
              <SelectTrigger>
                <SelectValue placeholder="Select sampler" />
              </SelectTrigger>
              <SelectContent>
                {SAMPLERS.map((sampler) => (
                  <SelectItem key={sampler.value} value={sampler.value}>
                    {sampler.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CFG Scale */}
          <div>
            <label className="block text-sm font-medium mb-2">
              CFG Scale: {cfgScale[0]}
            </label>
            <Slider
              value={cfgScale}
              onValueChange={setCfgScale}
              min={1}
              max={20}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Denoising Strength */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Denoising Strength: {denoisingStrength[0]}
            </label>
            <Slider
              value={denoisingStrength}
              onValueChange={setDenoisingStrength}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>

          {/* Step Count */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Steps: {steps[0]}
            </label>
            <Slider
              value={steps}
              onValueChange={setSteps}
              min={10}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Face Restoration */}
          <div className="flex items-center space-x-2 pt-1">
            <Switch
              checked={faceRestoration}
              onCheckedChange={setFaceRestoration}
            />
            <label className="text-sm font-medium">Face Restoration</label>
          </div>
        </div>
      }
    />
  );
};
