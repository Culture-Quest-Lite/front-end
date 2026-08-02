import Image from "next/image";

import { getTagColorState, getTagInitials } from "@/lib/tags";
import { cn } from "@/lib/utils";

type TagAvatarProps = {
  name: string;
  imageUrl?: string | null;
  accentColor?: string;
  className?: string;
  labelClassName?: string;
};

export function TagAvatar({
  name,
  imageUrl,
  accentColor,
  className,
  labelClassName,
}: TagAvatarProps) {
  const fallbackState = accentColor ? getTagColorState(accentColor) : null;

  return (
    <div
      className={cn(
        "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 shadow-sm",
        className,
      )}
      style={
        !imageUrl && accentColor && fallbackState
          ? {
              color: accentColor,
              backgroundColor: fallbackState.chipBg,
              borderColor: fallbackState.chipBorder,
            }
          : undefined
      }
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Ảnh thẻ ${name}`}
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        <span className={cn("select-none uppercase", labelClassName)}>
          {getTagInitials(name)}
        </span>
      )}
    </div>
  );
}
