import Image from "next/image";
import Link from "next/link";
import BlissStar from "@/assets/bliss-star.svg";
import LogoImg from "@/assets/kittykat-logo.svg";

export function LogoSection() {
  return (
    <div className="flex items-center">
      <Link href="/" className="flex items-center gap-x-2 mr-8">
        <Image src={BlissStar} width={50} height={25} alt="Bliss" />
        <Image src={LogoImg} width={150} height={75} alt="KittyKat Logo" />
      </Link>
    </div>
  );
}
