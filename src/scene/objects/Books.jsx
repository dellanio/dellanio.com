import React, { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// The "Sobre" bookshelf, after the reference: cloth-bound books in deep green,
// navy, rust, teal, mustard and cream, serif titles running down the spine
// between gilt bands, a small gilt icon at the foot, and two flat stacks.
// Every spine is drawn into one atlas and all books are one merged mesh.

const GOLD = '#d9b872'
const INK = '#3b3024'
const C = {
  green: '#2d4a3b',
  forest: '#24443a',
  moss: '#3d6b4f',
  sage: '#6f8f74',
  pale: '#a9b39a',
  navy: '#1f2b45',
  ink: '#22335a',
  teal: '#2f6f86',
  sea: '#3b7d8a',
  petrol: '#2c5d6b',
  rust: '#b0503a',
  brick: '#a84a35',
  maroon: '#7a2630',
  mustard: '#d29a3a',
  cream: '#e8dcc4',
  paper: '#ece4d2',
}
const LIGHT = new Set([C.cream, C.paper, C.pale, C.mustard])

// [title lines, colour, thickness, height, icon]; null title = plain book.
const SHELVES = [
  {
    y: 1.567,
    items: [
      [['ESTRUTURAS', 'DE DADOS'], C.navy, 0.038, 0.26, 'tree'],
      [['COMPUTAÇÃO', 'EM NUVEM'], C.brick, 0.04, 0.275, 'cloud'],
      [null, C.teal, 0.03, 0.25],
      [['DESIGN UX'], C.sea, 0.036, 0.265, 'square'],
      [['PROGRAMAÇÃO LIMPA'], C.cream, 0.04, 0.265, 'code'],
      [['PROJETO', 'DE SOFTWARE'], C.green, 0.046, 0.262, 'layers'],
      [['PADRÕES', 'DE PROJETO'], C.navy, 0.04, 0.258, 'diamond'],
      [['ARQUITETURA', 'DE DADOS'], C.cream, 0.036, 0.25, 'db'],
      [['SEGURANÇA', 'DA INFORMAÇÃO'], C.moss, 0.03, 0.245, 'lock'],
      [['CIÊNCIA DE DADOS'], C.maroon, 0.038, 0.265, 'bars'],
      [['MACHINE LEARNING'], C.ink, 0.044, 0.275, 'network'],
      [['PRODUTIVIDADE'], C.pale, 0.036, 0.25, 'leaf'],
      [['HUMAN COMPUTER', 'INTERACTION'], C.forest, 0.042, 0.262, 'rings'],
      { gap: 0.02 },
      { stack: [[['FOTOGRAFIA'], C.petrol, 0.36, 0.05, 'photo'], [['ARTE CONTEMPORÂNEA'], C.rust, 0.35, 0.05, 'circle']] },
      { gap: 0.02 },
      [['INOVAÇÃO'], C.mustard, 0.04, 0.265, 'bulb'],
      [['FILOSOFIA', 'DA TECNOLOGIA'], C.teal, 0.045, 0.285, 'globe'],
    ],
  },
  {
    y: 2.067,
    items: [
      [['ARQUITETURA', 'DE SOFTWARE'], C.green, 0.042, 0.27, 'cube'],
      [['SISTEMAS', 'DISTRIBUÍDOS'], C.cream, 0.04, 0.265, 'nodes'],
      [['INTELIGÊNCIA ARTIFICIAL'], C.teal, 0.036, 0.285, 'dots'],
      [['DESIGN DE PRODUTO'], C.rust, 0.04, 0.275, 'triangle'],
      [null, C.cream, 0.024, 0.255],
      [['CÓDIGO & CAFÉ'], C.mustard, 0.034, 0.25, 'cup'],
      [['ENGENHARIA'], C.navy, 0.05, 0.295, 'gear', true],
      { gap: 0.02 },
      { stack: [[['DESIGN SYSTEMS'], C.ink, 0.38, 0.042, 'grid'], [['RECIFE'], C.paper, 0.36, 0.038, 'skyline'], [['BRASIL'], C.forest, 0.34, 0.042, 'map']] },
      { gap: 0.12 },
      [['ALGORITMOS'], C.maroon, 0.036, 0.255, 'nodes'],
      [['TIPOGRAFIA'], C.sage, 0.036, 0.25, 'type'],
      [['CRIATIVIDADE'], C.paper, 0.04, 0.27, 'sun'],
      { bookend: true },
    ],
  },
  {
    // top shelf: a few plain volumes beside the plant
    y: 2.567,
    items: [
      [null, C.maroon, 0.034, 0.24],
      [null, C.navy, 0.04, 0.26],
      [null, C.cream, 0.03, 0.235],
      [null, C.green, 0.042, 0.255],
      [null, C.mustard, 0.032, 0.23],
      [null, C.teal, 0.038, 0.25],
      { gap: 0.03 },
      { stack: [[null, C.rust, 0.3, 0.04], [null, C.paper, 0.28, 0.035]] },
    ],
  },
]

const SHELF_LEFT = -0.53
const DEPTH = 0.2
const CELL_W = 64
const CELL_H = 512
const ATLAS = 2048
const COLS = ATLAS / CELL_W

// ---- spine drawing --------------------------------------------------------

function icon(g, kind, cx, cy, s) {
  g.save()
  g.translate(cx, cy)
  g.lineWidth = 2
  g.lineJoin = g.lineCap = 'round'
  const dot = (x, y, r = 2.6) => {
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  const line = (pts, close) => {
    g.beginPath()
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
    if (close) g.closePath()
    g.stroke()
  }
  const ring = (x, y, r) => {
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.stroke()
  }
  switch (kind) {
    case 'cube':
      line([[0, -s], [s, -s / 2], [s, s / 2], [0, s], [-s, s / 2], [-s, -s / 2]], true)
      line([[-s, -s / 2], [0, 0], [s, -s / 2]])
      line([[0, 0], [0, s]])
      break
    case 'nodes':
      line([[0, -s], [-s, s * 0.7], [s, s * 0.7]], true)
      dot(0, -s, 3.4), dot(-s, s * 0.7, 3.4), dot(s, s * 0.7, 3.4)
      break
    case 'tree':
      line([[0, -s], [-s * 0.8, s * 0.6]]), line([[0, -s], [s * 0.8, s * 0.6]])
      dot(0, -s, 3.4), dot(-s * 0.8, s * 0.6, 3.4), dot(s * 0.8, s * 0.6, 3.4)
      break
    case 'dots':
      ring(0, 0, s * 0.9)
      for (let i = 0; i < 6; i++) dot(Math.cos((i / 6) * Math.PI * 2) * s * 0.9, Math.sin((i / 6) * Math.PI * 2) * s * 0.9, 2)
      break
    case 'triangle':
      line([[0, -s], [s, s * 0.8], [-s, s * 0.8]], true)
      line([[0, -s * 0.2], [s * 0.45, s * 0.5], [-s * 0.45, s * 0.5]], true)
      break
    case 'cup':
      line([[-s * 0.7, -s * 0.4], [-s * 0.55, s * 0.7], [s * 0.45, s * 0.7], [s * 0.6, -s * 0.4]], true)
      g.beginPath()
      g.arc(s * 0.72, 0, s * 0.3, -Math.PI / 2, Math.PI / 2)
      g.stroke()
      line([[-s * 0.2, -s * 0.7], [-s * 0.1, -s]]), line([[s * 0.15, -s * 0.7], [s * 0.25, -s]])
      break
    case 'gear':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        line([[Math.cos(a) * s * 0.65, Math.sin(a) * s * 0.65], [Math.cos(a) * s, Math.sin(a) * s]])
      }
      ring(0, 0, s * 0.65), ring(0, 0, s * 0.25)
      break
    case 'cloud':
      g.beginPath()
      g.arc(-s * 0.4, s * 0.15, s * 0.42, Math.PI * 0.5, Math.PI * 1.5)
      g.arc(0, -s * 0.2, s * 0.5, Math.PI, Math.PI * 1.95)
      g.arc(s * 0.45, s * 0.15, s * 0.42, Math.PI * 1.5, Math.PI * 0.5)
      g.closePath()
      g.stroke()
      break
    case 'square':
      g.strokeRect(-s * 0.85, -s * 0.85, s * 1.7, s * 1.7)
      g.strokeRect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7)
      break
    case 'code':
      line([[-s * 0.35, -s * 0.6], [-s, 0], [-s * 0.35, s * 0.6]]), line([[s * 0.35, -s * 0.6], [s, 0], [s * 0.35, s * 0.6]])
      line([[s * 0.15, -s * 0.8], [-s * 0.15, s * 0.8]])
      break
    case 'layers':
      for (const dy of [-s * 0.45, 0, s * 0.45]) line([[0, dy - s * 0.4], [s, dy], [0, dy + s * 0.4], [-s, dy]], true)
      break
    case 'diamond':
      line([[0, -s], [s * 0.8, 0], [0, s], [-s * 0.8, 0]], true)
      line([[0, -s * 0.45], [s * 0.35, 0], [0, s * 0.45], [-s * 0.35, 0]], true)
      break
    case 'db':
      g.beginPath()
      g.ellipse(0, -s * 0.6, s * 0.75, s * 0.28, 0, 0, Math.PI * 2)
      g.stroke()
      line([[-s * 0.75, -s * 0.6], [-s * 0.75, s * 0.6]]), line([[s * 0.75, -s * 0.6], [s * 0.75, s * 0.6]])
      g.beginPath()
      g.ellipse(0, s * 0.6, s * 0.75, s * 0.28, 0, 0, Math.PI)
      g.stroke()
      g.beginPath()
      g.ellipse(0, 0, s * 0.75, s * 0.28, 0, 0, Math.PI)
      g.stroke()
      break
    case 'lock':
      g.strokeRect(-s * 0.7, -s * 0.1, s * 1.4, s)
      g.beginPath()
      g.arc(0, -s * 0.1, s * 0.45, Math.PI, 0)
      g.stroke()
      dot(0, s * 0.35, 2.2)
      break
    case 'bars':
      g.fillRect(-s * 0.8, s * 0.1, s * 0.35, s * 0.8)
      g.fillRect(-s * 0.18, -s * 0.3, s * 0.35, s * 1.2)
      g.fillRect(s * 0.45, -s * 0.8, s * 0.35, s * 1.7)
      break
    case 'network':
      for (const [a, b] of [[[-s, -s * 0.6], [0, 0]], [[s, -s * 0.6], [0, 0]], [[-s, s * 0.7], [0, 0]], [[s, s * 0.7], [0, 0]], [[0, -s], [0, 0]]]) line([a, b])
      ;[[-s, -s * 0.6], [s, -s * 0.6], [-s, s * 0.7], [s, s * 0.7], [0, -s], [0, 0]].forEach(([x, y]) => dot(x, y, 2.8))
      break
    case 'leaf':
      g.beginPath()
      g.moveTo(0, s)
      g.quadraticCurveTo(-s * 1.1, 0, 0, -s)
      g.quadraticCurveTo(s * 1.1, 0, 0, s)
      g.stroke()
      line([[0, s], [0, -s * 0.6]])
      break
    case 'rings':
      ring(-s * 0.35, 0, s * 0.6), ring(s * 0.35, 0, s * 0.6)
      break
    case 'bulb':
      g.beginPath()
      g.arc(0, -s * 0.25, s * 0.6, Math.PI * 0.8, Math.PI * 0.2)
      g.lineTo(s * 0.25, s * 0.55)
      g.lineTo(-s * 0.25, s * 0.55)
      g.closePath()
      g.stroke()
      line([[-s * 0.25, s * 0.8], [s * 0.25, s * 0.8]])
      break
    case 'globe':
      ring(0, 0, s * 0.85)
      line([[-s * 0.85, 0], [s * 0.85, 0]])
      g.beginPath()
      g.ellipse(0, 0, s * 0.35, s * 0.85, 0, 0, Math.PI * 2)
      g.stroke()
      break
    case 'type':
      line([[-s * 0.7, -s * 0.8], [s * 0.7, -s * 0.8]]), line([[0, -s * 0.8], [0, s * 0.8]]), line([[-s * 0.3, s * 0.8], [s * 0.3, s * 0.8]])
      break
    case 'sun':
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        line([[Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3], [Math.cos(a) * s, Math.sin(a) * s]])
      }
      break
    case 'grid':
      g.strokeRect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6)
      line([[0, -s * 0.8], [0, s * 0.8]]), line([[-s * 0.8, 0], [s * 0.8, 0]])
      break
    case 'circle':
      ring(0, 0, s * 0.8)
      break
    case 'photo':
      g.strokeRect(-s * 0.9, -s * 0.65, s * 1.8, s * 1.3)
      line([[-s * 0.9, s * 0.4], [-s * 0.2, -s * 0.15], [s * 0.3, s * 0.3], [s * 0.9, -s * 0.2]])
      break
    case 'skyline':
      line([[-s, s * 0.7], [-s, 0], [-s * 0.5, 0], [-s * 0.5, -s * 0.6], [-s * 0.1, -s], [s * 0.3, -s * 0.6], [s * 0.3, -s * 0.1], [s, -s * 0.1], [s, s * 0.7]])
      break
    case 'map':
      g.beginPath()
      g.moveTo(-s, -s * 0.2)
      g.bezierCurveTo(-s * 0.5, -s, s * 0.4, -s * 0.9, s * 0.9, -s * 0.2)
      g.bezierCurveTo(s * 0.6, s * 0.4, 0, s, -s * 0.3, s * 0.6)
      g.closePath()
      g.stroke()
      break
  }
  g.restore()
}

