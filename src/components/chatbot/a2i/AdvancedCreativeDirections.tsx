// components/AdvancedCreativeDirections.tsx

import { ContentSection } from "@/components/shared/ContentSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Preset options
const MODEL_POSE_OPTIONS = [
  { label: "Standing", value: "standing" },
  { label: "Sitting", value: "sitting" },
  { label: "Turning", value: "turning" },
  { label: "Running", value: "running" },
];

const BACKGROUND_STYLE_OPTIONS = [
  { label: "Studio", value: "studio" },
  { label: "Outdoor", value: "outdoor" },
  { label: "Urban", value: "urban" },
  { label: "Magical", value: "magical" },
  { label: "Vintage", value: "vintage" },
];

const CAMERA_ANGLE_OPTIONS = [
  { label: "Eye Level", value: "eye-level" },
  { label: "Low Angle", value: "low-angle" },
  { label: "Overhead", value: "overhead" },
  { label: "Tilt", value: "tilt" },
  { label: "Close Up", value: "close-up" },
  { label: "Full Body", value: "full-body" },
];

const LIGHTING_OPTIONS = [
  { label: "Natural Light", value: "natural" },
  { label: "Studio Lighting", value: "studio" },
  { label: "Dramatic", value: "dramatic" },
  { label: "Soft Lighting", value: "soft" },
];

type AdvancedCreativeDirectionsProps = {
  stylingStrength: number[];
  setStylingStrength: (value: number[]) => void;
  modelPose: string;
  setModelPose: (value: string) => void;
  backgroundStyles: string[];
  setBackgroundStyles: (value: string[]) => void;
  cameraAngle: string;
  setCameraAngle: (value: string) => void;
  lightingStyle: string;
  setLightingStyle: (value: string) => void;
  setReferenceImage?: (file: File | null) => void;
};

export const AdvancedCreativeDirections = ({
  stylingStrength,
  setStylingStrength,
  modelPose,
  setModelPose,
  backgroundStyles,
  setBackgroundStyles,
  cameraAngle,
  setCameraAngle,
  lightingStyle,
  setLightingStyle,
  setReferenceImage,
}: AdvancedCreativeDirectionsProps) => {
  return (
    <ContentSection
      title="Advanced Creative Directions"
      collapsible
      defaultOpen={false}
      content={
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model Pose */}
            <div>
              <Label className="mb-2 block">Model Posing Guide</Label>
              <Select value={modelPose} onValueChange={setModelPose}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pose" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_POSE_OPTIONS.map((pose) => (
                    <SelectItem key={pose.value} value={pose.value}>
                      {pose.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {setReferenceImage && (
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setReferenceImage?.(e.target.files?.[0] || null)
                    }
                  />
                </div>
              )}
            </div>

            {/* Background style - checkbox group */}
            <div>
              <Label className="mb-2 block">
                Environment / Background Style
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUND_STYLE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      checked={backgroundStyles.includes(option.value)}
                      onCheckedChange={(checked) => {
                        setBackgroundStyles(
                          checked
                            ? [...backgroundStyles, option.value]
                            : backgroundStyles.filter((v) => v !== option.value)
                        );
                      }}
                      id={option.value}
                    />
                    <label htmlFor={option.value} className="text-sm">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Camera angle */}
            <div>
              <Label className="mb-2 block">Camera Angle</Label>
              <Select value={cameraAngle} onValueChange={setCameraAngle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an angle" />
                </SelectTrigger>
                <SelectContent>
                  {CAMERA_ANGLE_OPTIONS.map((angle) => (
                    <SelectItem key={angle.value} value={angle.value}>
                      {angle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lighting style */}
            <div>
              <Label className="mb-2 block">Lighting Style</Label>
              <Select value={lightingStyle} onValueChange={setLightingStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lighting" />
                </SelectTrigger>
                <SelectContent>
                  {LIGHTING_OPTIONS.map((light) => (
                    <SelectItem key={light.value} value={light.value}>
                      {light.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Styling strength slider */}
          <div>
            <Label className="block mb-2">
              Styling Strength ({stylingStrength[0]}%) –{" "}
              {stylingStrength[0] > 70
                ? "Looser interpretation"
                : stylingStrength[0] < 30
                ? "Follow moodboard exactly"
                : "Balanced"}
            </Label>
            <Slider
              value={stylingStrength}
              onValueChange={setStylingStrength}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      }
    />
  );
};
