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
        "inline-flex max-w-full items-center gap-2 rounded-full border px-1 py-1 pr-3 shadow-sm",
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
          "h-8 w-8 border-white/80 bg-white shadow-[0_4px_10px_rgba(15,23,42,0.14)]",
          avatarClassName,
        )}
      />
      <span
        className={cn(
          "truncate text-[0.8125rem] font-semibold leading-none",
          labelClassName,
        )}
      >
        {name.trim()}
      </span>
    </span>
  );
}
