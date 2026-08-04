import { getTagColorState } from "@/lib/tags";
import { cn } from "@/lib/utils";

import { TagAvatar } from "./TagAvatar";

type TagIdentityChipProps = {
  name: string;
  imageUrl?: string | null;
  accentColor: string;
  className?: string;
  avatarClassName?: string;
  labelClassName?: string;
};

export function TagIdentityChip({
  name,
  imageUrl,
  accentColor,
  className,
  avatarClassName,
  labelClassName,
}: TagIdentityChipProps) {
  const colorState = getTagColorState(accentColor);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-3 rounded-full border px-1.5 py-1.5 pr-4 shadow-sm",
        className,
      )}
      style={{
        color: accentColor,
        backgroundColor: colorState.chipBg,
        borderColor: colorState.chipBorder,
      }}
    >
      <TagAvatar
        name={name}
        imageUrl={imageUrl}
        accentColor={accentColor}
        className={cn(
          "h-11 w-11 border-white/80 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.16)]",
          avatarClassName,
        )}
      />
      <span
        className={cn(
          "truncate text-sm font-semibold leading-none sm:text-base",
          labelClassName,
        )}
      >
        {name.trim()}
      </span>
    </span>
  );
}
