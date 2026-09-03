import { useRef, type ClipboardEvent, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  hasError?: boolean
  autoFocus?: boolean
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  hasError = false,
  autoFocus = false,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const digits = Array.from({ length }, (_, i) => value[i] ?? "")

  const focusIndex = (index: number) => {
    const el = inputRefs.current[Math.max(0, Math.min(index, length - 1))]
    el?.focus()
    el?.select()
  }

  const handleChange = (index: number, char: string) => {
    // Only allow single digit
    const digit = char.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[index] = digit

    const fullValue = next.join("")
    onChange(fullValue)

    if (digit && index < length - 1) {
      focusIndex(index + 1)
    }

    if (fullValue.length === length && next.every((d) => d !== "")) {
      onComplete?.(fullValue)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault()
      if (digits[index]) {
        // Clear current
        const next = [...digits]
        next[index] = ""
        onChange(next.join(""))
      } else if (index > 0) {
        // Move to previous and clear
        const next = [...digits]
        next[index - 1] = ""
        onChange(next.join(""))
        focusIndex(index - 1)
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      focusIndex(index - 1)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      focusIndex(index + 1)
    } else if (e.key === "Tab") {
      // allow normal tab navigation
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length)
    if (!pasted) return

    const next = Array.from({ length }, (_, i) => pasted[i] ?? "")
    const fullValue = next.join("")
    onChange(fullValue)

    // Focus the last filled box or the next empty box
    const focusTarget = Math.min(pasted.length, length - 1)
    focusIndex(focusTarget)

    if (fullValue.length === length && next.every((d) => d !== "")) {
      onComplete?.(fullValue)
    }
  }

  return (
    <div
      className="flex items-center justify-center gap-2.5"
      role="group"
      aria-label="One-time password input"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${length}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-12 w-12 rounded-lg border text-center font-mono text-lg font-semibold transition-all duration-200 outline-none",
            "bg-muted/30 text-foreground caret-primary",
            "focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20",
            hasError
              ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
              : "border-border",
            digit ? "border-primary/50 bg-primary/5" : "border-border",
            disabled && "cursor-not-allowed opacity-50"
          )}
        />
      ))}
    </div>
  )
}

export default OtpInput
