import apiClient from "./client"
import type { LoginInput, RegisterInput } from "@/lib/validators"

export const authApi = {
  login: async (data: LoginInput) => {
    const response = await apiClient.post("/auth/login", data)
    return response.data
  },

  register: async (data: RegisterInput) => {
    const response = await apiClient.post("/auth/register", data)
    return response.data
  },

  me: async () => {
    const response = await apiClient.get("/auth/me")
    return response.data
  },
}
