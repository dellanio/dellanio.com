import * as THREE from 'three'
import { PROJECTS, projectLang } from '../content'
import { getLang, onLang, tr } from '../i18n'

// All surfaces are painted on canvases so the prototype needs no image assets.

function seeded(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(repeat[0], repeat[1])
  }
  return tex
}

const cache = new Map()
function cached(key, make) {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key)
}

function star(g, cx, cy, R, r, color) {
  g.beginPath()
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 - Math.PI / 2
    const rad = k % 2 === 0 ? R : r
    g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
  }
  g.closePath()
  g.fillStyle = color
  g.fill()
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

// Ladrilho hidráulico: 2x2 tiles per texture, alternating terracotta/teal.
export const floorTexture = () =>
  cached('floor', () =>
    canvasTexture(
      512,
      512,
      (g, w) => {
        const s = w / 2
        const colors = [
          ['#c8553d', '#2f6f6a'],
          ['#2f6f6a', '#c8553d'],
        ]
        for (let j = 0; j < 2; j++)
          for (let i = 0; i < 2; i++) {
            const x = i * s
            const y = j * s
            g.fillStyle = '#efe3cc'
            g.fillRect(x, y, s, s)
            g.fillStyle = colors[j][i]
            g.beginPath()
            g.moveTo(x + s / 2, y + 10)
            g.lineTo(x + s - 10, y + s / 2)
            g.lineTo(x + s / 2, y + s - 10)
            g.lineTo(x + 10, y + s / 2)
            g.closePath()
            g.fill()
            star(g, x + s / 2, y + s / 2, s * 0.36, s * 0.1, '#efe3cc')
            star(g, x + s / 2, y + s / 2, s * 0.12, s * 0.04, colors[j][i])
            for (const [cx, cy] of [
              [x, y],
              [x + s, y],
              [x, y + s],
              [x + s, y + s],
            ])
              star(g, cx, cy, s * 0.16, s * 0.05, '#1f3b4d')
            g.strokeStyle = 'rgba(120,100,80,0.35)'
            g.lineWidth = 3
            g.strokeRect(x, y, s, s)
          }
      },
      [6, 6],
    ),
  )

const wallTileCanvas = () =>
  cached('wallTileCanvas', () => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    g.fillStyle = '#c9c6bb'
    g.fillRect(0, 0, 128, 128)
    const grad = g.createLinearGradient(0, 0, 128, 128)
    grad.addColorStop(0, '#f4f3ee')
    grad.addColorStop(1, '#e3e1d8')
    g.fillStyle = grad
    g.fillRect(3, 3, 122, 122)
    return c
  })

// White wall tiles, ~25cm each. Tile strips carry UVs in metres along the
// wall, so the repeat is per metre and every strip shares one grid.
export function wallTileTexture() {
  return cached('wallTile', () => {
    const tex = new THREE.CanvasTexture(wallTileCanvas())
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1 / 0.25, 1 / 0.25)
    return tex
  })
}

// Day: freshly painted, smooth wall in the same warm tone, with only the
// faintest roller texture so it doesn't read as flat plastic.
export const paintTexture = () =>
  cached('paint', () =>
    canvasTexture(
      256,
      256,
      (g, w, h) => {
        const rnd = seeded(19)
        g.fillStyle = '#efd8a4'
        g.fillRect(0, 0, w, h)
        const img = g.getImageData(0, 0, w, h)
        for (let i = 0; i < img.data.length; i += 4) {
          const n = (rnd() - 0.5) * 6
          img.data[i] += n
          img.data[i + 1] += n
          img.data[i + 2] += n
        }
        g.putImageData(img, 0, 0)
      },
      [6, 2],
    ),
  )

// Pencil sketches pinned on the office pegboard: a colonial facade with a
// central tower ('facade') or a small church ('church'), on off-white paper.
export function sketchTexture(kind) {
  return cached('sketch-' + kind, () =>
    canvasTexture(kind === 'facade' ? 640 : 400, kind === 'facade' ? 500 : 480, (g, w, h) => {
      const rnd = seeded(kind === 'facade' ? 3 : 8)
      g.fillStyle = '#f4f0e6'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = 'rgba(40,36,32,0.85)'
      g.lineCap = 'round'
      const line = (x1, y1, x2, y2, lw = 2) => {
        g.lineWidth = lw
        g.beginPath()
        // a little wobble, like a hand-drawn line
        g.moveTo(x1 + (rnd() - 0.5) * 1.5, y1 + (rnd() - 0.5) * 1.5)
        g.lineTo(x2 + (rnd() - 0.5) * 1.5, y2 + (rnd() - 0.5) * 1.5)
        g.stroke()
      }
      const rect = (x, y, rw, rh, lw) => {
        line(x, y, x + rw, y, lw)
        line(x + rw, y, x + rw, y + rh, lw)
        line(x + rw, y + rh, x, y + rh, lw)
        line(x, y + rh, x, y, lw)
      }
      const arch = (x, y, rw, rh) => {
        g.lineWidth = 1.6
        g.beginPath()
        g.moveTo(x, y + rh)
        g.lineTo(x, y + rw / 2)
        g.arc(x + rw / 2, y + rw / 2, rw / 2, Math.PI, 0)
        g.lineTo(x + rw, y + rh)
        g.stroke()
      }
      if (kind === 'facade') {
        const base = h * 0.86
        line(w * 0.06, base, w * 0.94, base, 2.5)
        rect(w * 0.12, h * 0.38, w * 0.76, base - h * 0.38, 2.2)
        rect(w * 0.4, h * 0.16, w * 0.2, h * 0.22, 2)
        line(w * 0.38, h * 0.16, w * 0.5, h * 0.07, 2)
        line(w * 0.5, h * 0.07, w * 0.62, h * 0.16, 2)
        arch(w * 0.46, h * 0.2, w * 0.08, h * 0.12)
        line(w * 0.1, h * 0.38, w * 0.9, h * 0.38, 3)
        line(w * 0.12, h * 0.6, w * 0.88, h * 0.6, 1.5)
        for (let i = 0; i < 6; i++) {
          const x = w * (0.16 + i * 0.12)
          arch(x, h * 0.43, w * 0.06, h * 0.13)
          arch(x, h * 0.65, w * 0.06, h * 0.16)
        }
        // hatching for shade under the cornice
        for (let x = w * 0.13; x < w * 0.87; x += 6) line(x, h * 0.385, x + 5, h * 0.41, 0.8)
        g.fillStyle = 'rgba(40,36,32,0.55)'
        g.font = 'italic 20px Georgia, serif'
        g.fillText('Recife Antigo', w * 0.08, h * 0.95)
      } else {
        const base = h * 0.84
        line(w * 0.08, base, w * 0.92, base, 2.2)
        rect(w * 0.22, h * 0.45, w * 0.56, base - h * 0.45, 2)
        line(w * 0.2, h * 0.45, w * 0.5, h * 0.3, 2)
        line(w * 0.5, h * 0.3, w * 0.8, h * 0.45, 2)
        rect(w * 0.42, h * 0.14, w * 0.16, h * 0.18, 2)
        line(w * 0.5, h * 0.04, w * 0.5, h * 0.12, 2)
        line(w * 0.46, h * 0.07, w * 0.54, h * 0.07, 2)
        arch(w * 0.44, h * 0.62, w * 0.12, h * 0.22)
        arch(w * 0.28, h * 0.52, w * 0.07, h * 0.12)
        arch(w * 0.65, h * 0.52, w * 0.07, h * 0.12)
      }
    }),
  )
}

