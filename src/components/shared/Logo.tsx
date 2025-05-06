import React from "react";
import Image from "next/image";
import LogoImg from "@/assets/kittykat-logo.svg";

const Logo = ({
  className,
  width = 180,
  height = 180,
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
