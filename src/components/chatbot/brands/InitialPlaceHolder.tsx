import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty } from "@/components/ui/command";
import { SearchIcon, Copy, CirclePlus } from "lucide-react";
import { TooltipIconButton } from "../../thread/tooltip-icon-button";
import { PinIcon } from "@/components/ui/custom-icon";
import BrandSelector from "./BrandSelector";

interface InitialPlaceHolderProps {
  setThreadId: (id: string | null) => void;
}

const InitialPlaceHolder: React.FC<InitialPlaceHolderProps> = ({
  setThreadId,
}) => {
  // const [openBrand, setOpenBrand] = useState(false);
  const [openCampaign, setOpenCampaign] = useState(false);
  const brandFields = [
    "Brand Overview",
    "Brand Purpose",
    "Brand Colors",
    "Brand Typography",
    "Photography",
    "Lighting",
    "Styling",
    "Casting",
    "Setting",
    "Products",
    "Target Audience",
    "Media",
  ];

  const campaignFields = [
    "Campaign Overview",
    "Campaign Colors",
    "Target Audience",
    "Visual Style",
    "Moodboard",
  ];

  return (
    <div>
      <div className="bg-white rounded-2xl relative shadow-sm mb-4">
        <Card className="p-5">
          <Accordion type="single" collapsible defaultValue="brand-selector">
            <AccordionItem value="brand-selector">
              <AccordionTrigger className="flex-row-reverse items-center hover:no-underline [&>svg]:h-6 [&>svg]:w-6">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-1">
                    <Avatar className="w-10 h-10 rounded-full flex items-center justify-center mr-2 overflow-hidden">
                      <AvatarImage src={""} alt="@shadcn" />
                      <AvatarFallback className="bg-blue-500">
                        <span className="text-white font-bold">B</span>
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-lg font-semibold">
                      Your Brand Name
                    </span>
                  </div>
                  <div className="flex justify-between gap-x-2">
                    <div>
                      <div>
                        <BrandSelector setThreadId={setThreadId} />
                      </div>
                    </div>
                    <TooltipIconButton
                      size="lg"
                      className="p-4"
                      tooltip="New Brand"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <CirclePlus className="size-5" />
                    </TooltipIconButton>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {brandFields.map((label) => (
                  <Card key={label} className="my-4 border border-gray-300">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <h4 className="font-medium text-sm">{label}</h4>
                      <div className="flex justify-center">
                        <TooltipIconButton tooltip="Copy" side="top">
                          <Copy size={16} />
                        </TooltipIconButton>
                        <TooltipIconButton tooltip="Pin" side="top">
                          <PinIcon size={16} />
                        </TooltipIconButton>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4">
                      <div className="bg-gray-100 h-10 rounded-md px-3 py-2 text-sm text-gray-600 flex items-center" />
                      {label === "Media" && (
                        <div className="flex gap-2 pt-3 flex-wrap">
                          {["Website", "Facebook", "Instagram", "Tiktok"].map(
                            (platform) => (
                              <span
                                key={platform}
                                className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  platform === "Website"
                                    ? "bg-gray-200 text-gray-700"
                                    : platform === "Facebook"
                                    ? "bg-blue-100 text-blue-700"
                                    : platform === "Instagram"
                                    ? "bg-pink-100 text-pink-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {platform}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
      <div className="bg-white rounded-2xl relative shadow-sm mb-4">
        <Card className="p-5">
          <Accordion type="single" collapsible defaultValue="campaign-selector">
            <AccordionItem value="campaign-selector">
              <AccordionTrigger className="flex-row-reverse items-center hover:no-underline [&>svg]:h-6 [&>svg]:w-6">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-1">
                    <Avatar className="w-10 h-10 rounded-full flex items-center justify-center mr-2 overflow-hidden">
                      <AvatarImage src={""} alt="@campaign" />
                      <AvatarFallback className="bg-green-500">
                        <span className="text-white font-bold">C</span>
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-lg font-semibold">Campaign</span>
                  </div>
                  <div className="flex justify-between gap-x-2">
                    <div>
                      <Popover
                        open={openCampaign}
                        onOpenChange={setOpenCampaign}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCampaign}
                            className="w-60 justify-start font-light text-gray-800 border-[#BCC1CA]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SearchIcon size={10} className="text-black" />
                            Load existing Campaign
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] relative p-0">
                          <Command>
                            <CommandEmpty>No Existing Campaign</CommandEmpty>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <TooltipIconButton
                      size="lg"
                      className="p-4"
                      tooltip="New Campaign"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <CirclePlus className="size-5" />
                    </TooltipIconButton>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {campaignFields.map((label) => (
                  <Card key={label} className="my-4 border border-gray-300">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <h4 className="font-medium text-sm">{label}</h4>
                      <div className="flex justify-center">
                        <TooltipIconButton tooltip="Copy" side="top">
                          <Copy size={16} />
                        </TooltipIconButton>
                        <TooltipIconButton tooltip="Pin" side="top">
                          <PinIcon size={16} />
                        </TooltipIconButton>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4">
                      <div className="bg-gray-100 h-10 rounded-md px-3 py-2 text-sm text-gray-600 flex items-center" />
                    </CardContent>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </div>
  );
};

export default InitialPlaceHolder;
