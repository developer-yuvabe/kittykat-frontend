import React from "react";
import Image from "next/image";
import Link from "next/link";
import LogoImg from "@/assets/kittykat-logo.png";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function LogoSection() {
  const isXLarge = useMediaQuery("(min-width: 1280px)");
  const isLarge = useMediaQuery("(min-width: 1024px)");
  const isMedium = useMediaQuery("(min-width: 768px)");
  const isSmall = useMediaQuery("(min-width: 640px)");

  let logoImgSize;

  if (isXLarge) {
    logoImgSize = { width: 150, height: 75 };
  } else if (isLarge) {
    logoImgSize = { width: 130, height: 65 };
  } else if (isMedium) {
    logoImgSize = { width: 110, height: 55 };
  } else if (isSmall) {
    logoImgSize = { width: 100, height: 50 };
  } else {
    // Mobile / extra small
    logoImgSize = { width: 90, height: 45 };
  }

  return (
    <div className="flex items-center shrink-0">
      <Link href="/" className="flex items-center gap-x-2 mr-8">
        <Image src={LogoImg} {...logoImgSize} alt="KittyKat Logo" />
      </Link>
    </div>
  );
}
