import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { seo } from './seo.js'

const FEED = 'https://medium.com/feed/@dellanio'
const CACHE = new URL('./src/medium-posts.json', import.meta.url)
const VIRTUAL = 'virtual:medium-posts'

// Latest Medium articles for the "Sobre" panel, read from the RSS feed when the
// dev server starts or the site is built. The last good list is kept in
// src/medium-posts.json, used when Medium can't be reached.
function mediumPosts() {
  const decode = (s) =>
    s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim()
  const fetchPosts = async () => {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0 dellanio.com build' } })
    if (!res.ok) throw new Error(`Medium feed: HTTP ${res.status}`)
    const xml = await res.text()
    const posts = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5).map(([, item]) => ({
      title: decode(item.match(/<title>([\s\S]*?)<\/title>/)[1]),
      href: decode(item.match(/<link>([\s\S]*?)<\/link>/)[1]).replace(/\?source=.*$/, ''),
      date: new Date(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)[1]).toISOString().slice(0, 10),
    }))
    if (!posts.length) throw new Error('Medium feed: no items')
    fs.writeFileSync(CACHE, JSON.stringify(posts, null, 2) + '\n')
    return posts
  }
  return {
    name: 'medium-posts',
    resolveId: (id) => (id === VIRTUAL ? '\0' + VIRTUAL : null),
    async load(id) {
      if (id !== '\0' + VIRTUAL) return null
      let posts
      try {
        posts = await fetchPosts()
      } catch (e) {
        this.warn(`${e.message}, using the cached list`)
        posts = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : []
      }
      return `export default ${JSON.stringify(posts)}`
    },
  }
}

// Football videos for the boteco's TV, from the channels' public feeds (no API
// key to expose in the page). Same idea as above: read at build, last good list kept.
// Only channels that allow embedding: FIFA, CazéTV, LaLiga, UEFA, Ligue 1 and the
// Brasileirão answer "video unavailable" (error 150) outside youtube.com.
const CHANNELS = [
  'UC6UL29enLNe4mqwTfAyeNuw', // Bundesliga
  'UCG5qGWdu8nIRZqJ_GgDwQ-w', // Premier League
  'UCzU8-lZlRfkV3nj0RzAZdrQ', // CONMEBOL
  'UCf9WJPpsh5BHDY-OeISgIqA', // NSports
  'UCSZbXT5TLLW_i-5W8FZpFsg', // MLS
]
const CAZETV = 'UCZiYbVptd3PVPf4f6eR6UaQ' // tried first; most of its videos refuse embedding, the player skips those
const FOOTBALL = /ao vivo|highlights|melhores momentos|jogo completo|\bgols?\b|\bgoles\b|\bgoals?\b/i
const VIDEOS_CACHE = new URL('./src/football-videos.json', import.meta.url)
const VIDEOS = 'virtual:football-videos'
function footballVideos() {
  const fromChannel = async (id) => {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, { headers: { 'User-Agent': 'Mozilla/5.0 dellanio.com build' } })
    if (!res.ok) return []
    const videos = []
    for (const [, entry] of (await res.text()).matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
      const title = entry.match(/<title>(.*?)<\/title>/)[1]
      if (entry.includes('/shorts/') || !FOOTBALL.test(title)) continue
      videos.push({ id: entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)[1], live: /ao vivo/i.test(title) })
    }
    return videos
  }
  const fetchVideos = async () => {
    const caze = await fromChannel(CAZETV)
    const others = (await Promise.all(CHANNELS.map(fromChannel))).flat().map((v) => v.id)
    if (!others.length) throw new Error('YouTube feeds: no football videos')
    // live broadcasts first
    const videos = { caze: [...caze.filter((v) => v.live), ...caze.filter((v) => !v.live)].map((v) => v.id), others }
    fs.writeFileSync(VIDEOS_CACHE, JSON.stringify(videos, null, 2) + '\n')
    return videos
  }
  return {
    name: 'football-videos',
    resolveId: (id) => (id === VIDEOS ? '\0' + VIDEOS : null),
    async load(id) {
      if (id !== '\0' + VIDEOS) return null
      let videos
      try {
        videos = await fetchVideos()
      } catch (e) {
        this.warn(`${e.message}, using the cached list`)
        videos = fs.existsSync(VIDEOS_CACHE) ? JSON.parse(fs.readFileSync(VIDEOS_CACHE, 'utf8')) : { caze: [], others: [] }
      }
      return `export default ${JSON.stringify(videos)}`
    },
  }
}

export default defineConfig({
  plugins: [react(), mediumPosts(), footballVideos(), seo([mediumPosts()])],
  server: { port: 5173 },
})
