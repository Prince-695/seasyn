import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function setTokenCookie(token: string, maxAge = 604800) {
  const isSecure = window.location.protocol === "https:"
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`
}

export function deleteTokenCookie() {
  const isSecure = window.location.protocol === "https:"
  document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`
}
