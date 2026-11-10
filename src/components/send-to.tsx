import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { canReceive } from '@/lib/file-types'
import { handOff } from '@/lib/file-handoff'
import { tools } from '@/lib/tools'

/**
 * "Send to": opens a result in another tool that can take it. The file is
 * handed over in memory, so nothing is stored or uploaded. Shows nothing when
 * no other tool opens this kind of file.
 */
export function SendTo({ file, from, disabled }: { file: File | null; from: string; disabled?: boolean }) {
  const navigate = useNavigate()
  const targets = React.useMemo(
    () => (file ? tools.filter((t) => t.path !== from && canReceive(t, file)) : []),
    [file, from]
  )
  if (!file || !targets.length) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Send to another tool</p>
      <div className="flex flex-wrap gap-2">
        {targets.map((t) => (
          <Button
            key={t.path}
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              handOff(t.path, [file])
              void navigate(t.path)
            }}
          >
            <t.icon className="h-4 w-4" /> {t.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