// One spine in a 64x512 cell, standing up: title runs top to bottom between
// gilt bands, icon at the foot. The cell's top rows are plain cloth, used as
// the colour of the book's other faces.
function drawSpine(g, x0, y0, [lines, color, , , kind, bold]) {
  const light = LIGHT.has(color)
  const ink = light ? INK : GOLD
  g.fillStyle = color
  g.fillRect(x0, y0, CELL_W, CELL_H)
  // rounded spine: darker towards both edges, a little cloth grain
  const shade = g.createLinearGradient(x0, 0, x0 + CELL_W, 0)
  shade.addColorStop(0, 'rgba(0,0,0,0.28)')
  shade.addColorStop(0.18, 'rgba(0,0,0,0.05)')
  shade.addColorStop(0.5, 'rgba(255,255,255,0.06)')
  shade.addColorStop(0.82, 'rgba(0,0,0,0.05)')
  shade.addColorStop(1, 'rgba(0,0,0,0.3)')
  g.fillStyle = shade
  g.fillRect(x0, y0 + 16, CELL_W, CELL_H - 16)
  for (let i = 0; i < 260; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)'
    g.fillRect(x0 + Math.random() * CELL_W, y0 + 16 + Math.random() * (CELL_H - 16), 1, 2 + Math.random() * 4)
  }
  g.fillStyle = ink
  g.strokeStyle = ink
  const band = (y, h = 2) => g.fillRect(x0 + 3, y0 + y, CELL_W - 6, h)
  if (bold) {
    for (const y of [26, 34, 42]) band(y, 3)
    band(476, 3)
  } else if (lines) {
    band(30), band(37), band(472), band(479)
  } else {
    band(34, 3), band(470, 3)
  }
  if (lines) {
    // titles stack as columns across the spine, read top to bottom
    const n = lines.length
    let size = n === 1 ? 23 : 18
    g.font = `600 ${size}px Georgia, "Times New Roman", serif`
    if ('letterSpacing' in g) g.letterSpacing = '2px'
    const longest = Math.max(...lines.map((l) => g.measureText(l).width))
    const room = 360
    if (longest > room) {
      size = Math.floor((size * room) / longest)
      g.font = `600 ${size}px Georgia, "Times New Roman", serif`
    }
    g.save()
    g.translate(x0 + CELL_W / 2, y0 + 62)
    g.rotate(Math.PI / 2)
    g.textAlign = 'left'
    g.textBaseline = 'middle'
    const step = size * 1.05
    lines.forEach((l, i) => g.fillText(l, 0, (i - (n - 1) / 2) * step))
    g.restore()
    if ('letterSpacing' in g) g.letterSpacing = '0px'
  }
  if (kind) icon(g, kind, x0 + CELL_W / 2, y0 + 446, 11)
}

