import { useState } from "react"

/**
 * Text search + optional category filter over any list.
 * Lists here are tiny, so it filters on every render (no memo needed).
 */
export function useFilteredList<T, C extends string = never>(
  items: readonly T[],
  searchKeys: readonly (keyof T)[],
  categoryKey?: keyof T
) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<C | "all">("all")

  const q = query.trim().toLowerCase()
  const filtered = items.filter(
    (item) =>
      (category === "all" ||
        !categoryKey ||
        String(item[categoryKey]) === category) &&
      (!q || searchKeys.some((k) => String(item[k]).toLowerCase().includes(q)))
  )

  return { query, setQuery, category, setCategory, filtered }
}
