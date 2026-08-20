import { useEffect, useState } from "react";
import { subscribeCompareChange } from "@/pages/Compare";

const COMPARE_KEY = "pw-compare-ids";

function getIds(): number[] {
  try {
    return JSON.parse(localStorage.getItem(COMPARE_KEY) ?? "[]") as number[];
  } catch {
    return [];
  }
}

/** Reactive list of property ids currently in the compare list. */
export function useCompareIds(): number[] {
  const [ids, setIds] = useState<number[]>(() => getIds());
  useEffect(() => {
    return () => {
      subscribeCompareChange(() => setIds(getIds()));
    };
  }, []);
  return ids;
}
