// Passes files from one page to a tool it opens, in memory only: nothing is
// stored, and a reload drops them. Navigation inside the app keeps the page's
// JavaScript alive, so the tool can pick them up when it mounts.

let pending: { path: string; files: File[] } | null = null

/** Leave files for the tool at `path` to pick up. */
export function handOff(path: string, files: File[]): void {
  pending = files.length ? { path, files } : null
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
