import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { PublicDatabaseConnection } from "@/types"
import { useConnectionWizard } from "@/hooks/useConnectionWizard"
import { WizardProgressTracker } from "./WizardProgressTracker"
import { WizardStep1Engine } from "./WizardStep1Engine"
import { WizardStep2Credentials } from "./WizardStep2Credentials"
import { WizardStep3Review } from "./WizardStep3Review"
import { WizardFooter } from "./WizardFooter"

export interface ConnectionWizardModalProps {
  projectId: string
  onConnectionCreated?: (conn: PublicDatabaseConnection) => void
  trigger?: React.ReactNode
  defaultIsSource?: boolean
}

export function ConnectionWizardModal({
  projectId,
  onConnectionCreated,
  trigger,
  defaultIsSource = true,
}: ConnectionWizardModalProps) {
  const {
    open,
    step,
    direction,
    selectedEngine,
    setSelectedEngine,
    selectedEngineMeta,
    mongoMode,
    setMongoMode,
    isSourceVal,
    setIsSourceVal,
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
    handleFormSubmit,
  } = useConnectionWizard({
    projectId,
    defaultIsSource,
    onConnectionCreated,
  })

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              <span>Add Database Connection</span>
            </Button>
          )
        }
      />
      <DialogContent className="flex h-150 max-h-150 w-[95vw] max-w-[95vw] flex-col gap-0 overflow-hidden p-6 sm:h-175 sm:max-w-220 sm:p-7">
        <WizardProgressTracker
          step={step}
          selectedEngineMeta={selectedEngineMeta}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleFormSubmit()
          }}
          className="mt-2 flex min-h-0 flex-1 flex-col justify-between overflow-hidden"
        >
          <div className="relative min-h-0 flex-1 overflow-y-auto px-1 py-1">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {/* ── STEP 1: Engine & Role ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <WizardStep1Engine
                    form={form}
                    selectedEngine={selectedEngine}
                    setSelectedEngine={setSelectedEngine}
                    isSourceVal={isSourceVal}
                    setIsSourceVal={setIsSourceVal}
                    disabled={isPending}
                  />
                </motion.div>
              )}

              {/* ── STEP 2: Connection Credentials ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <WizardStep2Credentials
                    form={form}
                    selectedEngine={selectedEngine}
                    mongoMode={mongoMode}
                    setMongoMode={setMongoMode}
                    quickPasteUri={quickPasteUri}
                    setQuickPasteUri={setQuickPasteUri}
                    showMongoUri={showMongoUri}
                    setShowMongoUri={setShowMongoUri}
                    onApplyConnectionString={handleApplyConnectionString}
                    disabled={isPending}
                  />
                </motion.div>
              )}

              {/* ── STEP 3: Review & Test Diagnostics ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <WizardStep3Review
                    projectId={projectId}
                    selectedEngine={selectedEngine}
                    selectedEngineMeta={selectedEngineMeta}
                    isSourceVal={isSourceVal}
                    formValues={formValues}
                    getTestPayload={getTestPayload}
                    isError={isError}
                    errorMessage={errorMessage}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <WizardFooter
            step={step}
            isPending={isPending}
            onBack={handleBack}
            onCancel={() => handleDialogChange(false)}
            onNextFromStep1={handleNextFromStep1}
            onNextFromStep2={handleNextFromStep2}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
