/** Uniform random integer in [0, max) from the platform's secure generator. */
export function randomInt(max: number): number {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x1_0000_0000 / max) * max
  do crypto.getRandomValues(buf)
  while (buf[0] >= limit) // reject the biased tail, so every value is equally likely
  return buf[0] % max
}

/** Fisher–Yates shuffle in place, using `randomInt`. Returns the same array. */
export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
