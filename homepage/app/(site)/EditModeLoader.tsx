"use client";

import { useEffect, useState, type ComponentType } from "react";

/** 편집 모드(?__edit=1)일 때만 편집 브릿지를 내려받는다.
 *  일반 방문자는 이 작은 파일만 실행되고 편집용 코드는 받지 않는다. */
export default function EditModeLoader() {
  const [Bridge, setBridge] = useState<ComponentType | null>(null);

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("__edit") !== "1") return;
      if (window.parent === window) return; // 편집기 안에서만 동작
    } catch {
      return;
    }
    let alive = true;
    import("./EditBridge").then((m) => {
      if (alive) setBridge(() => m.default);
    });
    return () => {
      alive = false;
    };
  }, []);

  return Bridge ? <Bridge /> : null;
}
