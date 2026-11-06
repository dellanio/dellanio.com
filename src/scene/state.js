// Shared, mutable day/night progress read inside useFrame (no re-renders).
// t = 0 is full day, t = 1 is full night; t eases toward target.
export const timeState = { t: 0, target: 0 }

// Shadow maps are only redrawn when something moves. Anything that moves a
// shadow caster under the pool lamp (balls, cue) asks for a few redraws here.
export const shadowState = { pool: 0 }
export const requestPoolShadow = () => (shadowState.pool = 2)

export const NIGHT_START = 18
export const NIGHT_END = 6

export function autoMode(date = new Date()) {
  const h = date.getHours()
  return h >= NIGHT_START || h < NIGHT_END ? 'night' : 'day'
}

export const clamp01 = (x) => Math.min(1, Math.max(0, x))
export const smooth = (x) => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}
export const lerp = (a, b, t) => a + (b - a) * t
