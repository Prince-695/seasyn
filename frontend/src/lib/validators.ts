import { z } from "zod"

// ─── Reusable Field Primitives ───────────────────────────────────────────────

const emailField = z.string().email({ message: "Invalid email address" })

const otpField = z
  .string()
  .length(6, { message: "Verification code must be exactly 6 digits" })
  .regex(/^\d+$/, { message: "OTP must only contain digits" })

const passwordField = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })

const roleField = z.enum(["admin", "member", "viewer"], {
  error: "Role must be admin, member, or viewer",
})

const slugField = z
  .string()
  .min(2, { message: "Slug must be at least 2 characters" })
  .max(50, { message: "Slug cannot exceed 50 characters" })
  .regex(/^[a-z0-9-]+$/, {
    message: "Slug must contain only lowercase letters, numbers, and hyphens",
  })

const descriptionField = z
  .string()
  .max(500, { message: "Description cannot exceed 500 characters" })
  .optional()

// ─── Authentication Schemas ──────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
})

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters" })
      .max(50),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters" })
      .max(50),
    email: emailField,
    password: passwordField
      .regex(/[A-Z]/, { message: "Must include at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Must include at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Must include at least one number" })
      .regex(/[^A-Za-z0-9]/, {
        message: "Must include at least one special character",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const otpVerificationSchema = z.object({
  email: emailField,
  otp: otpField,
})

export const forgotPasswordSchema = z.object({
  email: emailField,
})

export const resetPasswordSchema = z
  .object({
    email: emailField,
    otp: otpField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

// ─── Project Schemas ─────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Project name must be at least 2 characters" })
    .max(100, { message: "Project name cannot exceed 100 characters" }),
  slug: slugField.optional().or(z.literal("")),
  description: descriptionField,
  environment: z
    .enum(["development", "staging", "production"])
    .default("development"),
})

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Project name must be at least 2 characters" })
    .max(100),
  description: descriptionField,
  environment: z.enum(["development", "staging", "production"]).optional(),
})

export const projectSchema = createProjectSchema

// ─── Database Connection Schema ──────────────────────────────────────────────

export const databaseConnectionSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Connection name must be at least 2 characters" })
      .max(100),
    db_type: z.enum(["postgres", "mysql", "mongodb", "sqlite"]),
    host: z.string().optional(),
    port: z.number().int().positive().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    ssl_mode: z
      .enum(["disable", "require", "verify-ca", "verify-full", "prefer"])
      .optional(),
    file_path: z.string().optional(),
    uri: z.string().optional(),
    is_source: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.db_type === "sqlite") {
        return !!data.file_path && data.file_path.trim().length > 0
      }
      if (
        data.db_type === "mongodb" &&
        data.uri &&
        data.uri.trim().length > 0
      ) {
        return true
      }
      return !!data.host && !!data.database
    },
    {
      message:
        "Please provide either a valid SQLite file path, MongoDB URI, or Host & Database details.",
      path: ["host"],
    }
  )

// ─── Organization Schemas ────────────────────────────────────────────────────

export const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Organization name must be at least 2 characters" })
    .max(100, { message: "Organization name cannot exceed 100 characters" }),
  slug: slugField,
  description: descriptionField,
})

export const updateOrgSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Organization name must be at least 2 characters" })
    .max(100, { message: "Organization name cannot exceed 100 characters" }),
  description: descriptionField,
})

export const inviteMemberSchema = z.object({
  email: emailField,
  role: roleField,
})

export const updateMemberRoleSchema = z.object({
  role: roleField,
})

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>
export type DatabaseConnectionInput = z.infer<typeof databaseConnectionSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CreateOrgInput = z.infer<typeof createOrgSchema>
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
