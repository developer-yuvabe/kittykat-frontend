import { ContentSection } from "@/components/shared/ContentSection";
import { Badge } from "@/components/ui/badge";
import { BrandResponse } from "@/types/brand.types";

interface BrandSectionProps {
  brandData: BrandResponse;
  setBrandData: React.Dispatch<React.SetStateAction<BrandResponse | null>>;
}

export function BrandSection({ brandData, setBrandData }: BrandSectionProps) {
  const colorEntries = brandData.colors ? Object.entries(brandData.colors) : [];
  const values = brandData.brand.values || [];

  return (
    <div className="mt-4 space-y-4">
      <ContentSection
        title="Brand Overview"
        content={
          <div className="space-y-2">
            <p className="text-sm text-[#323842]">
              {brandData.brand.mission || "No mission specified."}
            </p>
            <p className="text-sm text-[#323842]">
              {brandData.brand.vision || "No vision specified."}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {values.length > 0 ? (
                values.slice(0, 5).map((value, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-[#f5f2fd] text-[#7f55e0] border-[#f5f2fd]"
                  >
                    {value}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-[#7f55e0]">
                  No brand values specified.
                </p>
              )}
            </div>
          </div>
        }
      />

      <ContentSection
        title="Brand Colors"
        content={
          <div className="flex space-x-4 mt-2">
            {colorEntries.length > 0 ? (
              colorEntries
                .slice(0, 2)
                .map(([key, color]) => (
                  <div
                    key={key}
                    className="w-8 h-8 rounded-md"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  ></div>
                ))
            ) : (
              <p className="text-sm text-gray-400">No colors specified.</p>
            )}
            <div className="w-8 h-8 rounded-md bg-white border"></div>
            <div className="w-8 h-8 rounded-md bg-black"></div>
          </div>
        }
      />

      <ContentSection
        title="Video Guidelines"
        content={
          <div className="space-y-2">
            {brandData.video_guidelines ? (
              Object.entries(brandData.video_guidelines).map(
                ([key, guidelines]) => {
                  let content: React.ReactNode;

                  // Handle each guideline type according to its structure
                  switch (key) {
                    case "styling":
                    case "light":
                      content = (
                        <ul className="list-disc ml-4">
                          {guidelines.principles.map(
                            (principle: string, i: number) => (
                              <li key={i}>{principle}</li>
                            )
                          )}
                        </ul>
                      );
                      break;
                    case "posing":
                      content = <p>{guidelines.style}</p>;
                      break;
                    case "setting":
                      content = <p>{guidelines.role}</p>;
                      break;
                    case "motion":
                      content = (
                        <div>
                          <p>
                            <p>Approach:</p> {guidelines.approach}
                          </p>
                          <p>
                            <p>Camera Work:</p> {guidelines.camera_work}
                          </p>
                          <p>
                            <p>Lighting:</p> {guidelines.lighting}
                          </p>
                        </div>
                      );
                      break;
                    case "leg_down":
                      content = <p>{guidelines.intent}</p>;
                      break;
                    case "still_life":
                      content = <p>{guidelines.presentation}</p>;
                      break;
                    default:
                      content = <p>Unknown guidelines section</p>;
                  }

                  return (
                    <div key={key} className="space-y-1">
                      <p>{key.replace(/_/g, " ")}</p>
                      {content}
                    </div>
                  );
                }
              )
            ) : (
              <p className="text-sm text-gray-400">
                No video guidelines specified.
              </p>
            )}
          </div>
        }
      />
    </div>
  );
}
