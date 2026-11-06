// Computer opponent for 8-ball. It looks at every legal object ball and every
// pocket, keeps the shots whose lines are clear, and picks the easiest one
// (straight, short), then misses a little like a decent bar player.
import { W, H, R, POCKETS, HEAD_X, FOOT, groupOf, cueBall, canPlaceCue } from './pool.js'

const AIM_ERROR = 0.012 // radians of hand shake
const POWER_ERROR = 0.1

function targets(g, player) {
  const live = g.balls.filter((b) => !b.potted && b.id !== 0)
  const grp = g.groups[player]
  if (!grp) return live.filter((b) => b.id !== 8) // open table
  const mine = live.filter((b) => groupOf(b.id) === grp)
  return mine.length ? mine : live.filter((b) => b.id === 8)
}

// Is the corridor a ball of radius R travels from a to b free of other balls?
function clear(g, ax, ay, bx, by, ignore) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy || 1
  return g.balls.every((o) => {
    if (o.potted || ignore.includes(o.id)) return true
    const t = Math.max(0, Math.min(1, ((o.x - ax) * dx + (o.y - ay) * dy) / len2))
    return Math.hypot(o.x - (ax + dx * t), o.y - (ay + dy * t)) > R * 2 - 0.5
  })
}

// Best pot from the cue ball at (cx, cy), or null when nothing is makeable.
export function planShot(g, player, cx = cueBall(g).x, cy = cueBall(g).y) {
  let best = null
  for (const b of targets(g, player)) {
    for (const p of POCKETS) {
      const side = p.x === W / 2
      const px = p.x
      const py = side ? (p.y < H / 2 ? 0 : H) : p.y
      const d2 = Math.hypot(px - b.x, py - b.y)
      const ux = (px - b.x) / d2
      const uy = (py - b.y) / d2
      if (side && Math.abs(uy) < 0.55) continue // side pockets only take steep approaches
      const gx = b.x - ux * R * 2 // ghost ball: where the cue ball must be at contact
      const gy = b.y - uy * R * 2
      const d1 = Math.hypot(gx - cx, gy - cy)
      if (d1 < 1) continue
      const cut = ((gx - cx) * ux + (gy - cy) * uy) / d1 // cosine of the cut angle
      if (cut < 0.3) continue
      if (!clear(g, cx, cy, gx, gy, [0, b.id])) continue
      if (!clear(g, b.x, b.y, px, py, [0, b.id])) continue
      const score = (cut * cut) / (1 + (d1 + d2 * 1.5) / 700) * (side ? 0.8 : 1)
      if (!best || score > best.score) {
        const power = Math.min(0.9, Math.max(0.22, 0.16 + (d1 + d2 / Math.max(cut, 0.35)) / 1500))
        best = { angle: Math.atan2(gy - cy, gx - cx), power, score, ball: b.id }
      }
    }
  }
  return best
}

const noise = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5

export function chooseShot(g, player) {
  const c = cueBall(g)
  if (g.breakShot) return { angle: Math.atan2(FOOT.y - c.y, FOOT.x - c.x) + noise() * 0.01, power: 1 }
  const plan = planShot(g, player)
  if (plan) return { angle: plan.angle + noise() * AIM_ERROR, power: plan.power * (1 + noise() * POWER_ERROR) }
  // nothing to pot: at least make a legal hit on the nearest reachable ball of its own
  const options = targets(g, player)
    .filter((b) => clear(g, c.x, c.y, b.x, b.y, [0, b.id]))
    .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))
  const t = options[0] || targets(g, player)[0]
  return { angle: Math.atan2(t.y - c.y, t.x - c.x) + noise() * AIM_ERROR, power: 0.45 }
}

// Ball in hand: try spots around the table and keep the one with the easiest pot.
export function choosePlacement(g, player) {
  let best = null
  for (let i = 0; i < 80; i++) {
    const x = R + Math.random() * ((g.breakShot ? HEAD_X : W) - R * 2)
    const y = R + Math.random() * (H - R * 2)
    if (!canPlaceCue(g, x, y)) continue
    const plan = planShot(g, player, x, y)
    const score = plan ? plan.score : 0
    if (!best || score > best.score) best = { x, y, score }
  }
  return best || { x: HEAD_X, y: H / 2 }
}
