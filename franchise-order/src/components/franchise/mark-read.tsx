"use client";

import { useEffect } from "react";
import { markNotificationReadAction } from "@/app/app/actions";

export function MarkReadOnView({ ids }: { ids: string[] }) {
  useEffect(() => {
    for (const id of ids) markNotificationReadAction(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