// Spiral notebook cover: kraft card with an embossed label.
export const notebookTexture = () =>
  cached('notebook', () =>
    canvasTexture(256, 340, (g, w, h) => {
      const rnd = seeded(5)
      g.fillStyle = '#b8936a'
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 900; i++) {
        g.fillStyle = rnd() > 0.5 ? `rgba(90,60,30,${rnd() * 0.12})` : `rgba(230,200,160,${rnd() * 0.12})`
        g.fillRect(rnd() * w, rnd() * h, 2, 2)
      }
      g.strokeStyle = 'rgba(70,45,20,0.5)'
      g.lineWidth = 2
      g.strokeRect(w * 0.25, h * 0.16, w * 0.6, h * 0.12)
    }),
  )

// Pool-table baize: a fine, even nap with no direction, so the cloth reads as
// felt rather than as a woven or scratched surface.
export const baizeTexture = () =>
  cached('baize', () =>
    canvasTexture(
      256,
      256,
      (g, w, h) => {
        const rnd = seeded(31)
        g.fillStyle = '#ffffff'
        g.fillRect(0, 0, w, h)
        const img = g.getImageData(0, 0, w, h)
        for (let i = 0; i < img.data.length; i += 4) {
          const n = 236 + (rnd() - 0.5) * 22
          img.data[i] = img.data[i + 1] = img.data[i + 2] = n
        }
        g.putImageData(img, 0, 0)
      },
      [8, 8],
    ),
  )

// Boteco wall tiles: the aged white star-tile atlas (4 x 4 tiles per image).
// The boteco tile atlas covers 0.9 m of wall; UVs are in metres (see above).
export function botecoTileTexture() {
  return cached('botecoTile', () => {
    const t = new THREE.TextureLoader().load('/textures/boteco_tiles.jpg')
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 8
    t.repeat.set(1 / 0.9, 1 / 0.9)
    return t
  })
}

// Canvas textures with words on them redraw when the site language changes
// (glTF screen copies listen for 'repaint').
function translated(tex, draw) {
  onLang(() => {
    draw(tex.image.getContext('2d'), tex.image.width, tex.image.height)
    tex.needsUpdate = true
    tex.dispatchEvent({ type: 'repaint' })
  })
  return tex
}

// Tablet on the sideboard: a dark dashboard with an AI-agent network graph,
// a usage chart and the contact call to action.
export const tabletTexture = () => cached('tablet', () => translated(canvasTexture(640, 440, drawTablet), drawTablet))

function drawTablet(g, w, h) {
  const rnd = seeded(13)
  g.fillStyle = '#0b1220'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#e2e8f0'
  g.font = '600 22px "Space Grotesk", "Segoe UI", sans-serif'
  g.fillText(tr('Vamos conversar?', "Let's talk"), 24, 38)
  g.fillStyle = '#7dd3fc'
  g.font = '500 14px "Space Grotesk", "Segoe UI", sans-serif'
  g.fillText(tr('agentes · dados · pessoas', 'agents · data · people'), 24, 60)
  // network graph
  const nodes = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + rnd() * 0.3
    const r = i === 0 ? 0 : 60 + rnd() * 70
    return [200 + Math.cos(a) * r, 250 + Math.sin(a) * r * 0.85]
  })
  g.strokeStyle = 'rgba(56,189,248,0.35)'
  g.lineWidth = 1.5
  for (let i = 1; i < nodes.length; i++) {
    g.beginPath()
    g.moveTo(...nodes[0])
    g.lineTo(...nodes[i])
    g.stroke()
    const j = 1 + Math.floor(rnd() * 15)
    g.beginPath()
    g.moveTo(...nodes[i])
    g.lineTo(...nodes[j])
    g.stroke()
  }
  nodes.forEach(([x, y], i) => {
    g.fillStyle = i === 0 ? '#38bdf8' : i % 3 ? '#2563eb' : '#a5f3fc'
    g.beginPath()
    g.arc(x, y, i === 0 ? 10 : 5, 0, Math.PI * 2)
    g.fill()
  })
  // usage bars and a sparkline
  g.fillStyle = '#111b2e'
  g.fillRect(400, 90, 216, 150)
  g.fillRect(400, 256, 216, 160)
  for (let i = 0; i < 9; i++) {
    const bh = 30 + rnd() * 90
    g.fillStyle = i % 2 ? '#38bdf8' : '#2563eb'
    g.fillRect(414 + i * 22, 228 - bh, 14, bh)
  }
  g.strokeStyle = '#7dd3fc'
  g.lineWidth = 3
  g.beginPath()
  for (let i = 0; i <= 10; i++) g.lineTo(412 + i * 19, 380 - (Math.sin(i * 0.8) * 30 + i * 6))
  g.stroke()
  g.fillStyle = '#94a3b8'
  g.font = '500 13px "Space Grotesk", "Segoe UI", sans-serif'
  g.fillText('LinkedIn · WhatsApp · GitHub', 412, 404)
}

