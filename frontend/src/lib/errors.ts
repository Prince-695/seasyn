import axios from "axios"

/**
 * Normalizes an unknown error into a clean, human-readable, and production-ready message.
 * Extracts server response messages while safely translating network failures and HTTP status codes.
 */
export function getErrorMessage(
  err: unknown,
  fallbackMessage = "An unexpected error occurred. Please try again."
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (data) {
      if (typeof data === "string" && data.trim()) return data
      if (typeof data.message === "string" && data.message.trim())
        return data.message
      if (typeof data.error === "string" && data.error.trim()) return data.error
    }

    if (err.response?.status === 401) {
      return "Your session has expired. Please sign in again to continue."
    }
    if (err.response?.status === 403) {
      return "You do not have permission to perform this action. Please check with an organization administrator."
    }
    if (err.response?.status === 404) {
      return "The requested resource could not be found or may have been deleted."
    }
    if (err.response?.status === 409) {
      return "A resource with this name, identifier, or email already exists. Please choose a different one."
    }
    if (err.response?.status === 429) {
      return "Too many requests. Please wait a moment before trying again."
    }
    if (err.response?.status && err.response.status >= 500) {
      return "The server encountered an error processing your request. Please try again shortly."
    }

    if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
      return "Unable to connect to the server. Please check your internet connection."
    }
    if (
      err.code === "ECONNABORTED" ||
      err.message.toLowerCase().includes("timeout")
    ) {
      return "The server request timed out. Please verify your connection and try again."
    }
  }

  if (err instanceof Error) {
    // Prevent raw axios HTTP status codes from being shown as text
    if (err.message.startsWith("Request failed with status code")) {
      return fallbackMessage
    }
    return err.message || fallbackMessage
  }

  return fallbackMessage
}
