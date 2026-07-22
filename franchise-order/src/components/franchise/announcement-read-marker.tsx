"use client";

import { useEffect } from "react";
import { markAnnouncementReadAction } from "@/app/app/actions";

export function AnnouncementReadMarker({ id }: { id: string }) {
  useEffect(() => {
    markAnnouncementReadAction(id);
  }, [id]);
  return null;
}