export const plasterTexture = () =>
  cached('plaster', () =>
    canvasTexture(
      512,
      512,
      (g, w, h) => {
        const rnd = seeded(7)
        g.fillStyle = '#f0d699'
        g.fillRect(0, 0, w, h)
        for (let i = 0; i < 260; i++) {
          const light = rnd() > 0.5
          g.fillStyle = light ? 'rgba(255,240,200,0.06)' : 'rgba(120,80,30,0.05)'
          g.beginPath()
          g.arc(rnd() * w, rnd() * h, 10 + rnd() * 60, 0, Math.PI * 2)
          g.fill()
        }
        // grime band just above the tiles (the tile top sits ~58% down this texture)
        const grime = g.createLinearGradient(0, h * 0.42, 0, h * 0.6)
        grime.addColorStop(0, 'rgba(90,60,25,0)')
        grime.addColorStop(1, 'rgba(90,60,25,0.22)')
        g.fillStyle = grime
        g.fillRect(0, h * 0.42, w, h * 0.18)
        // peeled patches showing the grey render underneath
        for (let i = 0; i < 9; i++) {
          const cx = rnd() * w
          const cy = h * (0.5 + rnd() * 0.08) - (rnd() > 0.7 ? rnd() * h * 0.35 : 0)
          const rx = 14 + rnd() * 40
          const ry = 6 + rnd() * 16
          g.beginPath()
          for (let k = 0; k < 14; k++) {
            const a = (k / 14) * Math.PI * 2
            const j = 0.7 + rnd() * 0.5
            g.lineTo(cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j)
          }
          g.closePath()
          g.fillStyle = 'rgba(176,168,150,0.85)'
          g.fill()
          g.strokeStyle = 'rgba(110,80,40,0.5)'
          g.lineWidth = 2
          g.stroke()
        }
        // faint water streaks running down
        for (let i = 0; i < 18; i++) {
          const x = rnd() * w
          const len = 40 + rnd() * 140
          const y0 = rnd() * h * 0.4
          const s = g.createLinearGradient(0, y0, 0, y0 + len)
          s.addColorStop(0, 'rgba(110,80,40,0.08)')
          s.addColorStop(1, 'rgba(110,80,40,0)')
          g.fillStyle = s
          g.fillRect(x, y0, 3 + rnd() * 6, len)
        }
      },
      [3, 1],
    ),
  )

export function signTexture(text, { bg, fg, border, font = 'bold 120px Georgia, serif' }) {
  return cached(`sign:${text}`, () =>
    canvasTexture(1024, 288, (g, w, h) => {
      g.fillStyle = bg
      g.fillRect(0, 0, w, h)
      g.strokeStyle = border
      g.lineWidth = 22
      g.strokeRect(24, 24, w - 48, h - 48)
      g.fillStyle = fg
      g.font = font
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(text, w / 2, h / 2 + 6)
    }),
  )
}

// Monitor: the résumé (same content as dellanio.com, full text in the HTML panel).
// Name in Oxanium, text in Space Grotesk, accents in the site's blue gradient.
const NAME_FONT = '"Oxanium", "Segoe UI", sans-serif'
const TEXT_FONT = '"Space Grotesk", "Segoe UI", sans-serif'
const BLUE = '#1d4ed8'
function blueGradient(g, x0, y0, x1, y1) {
  const grad = g.createLinearGradient(x0, y0, x1, y1)
  grad.addColorStop(0, '#1e3a8a')
  grad.addColorStop(0.55, '#2563eb')
  grad.addColorStop(1, '#38bdf8')
  return grad
}

// Portrait on the right of the résumé, cropped to fill its frame.
const CV_PHOTO = { x: 727, y: 192, w: 200, h: 262, src: '/textures/dellanio.webp' }
let cvPhoto = null

