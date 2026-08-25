import type { ReactNode } from "react";

export function AdminSearchGroup<T extends { id: number }>({ title, empty, items, renderItem }: { title: string; empty: string; items: T[]; renderItem: (item: T) => ReactNode }) {
  return <section className="rounded-2xl bg-slate-50 p-3"><h3 className="px-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">{title}</h3><div className="mt-2 space-y-2">{items.length ? items.map((item) => <div key={item.id}>{renderItem(item)}</div>) : <p className="px-1 py-3 text-sm text-slate-500">{empty}</p>}</div></section>;
}
