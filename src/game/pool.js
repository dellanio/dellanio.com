// 8-ball engine: 2D physics on the playing surface plus the rules.
// Units are "table pixels": the cloth is W x H, origin at its top-left corner.
import { tr } from '../i18n.js'

export const W = 1000
export const H = 500
export const R = 12 // ball radius
export const POCKETS = [
  { x: 0, y: 0, r: 24 },
  { x: W / 2, y: -6, r: 21 },
  { x: W, y: 0, r: 24 },
  { x: 0, y: H, r: 24 },
  { x: W / 2, y: H + 6, r: 21 },
  { x: W, y: H, r: 24 },
]
export const HEAD_X = W * 0.25 // head string: the cue ball starts behind it
export const FOOT = { x: W * 0.73, y: H / 2 } // apex of the rack

export const BALL_COLORS = {
  1: '#f2c230', 2: '#1d4fbf', 3: '#d62828', 4: '#6a2c91', 5: '#f77f00', 6: '#2a9d50', 7: '#7b2d26', 8: '#111111',
  9: '#f2c230', 10: '#1d4fbf', 11: '#d62828', 12: '#6a2c91', 13: '#f77f00', 14: '#2a9d50', 15: '#7b2d26',
}

export const MAX_SPEED = 2300
const ROLL_DECEL = 230 // px/s² of rolling resistance
const DRAG = 0.55 // proportional slow-down per second
const CUSHION = 0.78 // energy kept bouncing off a rail
const BALL_RESTITUTION = 0.96
const STEP = 1 / 240

export const groupOf = (id) => (id === 0 ? 'cue' : id === 8 ? 'eight' : id < 8 ? 'solids' : 'stripes')
// Player-facing words follow the site language (see src/i18n.js).
export const groupLabel = (grp) => (grp === 'solids' ? tr('lisas', 'solids') : tr('listradas', 'stripes'))
// Player 1 is the visitor, player 2 the computer (ai.js).
export const playerName = (i) => (i === 0 ? tr('Você', 'You') : tr('IA', 'AI'))

function rackPositions() {
  // standard rack: 8 in the middle of row 3, a solid and a stripe in the back corners
  const order = [1, 9, 2, 10, 8, 3, 11, 7, 14, 4, 5, 13, 15, 6, 12]
  const out = []
  let n = 0
  const dx = R * 2 * Math.cos(Math.PI / 6) + 0.4
  for (let row = 0; row < 5; row++)
    for (let k = 0; k <= row; k++) {
      out.push({ id: order[n++], x: FOOT.x + row * dx, y: FOOT.y + (k - row / 2) * (R * 2 + 0.4) })
    }
  return out
}

export function newGame() {
  const balls = [{ id: 0, x: HEAD_X, y: H / 2 }, ...rackPositions()].map((b) => ({ ...b, vx: 0, vy: 0, potted: false }))
  return {
    balls,
    phase: 'aim', // aim | moving | ballInHand | over
    current: 0,
    groups: [null, null],
    breakShot: true,
    shot: null,
    // what just happened, for the sound effects: cue strikes, ball clicks,
    // cushion bumps and pocketed balls, with their speeds (drained by the 3D table)
    events: [],
    winner: null,
    message: tr('Sua saída! Mire, segure e puxe para trás; solte para tacar.', 'Your break! Aim, hold and pull back; let go to shoot.'),
  }
}

export const cueBall = (g) => g.balls[0]

export function shoot(g, angle, power) {
  const c = cueBall(g)
  const speed = Math.max(0.04, Math.min(1, power)) * MAX_SPEED
  c.vx = Math.cos(angle) * speed
  c.vy = Math.sin(angle) * speed
  g.events?.push({ type: 'cue', speed, breakShot: g.breakShot })
  g.phase = 'moving'
  g.shot = { firstHit: null, potted: [], railAfterContact: false }
}

export function canPlaceCue(g, x, y) {
  if (x < R || x > W - R || y < R || y > H - R) return false
  if (g.breakShot && x > HEAD_X) return false
  return g.balls.every((b) => b.id === 0 || b.potted || Math.hypot(b.x - x, b.y - y) > R * 2 + 1)
}

export function placeCue(g, x, y) {
  const c = cueBall(g)
  Object.assign(c, { x, y, vx: 0, vy: 0, potted: false })
  g.phase = 'aim'
}

