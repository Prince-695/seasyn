import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
})

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters" }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const connectionConfigSchema = z.object({
  dbType: z.enum(["postgresql", "mysql", "mongodb", "sqlite"]),
  host: z.string().min(1, "Host is required").optional(),
  port: z.number().int().positive().optional(),
  user: z.string().min(1, "User is required").optional(),
  password: z.string().optional(),
  database: z.string().min(1, "Database name is required").optional(),
  filePath: z.string().optional(), // For SQLite
})

export const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})

export const resetPasswordSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    otp: z
      .string()
      .length(6, { message: "OTP must be exactly 6 characters" })
      .regex(/^\d+$/, { message: "OTP must contain only numbers" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

// Infer types
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ConnectionConfigInput = z.infer<typeof connectionConfigSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
