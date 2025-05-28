import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Image } from "lucide-react";
import { ReferenceImage } from "./ReferenceImage";
import { CoreParameters } from "./CoreParameters";
import { AdvancedParameters } from "./AdvancedParameters";
import { A2IImages } from "./A2iImages";

export default function A2iImagesSection() {
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [previewMode, setPreviewMode] = useState("standard");
  const [variations, setVariations] = useState([4]);
  const [outputFormat, setOutputFormat] = useState("jpg");
  const [cfgScale, setCfgScale] = useState([7]);
  const [denoisingStrength, setDenoisingStrength] = useState([0.8]);
  const [steps, setSteps] = useState([20]);
  const [faceRestoration, setFaceRestoration] = useState(false);
  const [generationModel, setGenerationModel] = useState("stable-diffusion-xl");
  const [samplerType, setSamplerType] = useState("dpm++");
  const [expanded, setExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock generated images
  const generatedImages = [
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop",
      liked: false,
    },
    {
      id: "2",
      url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop",
      liked: true,
    },
    {
      id: "3",
      url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop",
      liked: false,
    },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation time
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  const referenceImage =
    "https://storage.googleapis.com/kittykat-agents/brands/WAoAYJ9NprRT0XBM80uvo9EqsAm2/Selection%20(1).png-683586f68e36f668f5d15279";

  return (
    <>
      <Card className="bg-white rounded-2xl relative shadow-sm mb-4">
        <CardHeader className="py-1 pb-0 mb-0">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center">
              {expanded ? (
                <ChevronDown className="text-[#6e7787] mr-2" size={20} />
              ) : (
                <ChevronRight className="text-[#6e7787] mr-2" size={20} />
              )}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center mr-3 overflow-hidden">
                  <Image className="text-white" size={24} />
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-medium">A2i Images</div>
                  {!expanded && (
                    <div className="text-xs text-[#6e7787]">
                      Generate fashion images with AI models
                    </div>
                  )}
                </div>
              </div>
            </div>
            {expanded && (
              <div className="flex gap-2">
                {/* <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {isGenerating ? "Generating..." : "Generate Images"}
              </Button> */}
              </div>
            )}
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="px-6  space-y-6">
            {/* 1. Reference Image */}
            <ReferenceImage referenceImage={referenceImage} />

            {/* 8. Core Parameters */}
            <CoreParameters
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              previewMode={previewMode}
              setPreviewMode={setPreviewMode}
              variations={variations}
              setVariations={setVariations}
              outputFormat={outputFormat}
              setOutputFormat={setOutputFormat}
            />

            <AdvancedParameters
              generationModel={generationModel}
              setGenerationModel={setGenerationModel}
              samplerType={samplerType}
              setSamplerType={setSamplerType}
              cfgScale={cfgScale}
              setCfgScale={setCfgScale}
              denoisingStrength={denoisingStrength}
              setDenoisingStrength={setDenoisingStrength}
              steps={steps}
              setSteps={setSteps}
              faceRestoration={faceRestoration}
              setFaceRestoration={setFaceRestoration}
            />

            <A2IImages
              isGenerating={isGenerating}
              generatedImages={generatedImages}
              handleGenerate={handleGenerate}
            />
          </CardContent>
        )}
      </Card>
    </>
  );
}
