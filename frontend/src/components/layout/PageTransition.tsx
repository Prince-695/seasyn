import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export type TransitionPreset = "slide" | "fade" | "scale"

export interface PageTransitionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  preset?: TransitionPreset
}

const presetClassMap: Record<TransitionPreset, string> = {
  slide: "animate-page-enter",
  fade: "animate-page-fade",
  scale: "animate-page-scale",
}

export function PageTransition({
  children,
  className,
  preset = "slide",
  ...props
}: PageTransitionProps) {
  return (
    <div
      className={cn(
        "w-full",
        presetClassMap[preset] || presetClassMap.slide,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default PageTransition
