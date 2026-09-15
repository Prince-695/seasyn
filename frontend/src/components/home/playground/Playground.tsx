import { useState, useMemo, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { checkSystemHealth } from "@/api/client"
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text"
import { DirectionSelector } from "./DirectionSelector"
import { SchemaInputForm } from "./SchemaInputForm"
import { ConversionStreamAnimation } from "./ConversionStreamAnimation"
import { ConvertedOutputViewer } from "./ConvertedOutputViewer"
import {
  PLAYGROUND_PRESETS,
  convertSqlToNoSql,
  convertNoSqlToSql,
  type ConversionDirection,
  type SchemaField,
  type PresetTemplate,
} from "@/lib/constants/playgroundPresets"

export const Playground = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  // State
  const [direction, setDirection] =
    useState<ConversionDirection>("sql-to-nosql")
  const [activePresetId, setActivePresetId] = useState<string>(
    PLAYGROUND_PRESETS[0].id
  )
  const [tableName, setTableName] = useState<string>(
    PLAYGROUND_PRESETS[0].tableName
  )
  const [fields, setFields] = useState<SchemaField[]>(
    PLAYGROUND_PRESETS[0].fields
  )
  const [isConverting, setIsConverting] = useState<boolean>(false)
  const [hasConverted, setHasConverted] = useState<boolean>(false)
  const [isApiConnected, setIsApiConnected] = useState<boolean | null>(null)

  // System Health Check
  useEffect(() => {
    let isMounted = true
    checkSystemHealth()
      .then((healthy) => {
        if (isMounted) setIsApiConnected(healthy)
      })
      .catch(() => {
        if (isMounted) setIsApiConnected(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Handlers
  const handleDirectionChange = useCallback((newDir: ConversionDirection) => {
    setDirection(newDir)
    const matchingPreset =
      PLAYGROUND_PRESETS.find((p) => p.direction === newDir) ||
      PLAYGROUND_PRESETS[0]
    setActivePresetId(matchingPreset.id)
    setTableName(
      newDir === "sql-to-nosql"
        ? matchingPreset.tableName
        : matchingPreset.collectionName
    )
    setFields(matchingPreset.fields)
    setHasConverted(false)
  }, [])

  const handleSelectPreset = useCallback((preset: PresetTemplate) => {
    setActivePresetId(preset.id)
    setDirection(preset.direction)
    setTableName(
      preset.direction === "sql-to-nosql"
        ? preset.tableName
        : preset.collectionName
    )
    setFields(preset.fields)
    setHasConverted(false)
  }, [])

  const handleFieldsChange = useCallback((newFields: SchemaField[]) => {
    setFields(newFields)
    setHasConverted(false)
  }, [])

  const handleReset = useCallback(() => {
    const currentPreset =
      PLAYGROUND_PRESETS.find((p) => p.id === activePresetId) ||
      PLAYGROUND_PRESETS[0]
    setTableName(
      direction === "sql-to-nosql"
        ? currentPreset.tableName
        : currentPreset.collectionName
    )
    setFields(currentPreset.fields)
    setHasConverted(false)
  }, [activePresetId, direction])

  const handleConvertTrigger = useCallback(() => {
    setIsConverting(true)
    setTimeout(() => {
      setIsConverting(false)
      setHasConverted(true)
    }, 700)
  }, [])

  const handleLaunchStudio = useCallback(() => {
    navigate(isAuthenticated ? "/dashboard" : "/sign-up")
  }, [navigate, isAuthenticated])

  // Conversion Calculation
  const result = useMemo(() => {
    if (direction === "sql-to-nosql") {
      return convertSqlToNoSql(tableName, fields)
    }
    return convertNoSqlToSql(tableName, fields)
  }, [direction, tableName, fields])

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background Decorative Ambient Mesh */}
      <div className="bg-primary/5 pointer-events-none absolute top-1/2 left-1/2 h-75 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" />
      <div className="bg-secondary/5 pointer-events-none absolute top-1/3 right-1/4 h-50 w-87.5 rounded-full blur-[90px]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Shortened Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <span className="bg-secondary text-secondary-foreground mb-3 inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold shadow-2xs">
            Playground
          </span>

          <ScrollRevealText
            as="h2"
            lines={["Live Schema Playground"]}
            className="text-foreground max-w-2xl items-center text-center font-serif text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl"
            lineClassName="leading-tight"
          />

          <p className="text-muted-foreground mt-2.5 max-w-xl text-sm leading-relaxed sm:text-base">
            Test bidirectional schema mapping in real-time. Edit fields to
            observe instant type inference.
          </p>
        </motion.div>

        {/* Direction Switcher Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <DirectionSelector
            direction={direction}
            onChange={handleDirectionChange}
          />
        </motion.div>

        {/* 3-Column Symmetrical Conduit Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12"
        >
          {/* Left: Source Schema Editor */}
          <div className="h-130 lg:col-span-5">
            <SchemaInputForm
              direction={direction}
              tableName={tableName}
              onTableNameChange={setTableName}
              fields={fields}
              onFieldsChange={handleFieldsChange}
              onSelectPreset={handleSelectPreset}
              activePresetId={activePresetId}
              onReset={handleReset}
            />
          </div>

          {/* Center: Live Stream Conduit */}
          <div className="flex items-center justify-center lg:col-span-2">
            <ConversionStreamAnimation
              isConverting={isConverting}
              isApiConnected={isApiConnected}
            />
          </div>

          {/* Right: Target Converted Output Viewer */}
          <div className="h-130 lg:col-span-5">
            <ConvertedOutputViewer
              direction={direction}
              targetName={tableName}
              result={result}
              hasConverted={hasConverted}
              isConverting={isConverting}
              onConvert={handleConvertTrigger}
              onLaunchStudio={handleLaunchStudio}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Playground
