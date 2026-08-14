import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type PageLoadingProps = {
  className?: string;
  fullscreen?: boolean;
  spinnerClassName?: string;
};

export function PageLoading({
  className,
  fullscreen = false,
  spinnerClassName,
}: PageLoadingProps) {
  return (
    <div
      aria-label="Đang tải"
      className={cn(
        "flex w-full items-center justify-center bg-white",
        fullscreen
          ? "min-h-dvh rounded-none"
          : "min-h-[240px] rounded-[1.75rem] shadow-sm",
        className,
      )}
      role="status"
    >
      <Loader2
        aria-hidden="true"
        className={cn("h-8 w-8 animate-spin text-slate-400", spinnerClassName)}
      />
    </div>
  );
}