const nearPocketMouth = (b) => POCKETS.some((p) => Math.hypot(b.x - p.x, b.y - p.y) < p.r * 1.9)

function stepPhysics(g, dt) {
  const live = g.balls.filter((b) => !b.potted)
  for (const b of live) {
    const speed = Math.hypot(b.vx, b.vy)
    if (speed > 0) {
      const next = Math.max(0, speed - ROLL_DECEL * dt) * (1 - DRAG * dt)
      const k = next < 4 ? 0 : next / speed
      b.vx *= k
      b.vy *= k
    }
    b.x += b.vx * dt
    b.y += b.vy * dt
  }
  // ball-ball
  for (let i = 0; i < live.length; i++)
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]
      const b = live[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy)
      if (d === 0 || d >= R * 2) continue
      const nx = dx / d
      const ny = dy / d
      const overlap = R * 2 - d
      a.x -= nx * overlap * 0.5
      a.y -= ny * overlap * 0.5
      b.x += nx * overlap * 0.5
      b.y += ny * overlap * 0.5
      const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny
      if (rel <= 0) continue
      g.events?.push({ type: 'ball', speed: rel, first: !!g.shot && g.shot.firstHit === null, breakShot: g.breakShot })
      const imp = rel * (1 + BALL_RESTITUTION) * 0.5
      a.vx -= imp * nx
      a.vy -= imp * ny
      b.vx += imp * nx
      b.vy += imp * ny
      if (g.shot && g.shot.firstHit === null) {
        if (a.id === 0) g.shot.firstHit = b.id
        else if (b.id === 0) g.shot.firstHit = a.id
      }
    }
  // rails (open where the pockets are) and pockets
  for (const b of live) {
    if (!nearPocketMouth(b)) {
      const into = Math.max(b.x < R ? -b.vx : 0, b.x > W - R ? b.vx : 0, b.y < R ? -b.vy : 0, b.y > H - R ? b.vy : 0)
      if (into > 0) g.events?.push({ type: 'rail', speed: into })
      if (b.x < R) ((b.x = R), (b.vx = Math.abs(b.vx) * CUSHION))
      if (b.x > W - R) ((b.x = W - R), (b.vx = -Math.abs(b.vx) * CUSHION))
      if (b.y < R) ((b.y = R), (b.vy = Math.abs(b.vy) * CUSHION))
      if (b.y > H - R) ((b.y = H - R), (b.vy = -Math.abs(b.vy) * CUSHION))
    }
    for (const p of POCKETS)
      if (Math.hypot(b.x - p.x, b.y - p.y) < p.r) {
        g.events?.push({ type: 'pocket', speed: Math.hypot(b.vx, b.vy), id: b.id })
        b.potted = true
        b.vx = b.vy = 0
        g.shot?.potted.push(b.id)
        break
      }
    // a ball squeezing past a pocket jaw and off the cloth counts as potted too
    if (!b.potted && (b.x < -R || b.x > W + R || b.y < -R || b.y > H + R)) {
      g.events?.push({ type: 'pocket', speed: Math.hypot(b.vx, b.vy), id: b.id })
      b.potted = true
      g.shot?.potted.push(b.id)
    }
  }
}

const moving = (g) => g.balls.some((b) => !b.potted && (b.vx !== 0 || b.vy !== 0))
const remaining = (g, group) => g.balls.filter((b) => !b.potted && groupOf(b.id) === group).length

// Advance the simulation by `elapsed` seconds; resolves the shot when everything stops.
export function update(g, elapsed) {
  if (g.phase !== 'moving') return
  let t = Math.min(elapsed, 0.25) // catch up after slow frames (substeps keep it stable)
  while (t > 0) {
    const dt = Math.min(STEP, t)
    stepPhysics(g, dt)
    t -= dt
  }
  if (!moving(g)) resolveShot(g)
}

