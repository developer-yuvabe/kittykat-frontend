import React from "react";
import Image from "next/image";
import LogoImg from "@/assets/kittykat-logo.png";

const Logo = ({
  className,
  width = 240,
  height = 80,
}: {
  className?: string;
  width?: number;
  height?: number;
}) => {
  return (
    <Image
      src={LogoImg}
      alt="KittyKat Logo"
      width={width}
      height={height}
      className={className}
    />
  );
};

export default Logo;