function drawCV(g, w, h) {
  g.fillStyle = '#fbfaf7'
  g.fillRect(0, 0, w, h)
  g.fillStyle = blueGradient(g, 0, 0, w, 0)
  g.fillRect(0, 0, w, 10)
  g.fillStyle = '#141a26'
  g.font = `700 52px ${NAME_FONT}`
  g.fillText('Dellanio Alencar', 50, 84)
  g.fillStyle = BLUE
  g.font = `600 25px ${TEXT_FONT}`
  g.fillText(tr('ENGENHARIA DE SOFTWARE & IA', 'SOFTWARE ENGINEERING & AI'), 52, 122)
  g.fillStyle = '#6b7280'
  g.font = `400 22px ${TEXT_FONT}`
  g.fillText(tr('Da arquitetura à inteligência artificial em produção.', 'From architecture to artificial intelligence in production.'), 52, 157)
  // two columns of bullets; each line is sized to stay clear of the portrait
  const col = (x, title, lines, maxWidth) => {
    g.fillStyle = BLUE
    g.font = `700 19px ${TEXT_FONT}`
    g.fillText(title, x, 222)
    g.font = `400 16px ${TEXT_FONT}`
    lines.forEach((l, i) => {
      g.fillStyle = '#2563eb'
      g.beginPath()
      g.arc(x + 4, 251 + i * 34, 3, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#333'
      g.fillText(l, x + 16, 257 + i * 34, maxWidth) // squeezed slightly if it would run long
    })
  }
  const en = getLang() === 'en'
  col(52, en ? 'AI FOCUS' : 'ATUAÇÃO EM IA', en ? [
    'Generative AI applied to business',
    'Agents and process automation',
    'Orchestrating agents and tools',
    'Integrating AI into enterprise systems',
    'Engineering, quality and human oversight',
  ] : [
    'IA generativa aplicada a negócios',
    'Agentes e automação de processos',
    'Orquestração de agentes e ferramentas',
    'Integração de IA a sistemas corporativos',
    'Engenharia, qualidade e supervisão humana',
  ], 314)
  col(392, en ? 'TECHNOLOGIES & CONCEPTS' : 'TECNOLOGIAS E CONCEITOS', en ? [
    'LLMs · Context engineering',
    'RAG · Semantic search',
    'OpenAI · Amazon Bedrock',
    'LangChain · APIs · Cloud',
    'Evaluation · Security · Observability',
  ] : [
    'LLMs · Engenharia de contexto',
    'RAG · Busca semântica',
    'OpenAI · Amazon Bedrock',
    'LangChain · APIs · Cloud',
    'Avaliação · Segurança · Observabilidade',
  ], 306)
  g.fillStyle = blueGradient(g, 692, 470, 962, 530)
  roundRect(g, 692, 470, 270, 60, 30)
  g.fill()
  g.fillStyle = '#fff'
  g.font = `600 22px ${TEXT_FONT}`
  g.fillText('dellanio.com  ↗', 742, 508)
  const { x, y, w: pw, h: ph } = CV_PHOTO
  g.save()
  roundRect(g, x, y, pw, ph, 18)
  g.clip()
  if (cvPhoto) {
    const s = Math.max(pw / cvPhoto.width, ph / cvPhoto.height)
    const sw = pw / s
    const sh = ph / s
    g.drawImage(cvPhoto, (cvPhoto.width - sw) / 2, (cvPhoto.height - sh) * 0.15, sw, sh, x, y, pw, ph)
  } else {
    g.fillStyle = '#ece8e1'
    g.fillRect(x, y, pw, ph)
  }
  g.restore()
}

// Repainted when the portrait and the web fonts arrive. Copies made from this
// texture (glTF screens) listen for 'repaint' to refresh too.
export const cvTexture = () =>
  cached('cv', () => {
    const tex = canvasTexture(1024, 600, drawCV)
    const repaint = () => {
      drawCV(tex.image.getContext('2d'), 1024, 600)
      tex.needsUpdate = true
      tex.dispatchEvent({ type: 'repaint' })
    }
    const img = new Image()
    img.onload = () => {
      cvPhoto = img
      repaint()
    }
    img.src = CV_PHOTO.src
    document.fonts?.load(`700 52px ${NAME_FONT}`).then(() => document.fonts.load(`400 18px ${TEXT_FONT}`)).then(repaint)
    onLang(repaint)
    return tex
  })

// Office wall sign, after the reference: warm cream board, "Dellanio" in bold
// Oxanium bottle green, and a letter-spaced line of what he does underneath.
function drawWallSign(g, w, h) {
  const rnd = seeded(23)
  g.fillStyle = '#ece6d6'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = rnd() > 0.5 ? `rgba(255,255,250,${rnd() * 0.08})` : `rgba(120,100,70,${rnd() * 0.05})`
    g.fillRect(rnd() * w, rnd() * h, 2, 2)
  }
  g.fillStyle = '#1d4a35'
  g.textAlign = 'center'
  g.textBaseline = 'alphabetic'
  g.font = `700 262px ${NAME_FONT}`
  g.fillText('Dellanio', w / 2, h * 0.6)
  g.font = `700 86px ${TEXT_FONT}`
  if ('letterSpacing' in g) g.letterSpacing = '6px'
  g.fillText(tr('ENGENHARIA • PRODUTO • IA', 'ENGINEERING • PRODUCT • AI'), w / 2, h * 0.9)
  if ('letterSpacing' in g) g.letterSpacing = '0px'
}

export const wallSignTexture = () =>
  cached('wall-sign', () => {
    const tex = canvasTexture(1600, 400, drawWallSign)
    document.fonts?.load(`700 262px ${NAME_FONT}`).then(() => document.fonts.load(`700 86px ${TEXT_FONT}`)).then(() => {
      drawWallSign(tex.image.getContext('2d'), 1600, 400)
      tex.needsUpdate = true
    })
    return translated(tex, drawWallSign)
  })