function resolveShot(g) {
  const { firstHit, potted } = g.shot
  const me = g.current
  const other = 1 - me
  const myGroup = g.groups[me]
  const cuePotted = potted.includes(0)
  const objectPotted = potted.filter((id) => id !== 0 && id !== 8)

  let foul = null
  if (cuePotted) foul = tr('a branca caiu', 'the cue ball went in')
  else if (firstHit === null) foul = tr('não tocou em nenhuma bola', 'no ball was hit')
  else if (myGroup && groupOf(firstHit) !== myGroup && !(groupOf(firstHit) === 'eight' && remaining(g, myGroup) === 0))
    foul = groupOf(firstHit) === 'eight'
      ? tr('tocou primeiro na bola 8', 'hit the 8 ball first')
      : tr(`tocou primeiro numa bola ${groupLabel(groupOf(firstHit))}`, `hit one of the ${groupLabel(groupOf(firstHit))} first`)
  else if (!myGroup && firstHit === 8 && !g.breakShot) foul = tr('tocou primeiro na 8', 'hit the 8 first')

  // the 8 decides the game
  if (potted.includes(8)) {
    const cleared = myGroup && remaining(g, myGroup) === 0
    g.phase = 'over'
    if (cleared && !foul) {
      g.winner = me
      g.message = me === 0 ? tr('Você matou a 8 e venceu! 🎱', 'You sank the 8 and won! 🎱') : tr('A IA matou a 8 e venceu. 🎱', 'The AI sank the 8 and won. 🎱')
    } else {
      g.winner = other
      g.message = me === 0
        ? tr('Você derrubou a 8 antes da hora — vitória da IA.', 'You sank the 8 too early — the AI wins.')
        : tr('A IA derrubou a 8 antes da hora — você venceu! 🎉', 'The AI sank the 8 too early — you win! 🎉')
    }
    return
  }

  // first legal pot on an open table assigns the groups
  if (!myGroup && !foul && objectPotted.length && !g.breakShot) {
    const grp = groupOf(objectPotted[0])
    g.groups[me] = grp
    g.groups[other] = grp === 'solids' ? 'stripes' : 'solids'
  }
  const mine = g.groups[me]
  const keepsTurn = !foul && objectPotted.length > 0 && (!mine || objectPotted.some((id) => groupOf(id) === mine))
  g.breakShot = false

  if (foul) {
    g.current = other
    if (cuePotted) {
      const c = cueBall(g)
      Object.assign(c, { x: HEAD_X, y: H / 2, potted: false, vx: 0, vy: 0 })
    }
    g.phase = 'ballInHand'
    g.message = other === 0
      ? tr(`Falta da IA: ${foul}. Bola na mão — clique para posicionar a branca.`, `AI foul: ${foul}. Ball in hand — click to place the cue ball.`)
      : tr(`Falta: ${foul}. Bola na mão para a IA.`, `Foul: ${foul}. Ball in hand for the AI.`)
    return
  }
  g.phase = 'aim'
  if (keepsTurn) {
    g.message = `${me === 0 ? tr('Boa! Você continua', 'Nice! You keep going') : tr('A IA continua', 'The AI keeps going')}${mine ? ` (${groupLabel(mine)})` : ''}.`
  } else {
    g.current = other
    const grp = g.groups[other]
    g.message = `${other === 0 ? tr('Sua vez', 'Your turn') : tr('Vez da IA', "AI's turn")}${grp ? ` (${groupLabel(grp)})` : tr(' — mesa aberta', ' — open table')}.`
  }
}

// Where the aim line from the cue ball first meets another ball or a rail.
export function traceAim(g, angle) {
  const c = cueBall(g)
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  let best = Infinity
  let hit = null
  for (const b of g.balls) {
    if (b.id === 0 || b.potted) continue
    const fx = b.x - c.x
    const fy = b.y - c.y
    const t = fx * dx + fy * dy
    if (t <= 0) continue
    const perp2 = fx * fx + fy * fy - t * t
    const rr = 4 * R * R
    if (perp2 > rr) continue
    const d = t - Math.sqrt(rr - perp2)
    if (d < best) ((best = d), (hit = b))
  }
  // rails
  const tx = dx > 0 ? (W - R - c.x) / dx : dx < 0 ? (R - c.x) / dx : Infinity
  const ty = dy > 0 ? (H - R - c.y) / dy : dy < 0 ? (R - c.y) / dy : Infinity
  const rail = Math.min(tx, ty)
  if (rail < best) return { x: c.x + dx * rail, y: c.y + dy * rail, ball: null }
  const gx = c.x + dx * best
  const gy = c.y + dy * best
  return { x: gx, y: gy, ball: hit, nx: (hit.x - gx) / (2 * R), ny: (hit.y - gy) / (2 * R) }
}
