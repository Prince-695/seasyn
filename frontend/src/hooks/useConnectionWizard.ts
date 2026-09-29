import { useState, useEffect } from "react"
import { useForm, useWatch, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  databaseConnectionSchema,
  type DatabaseConnectionInput,
} from "@/lib/validators"
import { connectionKeys } from "@/lib/queryKeys"
import { projectsApi } from "@/api/projects"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { ENGINE_DEFAULTS, ENGINES } from "@/lib/constants/engines"
import type {
  DBType,
  SSLMode,
  CreateConnectionPayload,
  PublicDatabaseConnection,
  TestConnectionPayload,
} from "@/types"
import { getErrorMessage } from "@/lib/errors"

export type WizardStep = 1 | 2 | 3
export type MongoMode = "uri" | "params"

export interface UseConnectionWizardOptions {
  projectId: string
  defaultIsSource?: boolean
  onConnectionCreated?: (conn: PublicDatabaseConnection) => void
}

export interface UseConnectionWizardReturn {
  open: boolean
  setOpen: (open: boolean) => void
  step: WizardStep
  setStep: (step: WizardStep) => void
  direction: number
  setDirection: (dir: number) => void
  selectedEngine: DBType
  setSelectedEngine: (engine: DBType) => void
  selectedEngineMeta: (typeof ENGINES)[number] | undefined
  mongoMode: MongoMode
  setMongoMode: (mode: MongoMode) => void
  isSourceVal: boolean
  setIsSourceVal: (val: boolean) => void
  quickPasteOpen: boolean
  setQuickPasteOpen: (open: boolean) => void
  quickPasteUri: string
  setQuickPasteUri: (uri: string) => void
  showMongoUri: boolean
  setShowMongoUri: (show: boolean) => void
  form: UseFormReturn<DatabaseConnectionInput>
  formValues: DatabaseConnectionInput
  isPending: boolean
  isError: boolean
  errorMessage: string | null
  handleDialogChange: (isOpen: boolean) => void
  handleApplyConnectionString: (raw: string) => void
  getTestPayload: () => TestConnectionPayload
  handleNextFromStep1: () => Promise<void>
  handleNextFromStep2: () => Promise<void>
  handleBack: () => void
  handleFormSubmit: () => void
}

