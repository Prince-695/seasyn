import { cn } from "@/lib/utils"

export interface LogoProps {
  className?: string
  iconClassName?: string
  showText?: boolean
  textClassName?: string
  size?: number | "sm" | "md" | "lg" | "xl"
}

export function Logo({
  className,
  iconClassName,
  showText = false,
  textClassName,
  size = "md",
}: LogoProps) {
  const pixelSize =
    typeof size === "number"
      ? size
      : size === "sm"
        ? 24
        : size === "md"
          ? 32
          : size === "lg"
            ? 40
            : 52

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", iconClassName)}
      >
        <defs>
          {/* Blue Upper Chevron (<) Gradients */}
          <linearGradient id="seasyn-blue-top" x1="20%" y1="35%" x2="80%" y2="15%">
            <stop offset="0%" stopColor="#305BE0" />
            <stop offset="50%" stopColor="#4775ED" />
            <stop offset="100%" stopColor="#6796F8" />
          </linearGradient>
          <linearGradient id="seasyn-blue-fold" x1="15%" y1="35%" x2="70%" y2="70%">
            <stop offset="0%" stopColor="#1E44BE" />
            <stop offset="35%" stopColor="#325DE0" />
            <stop offset="75%" stopColor="#5B8CF4" />
            <stop offset="100%" stopColor="#8DB4FC" />
          </linearGradient>

          {/* Orange Lower Chevron (>) Gradients */}
          <linearGradient id="seasyn-orange-top" x1="20%" y1="35%" x2="80%" y2="15%">
            <stop offset="0%" stopColor="#E3500D" />
            <stop offset="50%" stopColor="#F3741D" />
            <stop offset="100%" stopColor="#FEA646" />
          </linearGradient>
          <linearGradient id="seasyn-orange-fold" x1="15%" y1="35%" x2="70%" y2="70%">
            <stop offset="0%" stopColor="#C93802" />
            <stop offset="35%" stopColor="#E35611" />
            <stop offset="75%" stopColor="#F78528" />
            <stop offset="100%" stopColor="#FEB963" />
          </linearGradient>
        </defs>

        {/* Blue Upper Chevron Ribbon (<) */}
        <g>
          <path
            d="M 19 32 C 12 36 10 44 11 51 C 12 58 17 64 25 64 L 55 60 C 59 58 59 54 55 52 L 34 45 Z"
            fill="url(#seasyn-blue-fold)"
          />
          <path
            d="M 19 32 L 67 8 C 74 5 81 10 80 17 C 79 23 73 26 67 29 L 34 45 Z"
            fill="url(#seasyn-blue-top)"
          />
        </g>

        {/* Orange Lower Chevron Ribbon (>) (180° Rotational Symmetry) */}
        <g transform="rotate(180 55 55)">
          <path
            d="M 19 32 C 12 36 10 44 11 51 C 12 58 17 64 25 64 L 55 60 C 59 58 59 54 55 52 L 34 45 Z"
            fill="url(#seasyn-orange-fold)"
          />
          <path
            d="M 19 32 L 67 8 C 74 5 81 10 80 17 C 79 23 73 26 67 29 L 34 45 Z"
            fill="url(#seasyn-orange-top)"
          />
        </g>
      </svg>

      {showText && (
        <span className={cn("text-foreground text-xl font-semibold tracking-tight", textClassName)}>
          Seasyn
        </span>
      )}
    </div>
  )
}

export default Logo
