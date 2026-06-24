import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// utils.ts

/**
 * Sets a cookie. Automatically stringifies objects.
//  */
export function setCookie(name: string, value: unknown) {
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:"

  // If the value is an object (and not null), stringify it. Otherwise, force it to a string.
  const stringValue =
    typeof value === "object" && value !== null
      ? JSON.stringify(value)
      : String(value)
  const encodedValue = encodeURIComponent(stringValue)

  document.cookie = `${name}=${encodedValue}; path=/; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`
}

/**
 * Gets a cookie. Automatically tries to parse JSON, falls back to string.
 * Usage: getCookie<User>('user') OR getCookie('token')
 */
export function getCookie<T = string>(name: string): T | null {
  const prefix = `${name}=`
  const decodedCookie = decodeURIComponent(document.cookie)
  const cookieArray = decodedCookie.split(";")

  for (let i = 0; i < cookieArray.length; i++) {
    const cookie = cookieArray[i].trim()

    if (cookie.indexOf(prefix) === 0) {
      const rawValue = cookie.substring(prefix.length)

      try {
        // Try to parse it as JSON (for user objects)
        return JSON.parse(rawValue) as T
      } catch {
        // If it fails, it must be a plain string (for tokens)
        return rawValue as unknown as T
      }
    }
  }
  return null
}

/**
 * Deletes a cookie by name.
 */
export function deleteCookie(name: string) {
  const isSecure = window.location.protocol === "https:"
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`
}
