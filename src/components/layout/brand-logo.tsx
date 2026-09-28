import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  /** Rendered width in CSS px, used to pick the right responsive variant. */
  displayWidth: number;
  preload?: boolean;
}

export function BrandLogo({ className, displayWidth, preload }: BrandLogoProps) {
  return (
    <Image
      src="/brand/alimentos-sevilla-logo.png"
      alt="Alimentos Sevilla"
      width={700}
      height={315}
      sizes={`${displayWidth}px`}
      preload={preload}
      className={className}
    />
  );
}
