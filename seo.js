// Search engines and AI agents don't run the 3D scene, so the build writes the
// site's text into the page itself: a semantic copy of every panel (in a
// visually hidden <main>, which also serves screen readers), Person/WebSite
// structured data, and robots.txt, sitemap.xml and llms.txt next to it. All of
// it comes from src/content.js, so the scene and this copy never drift apart.
import { createServer } from 'vite'

const SITE = 'https://dellanio.com'
// panels a reader needs; the pool game and the "sit down" table are just play
const SECTIONS = ['curriculo', 'sobre', 'portfolio', 'cardapio', 'tv', 'contato']

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function loadContent(plugins) {
  const server = await createServer({ configFile: false, plugins, logLevel: 'silent', cacheDir: 'node_modules/.vite-seo', optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  try {
    return await server.ssrLoadModule('/src/content.js')
  } finally {
    await server.close()
  }
}

// A panel block is a paragraph (string) or a list of strings / { text, href }.
const item = (i) => (typeof i === 'string' ? esc(i) : `<a href="${esc(i.href)}">${esc(i.text)}</a>`)
function blockHtml(b, next) {
  if (Array.isArray(b)) return `<ul>${b.map((i) => `<li>${item(i)}</li>`).join('')}</ul>`
  // a short line right before a list reads as that list's heading
  return Array.isArray(next) && b.length < 60 ? `<h3>${esc(b)}</h3>` : `<p>${esc(b)}</p>`
}
const sectionHtml = (id, p) =>
  `<section id="${id}"><h2>${esc(p.title)}</h2>${p.body.map((b, i) => blockHtml(b, p.body[i + 1])).join('')}</section>`

function mainHtml(C) {
  const pt = SECTIONS.filter((id) => id !== 'curriculo').map((id) => sectionHtml(id, C.pt[id]))
  const en = SECTIONS.filter((id) => id !== 'curriculo').map((id) => sectionHtml(`${id}-en`, C.en[id]))
  const intro = (p) => p.body.map((b, i) => blockHtml(b, p.body[i + 1])).join('')
  return `<main id="conteudo" class="sr-only">
<article lang="pt-BR"><h1>Dellanio Alencar</h1>${intro(C.pt.curriculo)}${pt.join('')}</article>
<article lang="en"><h2>Dellanio Alencar (English)</h2>${intro(C.en.curriculo)}${en.join('')}</article>
</main>`
}

function jsonLd({ CONTENT, LINKS, PROJECTS }) {
  const L = LINKS.pt
  const person = {
    '@type': 'Person',
    '@id': `${SITE}/#person`,
    name: 'Dellanio Alencar',
    url: `${SITE}/`,
    image: `${SITE}/og-image.jpg`,
    jobTitle: 'Engineering Manager',
    description: CONTENT.pt.curriculo.body[1],
    address: { '@type': 'PostalAddress', addressLocality: 'Recife', addressRegion: 'PE', addressCountry: 'BR' },
    knowsLanguage: ['pt-BR', 'en', 'es'],
    knowsAbout: [
      'Engenharia de software', 'Arquitetura de software', 'Arquitetura corporativa', 'Liderança de engenharia',
      'Inteligência artificial', 'IA generativa', 'LLM', 'Agentes de IA', 'RAG', 'LangChain', 'Amazon Bedrock',
      'Java', 'Spring Boot', 'React', 'Angular', 'Kafka', 'AWS', 'Oracle Cloud', 'DevOps', 'CI/CD',
    ],
    sameAs: [L.linkedin.href, L.github.href, L.medium.href],
    seeks: { '@type': 'Demand', description: 'Engineering Manager, Director ou VP of Engineering' },
  }
  const works = PROJECTS.map((p) => ({ '@type': 'CreativeWork', name: p.name, url: p.href, description: p.desc.pt, author: { '@id': person['@id'] } }))
  return {
    '@context': 'https://schema.org',
    '@graph': [
      person,
      { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'Dellanio Alencar', inLanguage: ['pt-BR', 'en'], publisher: { '@id': person['@id'] } },
      { '@type': 'ProfilePage', '@id': `${SITE}/#page`, url: `${SITE}/`, isPartOf: { '@id': `${SITE}/#website` }, mainEntity: { '@id': person['@id'] }, inLanguage: 'pt-BR', hasPart: works },
    ],
  }
}

// llms.txt (llmstxt.org): a plain Markdown summary for language-model agents.
function llmsTxt({ CONTENT, LINKS, PROJECTS }) {
  const md = (p) =>
    p.body
      .map((b, i) =>
        Array.isArray(b)
          ? b.map((x) => (typeof x === 'string' ? `- ${x}` : `- [${x.text}](${x.href})`)).join('\n')
          : Array.isArray(p.body[i + 1]) && b.length < 60 ? `### ${b}` : b,
      )
      .join('\n\n')
  const C = CONTENT.pt
  const E = CONTENT.en
  return `# Dellanio Alencar

> Engineering Manager em Recife, Brasil, com mais de 15 anos em engenharia de software, arquitetura corporativa e IA aplicada (LLMs, agentes, RAG). Aberto a posições de Engineering Manager, Director e VP of Engineering. Recife-based Engineering Manager (software engineering, enterprise architecture, applied AI), open to Engineering Manager, Director and VP of Engineering roles.

O site ${SITE} é um escritório 3D interativo (three.js) que vira boteco depois das 18h, com uma partida de sinuca jogável. Todo o conteúdo do site está abaixo, em texto.

## Currículo

${md(C.curriculo)}

## Sobre

${md(C.sobre)}

## Portfólio

${PROJECTS.map((p) => `- [${p.name}](${p.href}): ${p.desc.pt}`).join('\n')}

## Serviços

${md(C.cardapio)}

## Contato

${Object.values(LINKS.pt).map((l) => `- [${l.text}](${l.href})`).join('\n')}

## English

${md(E.curriculo)}

${md(E.sobre)}

## Optional

- [Site em inglês](${SITE}/?lang=en)
`
}

export function seo(contentPlugins) {
  let content
  const get = async () => (content ??= await loadContent(contentPlugins))
  return {
    name: 'seo',
    async transformIndexHtml(html) {
      const c = await get()
      return html
        .replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLd(c)).replace(/</g, '\\u003c')}</script>\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root"></div>\n    ${mainHtml(c.CONTENT)}`)
    },
    async generateBundle() {
      const c = await get()
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt(c) })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${SITE}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/?lang=en"/>
  </url>
</urlset>
`,
      })
    },
  }
}
