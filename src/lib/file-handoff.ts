// Passes files from one page to a tool it opens, in memory only: nothing is
// stored, and a reload drops them. Navigation inside the app keeps the page's
// JavaScript alive, so the tool picks them up when it mounts, or straight away
// if it's already open (sending a file to the page you're on).

let pending: { path: string; files: File[] } | null = null
const listeners = new Set<() => void>()

/** Leave files for the tool at `path` to pick up. */
export function handOff(path: string, files: File[]): void {
  pending = files.length ? { path, files } : null
  for (const listener of listeners) listener()
}

/** Called after every hand-off, so a tool that's already open can take its files. Returns an unsubscribe. */
export function onHandoff(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The files left for the tool at `path`, once; null when there are none. */
export function takeHandoff(path: string): File[] | null {
  if (!pending || pending.path !== path) return null
  const { files } = pending
  pending = null
  return files
}

/** How many files are waiting for the tool at `path`, without taking them. */
export function handoffCount(path: string): number {
  return pending?.path === path ? pending.files.length : 0
}