const LANG_COLORS = { TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572a5', 'C#': '#178600', AI: '#4fd89a' }

// Real screenshots for some cards: the part of the image (x, y, w, h) shown in
// the card's picture slot, over a background colour for letterboxed crops.
const SHOTS = {
  'tech-woman': { src: '/textures/portfolio/tech-woman.png', crop: [50, 228, 480, 486] },
  'memory-bridge': { src: '/textures/portfolio/memory-bridge.png', crop: [14, 10, 112, 112], bg: '#efeaff', pad: 26 },
  cmdwatch: { src: '/textures/portfolio/cmdwatch.png', crop: [0, 0, 340, 344] },
  'f2a-academy': { src: '/textures/portfolio/f2a-academy.webp', crop: [14, 22, 610, 618] },
}
const shotImages = {}

function drawShot(g, shot, img, x, y, w, h) {
  const pad = shot.pad || 0
  g.fillStyle = shot.bg || '#fff'
  g.fillRect(x, y, w, h)
  const [sx, sy, sw, sh] = shot.crop
  const s = Math.min((w - pad * 2) / sw, (h - pad * 2) / sh)
  const dw = sw * s
  const dh = sh * s
  g.drawImage(img, sx, sy, sw, sh, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

// Portfolio board: dark pinboard with the pinned GitHub projects. Repainted as
// each screenshot arrives.
export const portfolioTexture = () =>
  cached('portfolio', () => {
    const tex = canvasTexture(1280, 640, drawPortfolio)
    for (const [name, shot] of Object.entries(SHOTS)) {
      const img = new Image()
      img.onload = () => {
        shotImages[name] = img
        drawPortfolio(tex.image.getContext('2d'), 1280, 640)
        tex.needsUpdate = true
      }
      img.src = shot.src
    }
    return translated(tex, drawPortfolio)
  })

function drawPortfolio(g, w, h) {
  g.textAlign = 'left'
  g.fillStyle = '#22303f'
  g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(255,255,255,0.05)'
  for (let y = 20; y < h; y += 28) for (let x = 20; x < w; x += 28) g.fillRect(x, y, 4, 4)
  g.fillStyle = '#f4ead8'
  g.font = '600 40px Segoe UI, sans-serif'
  g.fillText(tr('P O R T F Ó L I O', 'P O R T F O L I O'), 50, 72)
  g.fillStyle = 'rgba(244,234,216,0.6)'
  g.font = '22px Segoe UI, sans-serif'
  g.fillText('github.com/dellanio', w - 260, 70)
  const cw = 182
  const gap = (w - 100 - cw * 6) / 5
  const pins = ['#2563eb', '#5fa8d3', '#b06cff', '#f6a04d', '#5fd39b', '#f2c14e']
  PROJECTS.forEach((p, i) => {
    const x = 50 + i * (cw + gap)
    const y = 130 + (i % 2) * 24
    g.save()
    g.translate(x + cw / 2, y)
    g.rotate((i % 2 ? 1 : -1) * 0.02)
    g.fillStyle = 'rgba(0,0,0,0.35)'
    g.fillRect(-cw / 2 + 8, 8, cw, 420)
    g.fillStyle = '#f7f1e6'
    g.fillRect(-cw / 2, 0, cw, 420)
    // "screenshot" block in the language colour
    const lc = LANG_COLORS[p.lang] || '#888'
    if (shotImages[p.name]) {
      drawShot(g, SHOTS[p.name], shotImages[p.name], -cw / 2 + 12, 16, cw - 24, 160)
      g.strokeStyle = 'rgba(0,0,0,0.12)'
      g.lineWidth = 1
      g.strokeRect(-cw / 2 + 12.5, 16.5, cw - 25, 159)
    } else {
      const grad = g.createLinearGradient(0, 16, 0, 176)
      grad.addColorStop(0, lc)
      grad.addColorStop(1, '#1d2633')
      g.fillStyle = grad
      g.fillRect(-cw / 2 + 12, 16, cw - 24, 160)
      g.fillStyle = 'rgba(255,255,255,0.9)'
      g.font = 'bold 44px Segoe UI, sans-serif'
      g.textAlign = 'center'
      g.fillText('</>', 0, 112)
      g.textAlign = 'left'
    }
    g.fillStyle = '#2a2a2a'
    g.font = `bold ${p.name.length > 14 ? 15 : 19}px Segoe UI, sans-serif`
    g.fillText(p.name, -cw / 2 + 12, 212)
    g.fillStyle = lc
    g.beginPath()
    g.arc(-cw / 2 + 18, 236, 6, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#666'
    g.font = '15px Segoe UI, sans-serif'
    g.fillText(projectLang(p, getLang()), -cw / 2 + 30, 241)
    // wrap the description
    g.fillStyle = '#555'
    g.font = '15px Segoe UI, sans-serif'
    let line = ''
    let ly = 274
    for (const word of p.desc[getLang()].split(' ')) {
      const test = line ? `${line} ${word}` : word
      if (g.measureText(test).width > cw - 24) {
        g.fillText(line, -cw / 2 + 12, ly)
        line = word
        ly += 21
        if (ly > 400) break
      } else line = test
    }
    if (ly <= 400) g.fillText(line, -cw / 2 + 12, ly)
    g.fillStyle = pins[i]
    g.beginPath()
    g.arc(0, -4, 11, 0, Math.PI * 2)
    g.fill()
    g.restore()
  })
}

export const dashboardTexture = () =>
  cached('dashboard', () =>
    canvasTexture(640, 380, (g, w, h) => {
      g.fillStyle = '#14161c'
      g.fillRect(0, 0, w, h)
      const cols = ['#2563eb', '#5fa8d3', '#f2c14e', '#81b29a']
      const rnd = seeded(3)
      for (let p = 0; p < 3; p++) {
        const x0 = 24 + p * 205
        g.fillStyle = '#1f222b'
        g.fillRect(x0, 24, 190, 150)
        for (let i = 0; i < 8; i++) {
          g.fillStyle = cols[(i + p) % 4]
          const bh = 20 + rnd() * 100
          g.fillRect(x0 + 14 + i * 21, 160 - bh, 14, bh)
        }
      }
      g.fillStyle = '#1f222b'
      g.fillRect(24, 194, 190, 162)
      g.lineWidth = 22
      ;[0.45, 0.3, 0.25].reduce((start, part, i) => {
        g.strokeStyle = cols[i]
        g.beginPath()
        g.arc(119, 275, 52, start, start + part * Math.PI * 2)
        g.stroke()
        return start + part * Math.PI * 2
      }, -Math.PI / 2)
      g.fillStyle = '#1f222b'
      g.fillRect(229, 194, 395, 162)
      g.strokeStyle = '#38bdf8'
      g.lineWidth = 4
      g.beginPath()
      for (let i = 0; i <= 12; i++) g.lineTo(245 + i * 30, 330 - (40 + Math.sin(i * 0.9) * 30 + i * 6))
      g.stroke()
    }),
  )

export const calendarTexture = () =>
  cached('calendar', () =>
    canvasTexture(256, 340, (g, w, h) => {
      g.fillStyle = '#fbfaf5'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#3f7d3a'
      g.fillRect(0, 0, w, 120)
      g.fillStyle = '#fff'
      g.font = 'bold 30px Segoe UI, sans-serif'
      g.textAlign = 'center'
      g.fillText('RECIFE', w / 2, 70)
      g.fillStyle = '#c8553d'
      g.font = 'bold 20px Segoe UI, sans-serif'
      g.fillText('OUTUBRO', w / 2, 150)
      g.font = '15px Segoe UI, sans-serif'
      for (let d = 0; d < 31; d++) {
        g.fillStyle = d % 7 === 0 ? '#c8553d' : '#444'
        g.fillText(String(d + 1), 30 + (d % 7) * 32, 185 + Math.floor(d / 7) * 30)
      }
    }),
  )

// Chalkboard menu, as written in the boteco photo.
// Boteco menu board, after the reference: hand-lettered title with an underline,
// three items with their prices, a beer mug doodle on the right, and the cloudy
// residue of years of wiping. Repainted once the handwriting font has loaded.
const CHALK_FONT = '"Patrick Hand", "Segoe Print", "Comic Sans MS", cursive'
function drawChalkboard(g, w, h) {
  const rnd = seeded(11)
  g.globalCompositeOperation = 'source-over'
  g.fillStyle = '#252a27'
  g.fillRect(0, 0, w, h)
  // eraser clouds and swipes
  for (let i = 0; i < 40; i++) {
    const x = rnd() * w
    const y = rnd() * h
    const r = 80 + rnd() * 220
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, `rgba(235,235,225,${0.03 + rnd() * 0.05})`)
    grad.addColorStop(1, 'rgba(235,235,225,0)')
    g.fillStyle = grad
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(255,255,255,${rnd() * 0.035})`
    g.fillRect(rnd() * w, rnd() * h, 40 + rnd() * 160, 3 + rnd() * 10)
  }
  const ink = 'rgba(244,240,230,0.94)'
  g.fillStyle = ink
  g.strokeStyle = ink
  g.textBaseline = 'alphabetic'
  // title and its hand-drawn underline
  g.textAlign = 'center'
  g.font = `160px ${CHALK_FONT}`
  g.fillText('PORÇÕES', w * 0.46, h * 0.2)
  g.lineWidth = 6
  g.lineCap = 'round'
  g.beginPath()
  for (let x = w * 0.2; x <= w * 0.73; x += 10) g.lineTo(x, h * 0.245 + Math.sin(x * 0.02) * 2.5)
  g.stroke()
  // items
  g.font = `104px ${CHALK_FONT}`
  ;[
    ['Pastel', 'R$ 8', 0.69, 0.45],
    ['Torresmo', 'R$ 12', 0.69, 0.63],
    ['Cerveja gelada', 'R$ 6', 0.82, 0.81],
  ].forEach(([name, price, px, y]) => {
    g.textAlign = 'left'
    g.fillText(name, w * 0.075, h * y)
    g.textAlign = 'right'
    g.fillText(price, w * px, h * y)
  })
  // beer mug doodle: body, glass ribs, foam and handle
  const mx = w * 0.8
  const my = h * 0.33
  const mw = w * 0.11
  const mh = h * 0.17
  g.lineWidth = 7
  g.beginPath()
  g.roundRect(mx, my, mw, mh, 10)
  g.stroke()
  for (let k = 1; k < 4; k++) {
    g.beginPath()
    g.moveTo(mx + (mw * k) / 4, my + mh * 0.18)
    g.lineTo(mx + (mw * k) / 4, my + mh * 0.88)
    g.stroke()
  }
  g.beginPath()
  g.arc(mx + mw, my + mh * 0.5, mh * 0.26, -Math.PI / 2, Math.PI / 2)
  g.stroke()
  g.beginPath()
  for (let k = 0; k <= 4; k++) g.arc(mx + (mw * k) / 4, my - 4, mw * 0.13, Math.PI, 0)
  g.stroke()
  // chalk grain: knock tiny specks out of the lettering
  g.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(0,0,0,${0.25 + rnd() * 0.5})`
    g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5)
  }
  g.globalCompositeOperation = 'destination-over'
  g.fillStyle = '#252a27'
  g.fillRect(0, 0, w, h)
  g.globalCompositeOperation = 'source-over'
}

export const chalkTexture = () =>
  cached('chalk', () => {
    const tex = canvasTexture(1200, 1000, drawChalkboard)
    document.fonts?.load(`104px ${CHALK_FONT}`).then(() => {
      drawChalkboard(tex.image.getContext('2d'), 1200, 1000)
      tex.needsUpdate = true
    })
    return tex
  })

// Calendar with a photo (the boteco's calendar sits where the window is by day).
export const posterTexture = () =>
  cached('poster', () =>
    canvasTexture(512, 680, (g, w, h) => {
      g.fillStyle = '#f8f6ef'
      g.fillRect(0, 0, w, h)
      g.drawImage(cityTexture(false).image, 180, 40, 600, 380, 24, 24, w - 48, 300)
      g.fillStyle = '#b3201c'
      g.font = 'bold 34px Segoe UI, sans-serif'
      g.textAlign = 'center'
      g.fillText('OUTUBRO', w / 2, 380)
      g.font = '24px Segoe UI, sans-serif'
      for (let d = 0; d < 31; d++) {
        g.fillStyle = d % 7 === 0 ? '#b3201c' : '#333'
        g.fillText(String(d + 1), 60 + (d % 7) * 65, 430 + Math.floor(d / 7) * 50)
      }
    }),
  )

// Brand stencil on a beer crate.
export function crateLabel(text, color) {
  return cached(`crate:${text}`, () =>
    canvasTexture(384, 108, (g, w, h) => {
      g.fillStyle = color
      g.fillRect(0, 0, w, h)
      g.fillStyle = color === '#e8b923' ? '#c0201c' : '#f7f1e3' // red lettering on the yellow crate
      g.font = `bold ${text.length > 8 ? 46 : 58}px Arial Black, Arial, sans-serif`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(text, w / 2, h / 2 + 4)
    }),
  )
}

export const soccerTexture = () =>
  cached('soccer', () =>
    canvasTexture(640, 400, (g, w, h) => {
      for (let i = 0; i < 10; i++) {
        g.fillStyle = i % 2 ? '#2f8f3e' : '#37a148'
        g.fillRect((i * w) / 10, 0, w / 10, h)
      }
      g.strokeStyle = 'rgba(255,255,255,0.85)'
      g.lineWidth = 4
      g.strokeRect(20, 30, w - 40, h - 60)
      g.beginPath()
      g.moveTo(w / 2, 30)
      g.lineTo(w / 2, h - 30)
      g.stroke()
      g.beginPath()
      g.arc(w / 2, h / 2, 50, 0, Math.PI * 2)
      g.stroke()
      const rnd = seeded(9)
      for (let i = 0; i < 16; i++) {
        g.fillStyle = i < 8 ? '#e63946' : '#f1faee'
        g.beginPath()
        g.arc(60 + rnd() * (w - 120), 60 + rnd() * (h - 120), 7, 0, Math.PI * 2)
        g.fill()
      }
      g.fillStyle = 'rgba(0,0,0,0.6)'
      g.fillRect(16, 8, 190, 34)
      g.fillStyle = '#fff'
      g.font = 'bold 22px Segoe UI, sans-serif'
      g.fillText('SPT 2 x 1 NAU', 26, 33)
    }),
  )

// Spotlight gobo: the window's panes, so sunlight lands on the floor as a framed patch.
// Varnished wood for the window shutters and frame: warm brown with long grain
// streaks, darker figure lines and a little sheen variation.
export const woodTexture = () =>
  cached('wood', () =>
    canvasTexture(512, 512, (g, w, h) => {
      const rnd = seeded(41)
      g.fillStyle = '#7a4524'
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 260; i++) {
        const x = rnd() * w
        const dark = rnd() < 0.55
        g.strokeStyle = dark ? `rgba(48,22,8,${0.12 + rnd() * 0.25})` : `rgba(176,110,62,${0.08 + rnd() * 0.18})`
        g.lineWidth = 0.6 + rnd() * 2.6
        g.beginPath()
        g.moveTo(x, 0)
        const wob = 2 + rnd() * 6
        const f = 0.004 + rnd() * 0.01
        for (let y = 0; y <= h; y += 8) g.lineTo(x + Math.sin(y * f + i) * wob, y)
        g.stroke()
      }
      // a few knots' flame figure
      for (let k = 0; k < 4; k++) {
        const cx = rnd() * w
        const cy = rnd() * h
        for (let r = 4; r < 40; r += 3) {
          g.strokeStyle = `rgba(52,24,10,${0.25 - r / 200})`
          g.lineWidth = 1
          g.beginPath()
          g.ellipse(cx, cy, r * 0.35, r, 0, 0, Math.PI * 2)
          g.stroke()
        }
      }
    }, [1, 1]),
  )

export const windowGoboTexture = () =>
  cached('gobo', () =>
    canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = '#000'
      g.fillRect(0, 0, w, h)
      g.filter = 'blur(4px)'
      g.fillStyle = '#fff'
      const x = w * 0.16
      const y = h * 0.24
      const pw = w * 0.68
      const ph = h * 0.52
      g.fillRect(x, y, pw, ph)
      g.fillStyle = '#000'
      g.fillRect(x + pw / 2 - 12, y, 24, ph)
      g.fillRect(x, y + ph / 2 - 10, pw, 20)
      g.filter = 'none'
    }),
  )