export function useConnectionWizard({
  projectId,
  defaultIsSource = true,
  onConnectionCreated,
}: UseConnectionWizardOptions): UseConnectionWizardReturn {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<WizardStep>(1)
  const [direction, setDirection] = useState<number>(1)
  const queryClient = useQueryClient()
  const { activeOrg } = useWorkspaceStore()
  const [selectedEngine, setSelectedEngine] = useState<DBType>("postgres")
  const [mongoMode, setMongoMode] = useState<MongoMode>("uri")
  const [quickPasteOpen, setQuickPasteOpen] = useState(false)
  const [quickPasteUri, setQuickPasteUri] = useState("")
  const [showMongoUri, setShowMongoUri] = useState(false)

  const form = useForm<DatabaseConnectionInput>({
    resolver: zodResolver(databaseConnectionSchema),
    defaultValues: {
      name: "",
      db_type: "postgres",
      host: "",
      port: 5432,
      database: "",
      username: "",
      password: "",
      ssl_mode: "disable",
      file_path: "",
      uri: "",
      is_source: defaultIsSource,
    },
  })

  const {
    setValue,
    getValues,
    reset,
    trigger: triggerValidation,
    control,
  } = form
  const watchedIsSource = useWatch({
    control,
    name: "is_source",
    defaultValue: defaultIsSource,
  })
  const isSourceVal =
    watchedIsSource !== undefined ? watchedIsSource : defaultIsSource

  const setIsSourceVal = (val: boolean) => {
    setValue("is_source", val)
  }

  // Synchronize db_type and apply engine-specific presets from centralized constants
  useEffect(() => {
    setValue("db_type", selectedEngine)
    const defaults = ENGINE_DEFAULTS[selectedEngine]
    if (defaults.port) setValue("port", defaults.port)
    if (defaults.ssl_mode) setValue("ssl_mode", defaults.ssl_mode as SSLMode)
    if (selectedEngine === "sqlite") {
      setValue("file_path", "/data/database.db")
    }
  }, [selectedEngine, setValue])

  const createMutation = useMutation({
    mutationFn: async (data: CreateConnectionPayload) => {
      if (!activeOrg?.id) {
        throw new Error(
          "No organization is currently active. Please select an organization and try again."
        )
      }
      const res = await projectsApi.createConnection(
        activeOrg.id,
        projectId,
        data
      )
      return res.data
    },
    onSuccess: (newConn) => {
      if (activeOrg?.id) {
        queryClient.invalidateQueries({
          queryKey: connectionKeys.list(activeOrg.id, projectId),
        })
      }
      handleDialogChange(false)
      if (newConn) {
        onConnectionCreated?.(newConn)
      }
    },
  })

  // Reset wizard state on dialog close and ensure role is synced on open
  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setValue("is_source", defaultIsSource)
    } else {
      setStep(1)
      setDirection(1)
      setQuickPasteOpen(false)
      setQuickPasteUri("")
      reset()
      createMutation.reset()
    }
  }

  // Parse connection URI and populate form fields
  const handleApplyConnectionString = (raw: string) => {
    try {
      const trimmed = raw.trim()
      if (!trimmed) return
      const parsed = new URL(trimmed)
      const protocol = parsed.protocol.replace(":", "").toLowerCase()

      if (protocol.includes("postgres")) setSelectedEngine("postgres")
      else if (protocol.includes("mysql")) setSelectedEngine("mysql")
      else if (protocol.includes("mongo")) {
        setSelectedEngine("mongodb")
        setValue("db_type", "mongodb")
        setValue("uri", trimmed)
        const isSrv = trimmed.startsWith("mongodb+srv://")
        const hasTls =
          parsed.searchParams.get("tls") === "true" ||
          parsed.searchParams.get("ssl") === "true"
        setValue(
          "ssl_mode",
          (isSrv || hasTls ? "require" : "disable") as SSLMode
        )
        if (parsed.hostname) {
          setValue("host", parsed.hostname)
        }
        if (parsed.port) {
          setValue("port", parseInt(parsed.port, 10))
        } else if (!isSrv) {
          setValue("port", 27017)
        }
        if (parsed.pathname) {
          const dbName = parsed.pathname.replace(/^\//, "")
          if (dbName) setValue("database", dbName)
        }
        if (parsed.username) {
          setValue("username", decodeURIComponent(parsed.username))
        }
        if (parsed.password) {
          setValue("password", decodeURIComponent(parsed.password))
        }
        setQuickPasteOpen(false)
        setQuickPasteUri("")
        return
      }

      if (parsed.hostname) setValue("host", parsed.hostname)
      if (parsed.port) setValue("port", parseInt(parsed.port, 10))
      if (parsed.username)
        setValue("username", decodeURIComponent(parsed.username))
      if (parsed.password)
        setValue("password", decodeURIComponent(parsed.password))
      if (parsed.pathname) {
        const dbName = parsed.pathname.replace(/^\//, "")
        if (dbName) setValue("database", dbName)
      }
      const sslMode = parsed.searchParams.get("sslmode")
      if (
        sslMode &&
        ["disable", "require", "verify-ca", "verify-full", "prefer"].includes(
          sslMode
        )
      ) {
        setValue("ssl_mode", sslMode as SSLMode)
      }
      setQuickPasteOpen(false)
      setQuickPasteUri("")
    } catch {
      // Invalid URL format
    }
  }

  // Extract payload for live diagnostic ping
  const getTestPayload = (): TestConnectionPayload => {
    const values = getValues()

    let payload: TestConnectionPayload

    if (selectedEngine === "sqlite") {
      payload = {
        db_type: "sqlite",
        file_path: values.file_path,
      }
    } else if (selectedEngine === "mongodb") {
      if (values.uri && values.uri.trim().length > 0) {
        const isSrv = values.uri.startsWith("mongodb+srv://")
        const parsedSsl = isSrv
          ? "require"
          : (values.ssl_mode as SSLMode | undefined)
        payload = {
          db_type: "mongodb",
          uri: values.uri,
          ssl_mode: parsedSsl,
          database: values.database,
        }
      } else {
        payload = {
          db_type: "mongodb",
          host: values.host,
          port: values.port,
          database: values.database,
          username: values.username,
          password: values.password,
          ssl_mode: values.ssl_mode as SSLMode | undefined,
        }
      }
    } else {
      payload = {
        db_type: selectedEngine,
        host: values.host,
        port: values.port,
        database: values.database,
        username: values.username,
        password: values.password,
        ssl_mode: values.ssl_mode as SSLMode | undefined,
        file_path: values.file_path,
      }
    }

    return payload
  }

  const onSubmit = (data: DatabaseConnectionInput) => {
    const payload: CreateConnectionPayload = {
      ...data,
      db_type: selectedEngine,
      is_source: isSourceVal,
    }

    if (selectedEngine === "sqlite") {
      delete payload.host
      delete payload.port
      delete payload.database
      delete payload.username
      delete payload.password
      delete payload.ssl_mode
      delete payload.uri
    } else if (selectedEngine === "mongodb") {
      if (payload.uri && payload.uri.trim().length > 0) {
        delete payload.host
        delete payload.port
        delete payload.username
        delete payload.password
        if (payload.uri.startsWith("mongodb+srv://")) {
          payload.ssl_mode = "require"
        }
      } else {
        delete payload.uri
      }
    }

    createMutation.mutate(payload)
  }

  // Step 1 Validation -> Proceed to Step 2
  const handleNextFromStep1 = async () => {
    const isValid = await triggerValidation(["name", "db_type", "is_source"])
    if (isValid) {
      setDirection(1)
      setStep(2)
    }
  }

  // Step 2 Validation -> Proceed to Step 3
  const handleNextFromStep2 = async () => {
    let isValid = false
    if (selectedEngine === "sqlite") {
      isValid = await triggerValidation(["file_path"])
    } else if (selectedEngine === "mongodb") {
      const vals = getValues()
      if (vals.uri && vals.uri.trim().length > 0) {
        isValid = await triggerValidation(["uri"])
      } else {
        isValid = await triggerValidation(["host", "database"])
      }
    } else {
      isValid = await triggerValidation([
        "host",
        "port",
        "database",
        "username",
      ])
    }

    if (isValid) {
      setDirection(1)
      setStep(3)
    }
  }

  const handleBack = () => {
    setDirection(-1)
    setStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : 1))
  }

  const selectedEngineMeta = ENGINES.find((e) => e.type === selectedEngine)
  const formValues = getValues()
  const isPending = createMutation.isPending
  const isError = createMutation.isError
  const errorMessage = createMutation.isError
    ? getErrorMessage(
        createMutation.error,
        "Unable to save database connection. Please check that credentials are correct and test the connection diagnostic."
      )
    : null

  return {
    open,
    setOpen,
    step,
    setStep,
    direction,
    setDirection,
    selectedEngine,
    setSelectedEngine,
    selectedEngineMeta,
    mongoMode,
    setMongoMode,
    isSourceVal,
    setIsSourceVal,
    quickPasteOpen,
    setQuickPasteOpen,
    quickPasteUri,
    setQuickPasteUri,
    showMongoUri,
    setShowMongoUri,
    form,
    formValues,
    isPending,
    isError,
    errorMessage,
    handleDialogChange,
    handleApplyConnectionString,
    getTestPayload,
    handleNextFromStep1,
    handleNextFromStep2,
    handleBack,
    handleFormSubmit: () => form.handleSubmit(onSubmit)(),
  }
}
