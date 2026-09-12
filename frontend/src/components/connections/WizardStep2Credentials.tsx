import type { UseFormReturn } from "react-hook-form"
import type { DatabaseConnectionInput } from "@/lib/validators"
import type { DBType } from "@/types"
import type { MongoMode } from "@/hooks/useConnectionWizard"
import { UriQuickPasteBar } from "./forms/UriQuickPasteBar"
import { SqliteForm } from "./forms/SqliteForm"
import { MongoForm } from "./forms/MongoForm"
import { RelationalForm } from "./forms/RelationalForm"

interface WizardStep2CredentialsProps {
  form: UseFormReturn<DatabaseConnectionInput>
  selectedEngine: DBType
  mongoMode: MongoMode
  setMongoMode: (mode: MongoMode) => void
  quickPasteOpen: boolean
  setQuickPasteOpen: (open: boolean) => void
  quickPasteUri: string
  setQuickPasteUri: (uri: string) => void
  showMongoUri: boolean
  setShowMongoUri: (show: boolean) => void
  onApplyConnectionString: (raw: string) => void
  disabled?: boolean
}

export function WizardStep2Credentials({
  form,
  selectedEngine,
  mongoMode,
  setMongoMode,
  quickPasteOpen,
  setQuickPasteOpen,
  quickPasteUri,
  setQuickPasteUri,
  showMongoUri,
  setShowMongoUri,
  onApplyConnectionString,
  disabled = false,
}: WizardStep2CredentialsProps) {
  return (
    <div className="space-y-3 pt-1">
      {/* Quick Paste helper for Relational and Mongo DBs */}
      <UriQuickPasteBar
        selectedEngine={selectedEngine}
        quickPasteOpen={quickPasteOpen}
        setQuickPasteOpen={setQuickPasteOpen}
        quickPasteUri={quickPasteUri}
        setQuickPasteUri={setQuickPasteUri}
        onApply={onApplyConnectionString}
        disabled={disabled}
      />

      {/* Engine Specific Fields */}
      {selectedEngine === "sqlite" ? (
        <SqliteForm form={form} disabled={disabled} />
      ) : selectedEngine === "mongodb" ? (
        <MongoForm
          form={form}
          mongoMode={mongoMode}
          setMongoMode={setMongoMode}
          showMongoUri={showMongoUri}
          setShowMongoUri={setShowMongoUri}
          disabled={disabled}
        />
      ) : (
        <RelationalForm
          form={form}
          selectedEngine={selectedEngine}
          disabled={disabled}
        />
      )}
    </div>
  )
}
