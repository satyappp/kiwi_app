import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/assets/brand/refruits-logo.png"
      alt="ReFruits"
      width={332}
      height={172}
      priority={priority}
      className={cn("h-auto w-32 object-contain", className)}
    />
  );
}