// ---- robot office (day) ----

// Dark wood in a chevron/herringbone pattern.
export const herringboneTexture = () =>
  cached('herringbone', () =>
    canvasTexture(
      512,
      512,
      (g, w, h) => {
        const rnd = seeded(21)
        const C = 64
        const P = 32
        g.fillStyle = '#120d0a'
        g.fillRect(0, 0, w, h)
        for (let c = 0; c < w / C; c++) {
          const s = c % 2 ? 1 : -1
          const x0 = c * C
          for (let r = -3; r < h / P + 3; r++) {
            const y = r * P + (s > 0 ? 0 : C / 2)
            const tone = 28 + rnd() * 26
            g.fillStyle = `rgb(${tone + 22},${tone + 10},${tone})`
            g.beginPath()
            g.moveTo(x0 + 1, y + 1)
            g.lineTo(x0 + C - 1, y + s * (C / 2) + 1)
            g.lineTo(x0 + C - 1, y + s * (C / 2) + P - 1)
            g.lineTo(x0 + 1, y + P - 1)
            g.closePath()
            g.fill()
            g.fillStyle = 'rgba(255,220,180,0.04)'
            g.fillRect(x0 + 4, y + 6, C - 8, 2)
          }
        }
      },
      [6, 6],
    ),
  )