// ---- geometry -------------------------------------------------------------

function layout() {
  const books = []
  for (const shelf of SHELVES) {
    let x = SHELF_LEFT
    for (const item of shelf.items) {
      if (item.gap) {
        x += item.gap
      } else if (item.bookend) {
        books.push({ bookend: true, x: x + 0.006, y: shelf.y })
        x += 0.02
      } else if (item.stack) {
        // flat books lying on top of each other, spines to the front
        const long = Math.max(...item.stack.map((b) => b[2]))
        let y = shelf.y
        item.stack.forEach((b, i) => {
          books.push({ spec: b, flat: true, x: x + long / 2 + (i % 2 ? 0.008 : -0.004), y: y + b[3] / 2, z: (i % 2) * 0.004 })
          y += b[3]
        })
        x += long
      } else {
        books.push({ spec: item, x: x + item[2] / 2, y: shelf.y + item[3] / 2 })
        x += item[2] + 0.003
      }
    }
  }
  return books
}

let built
function buildBooks() {
  if (built) return built
  const books = layout().filter((b) => !b.bookend)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = ATLAS
  const g = canvas.getContext('2d')
  const pagesCell = books.length
  const cellOf = (i) => [(i % COLS) * CELL_W, Math.floor(i / COLS) * CELL_H]
  books.forEach((b, i) => {
    const [x0, y0] = cellOf(i)
    drawSpine(g, x0, y0, b.spec)
  })
  {
    const [x0, y0] = cellOf(pagesCell)
    g.fillStyle = '#efe6d2'
    g.fillRect(x0, y0, CELL_W, CELL_H)
  }
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8

  const uvRect = (i) => {
    const [x0, y0] = cellOf(i)
    return { u0: x0 / ATLAS, u1: (x0 + CELL_W) / ATLAS, vt: 1 - y0 / ATLAS, vb: 1 - (y0 + CELL_H) / ATLAS }
  }
  const geos = books.map((b, i) => {
    // standing: [thickness, height]; flat: [length, thickness], spine head to the left
    const [, , w, h] = b.spec
    const geo = new THREE.BoxGeometry(w, h, DEPTH)
    const uv = geo.attributes.uv
    const r = uvRect(i)
    const p = uvRect(pagesCell)
    const cloth = [(r.u0 + r.u1) / 2, r.vt - 6 / ATLAS]
    const pages = [(p.u0 + p.u1) / 2, (p.vt + p.vb) / 2]
    // page edges: top, bottom and fore-edge of a standing book; both ends and
    // the fore-edge of a flat one. Covers take the plain cloth.
    const pageFaces = b.flat ? [0, 1, 5] : [2, 3, 5]
    for (let k = 0; k < 24; k++) {
      const face = Math.floor(k / 4) // px, nx, py, ny, pz, nz
      if (face === 4) {
        const gx = uv.getX(k)
        const gy = uv.getY(k)
        // standing: cell top at the book's head. Flat: cell top at the left
        // end and the glyphs' tops (cell right) upwards, so it reads across.
        if (b.flat) uv.setXY(k, r.u0 + gy * (r.u1 - r.u0), r.vt - gx * (r.vt - r.vb))
        else uv.setXY(k, r.u0 + gx * (r.u1 - r.u0), r.vb + gy * (r.vt - r.vb))
      } else {
        uv.setXY(k, ...(pageFaces.includes(face) ? pages : cloth))
      }
    }
    geo.translate(b.x, b.y, (b.z || 0) + (b.flat ? -0.005 : 0))
    return geo
  })
  built = { geometry: mergeGeometries(geos), map, bookends: layout().filter((b) => b.bookend) }
  return built
}

export function ShelfBooks(props) {
  const { geometry, map, bookends } = useMemo(buildBooks, [])
  return (
    <group {...props}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial map={map} roughness={0.78} />
      </mesh>
      {bookends.map((b) => (
        <group key={b.x} position={[b.x, b.y, 0]}>
          <mesh position={[0, 0.11, -0.01]} castShadow>
            <boxGeometry args={[0.006, 0.22, 0.16]} />
            <meshStandardMaterial color="#1c1c1e" roughness={0.45} metalness={0.5} />
          </mesh>
          <mesh position={[0.04, 0.002, -0.01]}>
            <boxGeometry args={[0.08, 0.004, 0.16]} />
            <meshStandardMaterial color="#1c1c1e" roughness={0.45} metalness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
