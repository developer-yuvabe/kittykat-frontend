import { FacebookIcon, InstagramIcon } from "@/components/ui/custom-icon";
import { Globe } from "lucide-react";
import React from "react";

export const socialLinks = [
  { platform: "website", color: "#F3F4F6", icon: <Globe size={16} /> },
  {
    platform: "facebook",
    color: "#E7F3FF",
    icon: (
      <div className="bg-blue-600 text-white w-4 h-4 flex items-center justify-center rounded-sm">
        <FacebookIcon size={12} />
      </div>
    ),
  },
  {
    platform: "instagram",
    color: "#F2F2FD",
    icon: (
      <div className="bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 text-white w-4 h-4 flex items-center justify-center rounded-sm">
        <InstagramIcon size={12} />
      </div>
    ),
  },
  {
    platform: "tiktok",
    color: "#EFFCFA",
    icon: (
      <div className="bg-black text-white w-4 h-4 flex items-center justify-center rounded-sm">
        <Globe size={12} />
      </div>
    ),
  },
];