// Charcoal wall panels with faint vertical seams.
export const darkPanelTexture = () =>
  cached('darkPanel', () =>
    canvasTexture(
      512,
      512,
      (g, w, h) => {
        const rnd = seeded(5)
        g.fillStyle = '#2a2826'
        g.fillRect(0, 0, w, h)
        for (let i = 0; i < 300; i++) {
          g.fillStyle = `rgba(255,255,255,${rnd() * 0.02})`
          g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 30, 2 + rnd() * 30)
        }
        g.fillStyle = 'rgba(0,0,0,0.45)'
        for (let x = 0; x < w; x += 128) g.fillRect(x, 0, 3, h)
        g.fillStyle = 'rgba(255,255,255,0.05)'
        for (let x = 3; x < w; x += 128) g.fillRect(x, 0, 1, h)
      },
      [4, 1],
    ),
  )

// Light grey rug with a double border line.
export const rugTexture = () =>
  cached('rug', () =>
    canvasTexture(1024, 768, (g, w, h) => {
      const rnd = seeded(8)
      g.fillStyle = '#a9a39b'
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 4000; i++) {
        g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${rnd() * 0.05})`
        g.fillRect(rnd() * w, rnd() * h, 2, 2)
      }
      g.strokeStyle = '#3a3633'
      g.lineWidth = 7
      g.strokeRect(48, 48, w - 96, h - 96)
      g.lineWidth = 3
      g.strokeRect(70, 70, w - 140, h - 140)
    }),
  )

// Spine label for the books stacked flat on the shelf.
export function spineTexture(text, bg) {
  return cached(`spine:${text}`, () =>
    canvasTexture(512, 64, (g, w, h) => {
      g.fillStyle = bg
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#efe6d2'
      g.font = '600 34px Georgia, serif'
      g.textBaseline = 'middle'
      g.fillText(text, 24, h / 2 + 2)
    }),
  )
}

// The robot's visor: black glass with two happy pink eyes.
export const robotFaceTexture = () =>
  cached('robotFace', () =>
    canvasTexture(256, 160, (g, w, h) => {
      g.fillStyle = '#07070a'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = '#ff8fd0'
      g.lineWidth = 12
      g.lineCap = 'round'
      for (const x of [86, 170]) {
        g.beginPath()
        g.arc(x, 92, 24, Math.PI * 1.15, Math.PI * 1.85)
        g.stroke()
      }
      g.strokeStyle = 'rgba(255,143,208,0.5)'
      g.lineWidth = 6
      g.beginPath()
      g.arc(128, 104, 14, Math.PI * 0.2, Math.PI * 0.8)
      g.stroke()
    }),
  )

// The view through the window: Recife Antigo by the sea, day or night.
export function cityTexture(night) {
  return cached(`city:${night}`, () =>
    canvasTexture(1024, 512, (g, w, h) => {
      const rnd = seeded(42)
      const sky = g.createLinearGradient(0, 0, 0, h * 0.55)
      if (night) {
        sky.addColorStop(0, '#0a0f24')
        sky.addColorStop(1, '#3a2546')
      } else {
        sky.addColorStop(0, '#7fc0ec')
        sky.addColorStop(1, '#f6e8c4')
      }
      g.fillStyle = sky
      g.fillRect(0, 0, w, h)

      if (night) {
        for (let i = 0; i < 120; i++) {
          g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.6})`
          g.fillRect(rnd() * w, rnd() * h * 0.4, 2, 2)
        }
        g.fillStyle = '#f5ecd0'
        g.beginPath()
        g.arc(w * 0.78, h * 0.14, 26, 0, Math.PI * 2)
        g.fill()
      } else {
        g.fillStyle = 'rgba(255,255,255,0.85)'
        for (const [x, y, s] of [
          [180, 70, 1],
          [620, 50, 1.3],
          [880, 100, 0.8],
        ]) {
          g.beginPath()
          g.ellipse(x, y, 70 * s, 18 * s, 0, 0, Math.PI * 2)
          g.ellipse(x + 40 * s, y - 12 * s, 45 * s, 20 * s, 0, 0, Math.PI * 2)
          g.fill()
        }
      }

      // Sea and the far shore
      const seaTop = h * 0.42
      g.fillStyle = night ? '#141a35' : '#3b8fb3'
      g.fillRect(0, seaTop, w, h * 0.2)
      g.fillStyle = night ? '#1d1830' : '#7aa7a0'
      g.fillRect(0, seaTop - 8, w, 10)
      if (night) {
        g.fillStyle = 'rgba(245,236,208,0.25)'
        for (let i = 0; i < 18; i++) g.fillRect(w * 0.78 - 30 + rnd() * 60, seaTop + 10 + i * 6, 20 + rnd() * 30, 2)
      } else {
        g.fillStyle = 'rgba(255,255,255,0.4)'
        for (let i = 0; i < 40; i++) g.fillRect(rnd() * w, seaTop + 6 + rnd() * h * 0.18, 18, 2)
      }

      // Colonial facades
      const palette = ['#f2c14e', '#e07a5f', '#81b29a', '#f4f1de', '#5fa8d3', '#e5989b', '#f6bd60']
      let x = -20
      while (x < w) {
        const bw = 70 + rnd() * 60
        const bh = 130 + rnd() * 110
        const top = h - bh
        const color = palette[Math.floor(rnd() * palette.length)]
        g.fillStyle = color
        g.fillRect(x, top, bw, bh)
        if (night) {
          g.fillStyle = 'rgba(10,12,40,0.72)'
          g.fillRect(x, top, bw, bh)
        }
        g.fillStyle = night ? '#3a1f1a' : '#b5523b'
        g.fillRect(x - 4, top - 8, bw + 8, 10)
        for (let wy = top + 22; wy < h - 30; wy += 36)
          for (let wx = x + 12; wx < x + bw - 16; wx += 24) {
            const lit = night && rnd() > 0.45
            g.fillStyle = lit ? '#ffd27a' : night ? '#141428' : '#5a4636'
            g.fillRect(wx, wy, 12, 20)
          }
        x += bw + 4
      }

      // Palm trees in front
      for (const px of [120, 470, 820]) {
        g.strokeStyle = night ? '#1a1410' : '#6b4b2a'
        g.lineWidth = 9
        g.beginPath()
        g.moveTo(px, h)
        g.quadraticCurveTo(px + 20, h - 120, px + 6, h - 210)
        g.stroke()
        g.fillStyle = night ? '#0f1a12' : '#3f7d3a'
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2
          g.beginPath()
          g.ellipse(px + 6 + Math.cos(a) * 34, h - 210 + Math.sin(a) * 14, 42, 9, a, 0, Math.PI * 2)
          g.fill()
        }
      }
    }),
  )
}
