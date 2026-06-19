"use client";

import type { ComponentProps } from "react";
import { ResponsiveContainer as RechartsResponsiveContainer } from "recharts";

const DEFAULT_INITIAL_DIMENSION = { width: 0, height: 1 } as const;

export function ResponsiveContainer(
  props: ComponentProps<typeof RechartsResponsiveContainer>
) {
  return (
    <RechartsResponsiveContainer
      minWidth={0}
      initialDimension={DEFAULT_INITIAL_DIMENSION}
      {...props}
    />
  );
}
