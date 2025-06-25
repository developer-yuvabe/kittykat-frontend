import React from "react";
import Image from "next/image";
import Link from "next/link";
import BlissStar from "@/assets/bliss-star.svg";
import LogoImg from "@/assets/kittykat-logo.svg";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function LogoSection() {
  const isXLarge = useMediaQuery("(min-width: 1280px)");
  const isLarge = useMediaQuery("(min-width: 1024px)");
  const isMedium = useMediaQuery("(min-width: 768px)");
  const isSmall = useMediaQuery("(min-width: 640px)");

  let blissStarSize;
  let logoImgSize;

  if (isXLarge) {
    blissStarSize = { width: 50, height: 25 };
    logoImgSize = { width: 150, height: 75 };
  } else if (isLarge) {
    blissStarSize = { width: 45, height: 22 };
    logoImgSize = { width: 130, height: 65 };
  } else if (isMedium) {
    blissStarSize = { width: 40, height: 20 };
    logoImgSize = { width: 110, height: 55 };
  } else if (isSmall) {
    blissStarSize = { width: 35, height: 18 };
    logoImgSize = { width: 100, height: 50 };
  } else {
    // Mobile / extra small
    blissStarSize = { width: 30, height: 15 };
    logoImgSize = { width: 90, height: 45 };
  }

  return (
    <div className="flex items-center shrink-0">
      <Link href="/" className="flex items-center gap-x-2 mr-8">
        <Image src={BlissStar} {...blissStarSize} alt="Bliss" />
        <Image src={LogoImg} {...logoImgSize} alt="KittyKat Logo" />
      </Link>
    </div>
  );
}
