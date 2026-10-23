import * as React from 'react'
import { PersonArmsSpread } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'

// The panel only loads once someone opens it (warmed when the page is idle).
const loadPanel = () => import('@/components/a11y-panel')
const A11yPanel = React.lazy(loadPanel)

const A11yPanelContext = React.createContext<(open: boolean) => void>(() => {})

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = React.useState(false)
  const [hasOpened, setHasOpened] = React.useState(false)

  const setOpen = React.useCallback((value: boolean) => {
    if (value) setHasOpened(true)
    setOpenState(value)
  }, [])

  React.useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => void loadPanel())
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(() => void loadPanel(), 2000)
    return () => clearTimeout(id)
  }, [])

  return (
    <A11yPanelContext.Provider value={setOpen}>
      {children}
      {hasOpened && (
        <React.Suspense fallback={null}>
          <A11yPanel open={open} onOpenChange={setOpen} />
        </React.Suspense>
      )}
    </A11yPanelContext.Provider>
  )
}

/** Header button that opens the accessibility panel. */
export function A11yButton() {
  const setOpen = React.useContext(A11yPanelContext)
  // On phones a tap would pop the tooltip over the panel it just opened.
  const isMobile = useIsMobile()

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className="size-8"
      aria-label="Accessibility settings"
      aria-haspopup="dialog"
      title={isMobile ? undefined : 'Accessibility settings'}
      onClick={() => setOpen(true)}
    >
      <PersonArmsSpread aria-hidden className="size-4" />
    </Button>
  )
}
