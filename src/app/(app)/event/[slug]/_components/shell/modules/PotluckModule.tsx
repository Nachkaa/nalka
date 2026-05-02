"use client";

import { PotluckScreen } from "@/features/potluck/components/PotluckScreen";
import type { PotluckModuleProps } from "@/features/potluck/types";

import { deactivateBring } from "../../../actions/modules";

export type { PotluckModuleProps } from "@/features/potluck/types";

export function PotluckModule(props: PotluckModuleProps) {
  return (
    <PotluckScreen
      {...props}
      deactivateModule={() => deactivateBring({ eventId: props.eventId, slug: props.slug })}
    />
  );
}
