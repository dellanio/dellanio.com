import MEDIUM_POSTS from 'virtual:medium-posts'

// Camera framing for each hotspot. pos = camera position, target = point looked at.
export const VIEWS = {
  curriculo: { pos: [1.0, 1.55, 4.65], target: [0.03, 1.15, 2.72] },
  portfolio: { pos: [2.1, 2.1, -2.3], target: [4.93, 2.1, -2.34] },
  sobre: { pos: [2.2, 2.25, 0.1], target: [4.85, 2.1, -0.1] },
  contato: { pos: [2.85, 1.55, 0.95], target: [4.62, 0.98, 0.1] }, // the tablet on the sideboard
  sinuca: { pos: [-2.25, 2.2, 0], target: [0, 0.8, 0] }, // from the side, under the lamp, the table runs across the screen
  cardapio: { pos: [1.9, 2.15, -1.3], target: [4.93, 2.1, -1.39] },
  tv: { pos: [-0.25, 2.62, -0.4], target: [1.1, 2.45, -1.7] },
  mesa: { pos: [0.8, 2.0, -0.9], target: [-1.3, 0.7, -3.0] },
}

// "set. 2026" / "Sep 2026" from "2026-09-14".
const monthYear = (iso, lang) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR', { month: 'short', year: 'numeric' }).replace(' de ', ' ')

// Real links, shared by several panels. (This site is dellanio.com itself, so
// it doesn't link to its own address.)
const BASE_LINKS = {
  linkedin: { text: 'LinkedIn — /in/dellanio', href: 'https://www.linkedin.com/in/dellanio/' },
  github: { text: 'GitHub — @dellanio', href: 'https://github.com/dellanio' },
  medium: { text: 'Medium — @dellanio', href: 'https://medium.com/@dellanio' },
  whatsapp: { text: 'WhatsApp', href: 'https://wa.me/5581983352449' },
}
export const LINKS = { pt: BASE_LINKS, en: BASE_LINKS }

// Pinned repositories on github.com/dellanio plus live platforms (shown on the portfolio board).
export const PROJECTS = [
  {
    name: 'Hermes3D',
    lang: 'TypeScript',
    desc: {
      pt: 'Engine 3D open source sobre Hermes Agents para jogos, simulações e apps 3D de alta performance.',
      en: 'Open-source 3D engine on Hermes Agents for high-performance games, simulations and 3D apps.',
    },
    href: 'https://github.com/dellanio/Hermes3D',
  },
  {
    name: 'memory-bridge',
    lang: 'JavaScript',
    desc: {
      pt: 'Extensão Edge/Chrome que salva suas conversas do ChatGPT e Gemini na sua conta Mem0.',
      en: 'Edge/Chrome extension that saves your ChatGPT and Gemini conversations to your Mem0 account.',
    },
    href: 'https://github.com/dellanio/memory-bridge',
  },
  {
    name: 'tech-woman',
    lang: 'TypeScript',
    desc: {
      pt: 'Plataforma do evento Tech Woman: inscrição, diagnóstico de carreira e conexão com mentoras.',
      en: 'Platform for the Tech Woman event: sign-up, career assessment and matching with mentors.',
    },
    href: 'https://github.com/dellanio/tech-woman',
  },
  {
    name: 'f2a-academy',
    lang: 'AI',
    desc: {
      pt: 'Plataforma de iniciação em IA a partir de material de especialistas: uma jornada de 11 missões, dos fundamentos à produção.',
      en: 'An introduction to AI built on expert material: an 11-mission journey from the fundamentals to production.',
    },
    href: 'https://f2a-academy.dellanio.com/jornada',
  },
  {
    name: 'cmdwatch',
    lang: 'C#',
    desc: {
      pt: 'Monitor de scripts .cmd/.bat no Windows: qual script abriu, quem chamou e o que está rodando.',
      en: 'Windows monitor for .cmd/.bat scripts: which script opened, who called it and what is running.',
    },
    href: 'https://github.com/dellanio/cmdwatch',
  },
  {
    name: 'hermes-headroom-proxy',
    lang: 'Python',
    desc: {
      pt: 'Ciclo de vida experimental do Hermes Headroom com roteamento opt-in.',
      en: 'Experimental Hermes Headroom lifecycle with opt-in routing.',
    },
    href: 'https://github.com/dellanio/hermes-headroom-proxy',
  },
]

// Language label shown on a project card ("AI" is a platform, not a language).
export const projectLang = (p, lang) => (p.lang === 'AI' ? (lang === 'en' ? 'AI platform' : 'Plataforma IA') : p.lang)

const projectList = (lang) => PROJECTS.map((p) => ({ text: `${p.name} (${projectLang(p, lang)}) — ${p.desc[lang]}`, href: p.href }))
const mediumList = (lang) => MEDIUM_POSTS.map((p) => ({ text: `${p.title} · ${monthYear(p.date, lang)}`, href: p.href }))

// Panel text per hotspot. A block is a paragraph (string) or a list; list items
// can be plain strings or { text, href } links.
const L = LINKS.pt
const PT = {
  curriculo: {
    kicker: 'Escritório · Computador',
    title: 'Dellanio Alencar',
    body: [
      'Engenharia de Software, Arquitetura e Inteligência Artificial aplicada',
      'Sou Dellanio Alencar, profissional de tecnologia com experiência na liderança de engenharia de software, arquitetura corporativa e desenvolvimento de soluções para bancos, hospitais, operadoras de saúde e sistemas de gestão financeira e contábil.',
      'Minha trajetória combina profundidade técnica, liderança de equipes e visão de negócio. Atuei na gestão de Arquitetura Corporativa e Fábrica de Software, conduzindo a definição de padrões, a evolução de sistemas críticos e a adoção de novas tecnologias. Também participei de projetos internacionais, com comunicação em inglês junto à Huawei e em espanhol com hospitais no Equador e no Uruguai.',
      'Hoje, meu foco está na convergência entre engenharia de software e inteligência artificial: integrar modelos de linguagem, dados, ferramentas e automação para construir soluções úteis, seguras e sustentáveis. Mais do que incorporar IA a um produto, busco entender onde ela agrega valor, como avaliar seus resultados e como mantê-la confiável em operação.',
      'Principais competências e focos técnicos',
      [
        'Engenharia de IA e IA Generativa: integração de grandes modelos de linguagem (LLMs) a aplicações e processos, com LangChain, APIs da OpenAI e Amazon Bedrock. Atenção à engenharia de contexto e de prompts, às limitações dos modelos e ao equilíbrio entre qualidade, custo e latência.',
        'Agentes e automação inteligente: uso de IA conectada a ferramentas, APIs e fluxos de trabalho, com foco na colaboração entre pessoas e agentes, na supervisão humana e em limites claros de autonomia.',
        'Conhecimento e contexto para IA: foco em RAG — geração aumentada por recuperação —, embeddings e busca semântica para conectar modelos a documentos e informações relevantes ao negócio.',
        'Qualidade, segurança e operação de IA: avaliação de respostas, observabilidade, rastreabilidade e mecanismos de proteção (guardrails), considerando privacidade dos dados, respostas incorretas e confiabilidade das aplicações.',
        'Arquitetura e engenharia de software: desenvolvimento e evolução de sistemas escaláveis, seguros e integrados, com Java, Spring Boot, React, Angular, APIs e mensageria com Kafka, RabbitMQ e ActiveMQ.',
        'Cloud, DevOps e entrega contínua: experiência com AWS, Oracle Cloud e Huawei Cloud, pipelines de CI/CD, automação de testes e qualidade de código como parte do ciclo de desenvolvimento.',
        'Liderança técnica e desenvolvimento de equipes: gestão de times multidisciplinares, mentoria, desenvolvimento de pessoas e alinhamento entre decisões de arquitetura, execução técnica e objetivos de negócio.',
      ],
      'Acredito que o valor da inteligência artificial depende da engenharia que a conecta ao mundo real: contexto adequado, integrações bem construídas, resultados avaliados e pessoas no controle.',
      [L.linkedin, L.github],
    ],
  },
  portfolio: {
    kicker: 'Escritório · Parede',
    title: 'Portfólio',
    body: ['Projetos fixados no meu GitHub e plataformas no ar.', projectList('pt'), [L.github]],
  },
  sobre: {
    kicker: 'Escritório · Estante',
    title: 'Sobre',
    body: [
      'Recifense, engenheiro de software há mais de 15 anos e hoje Engineering Manager. Acredito em pessoas no centro e engenharia em escala: times saudáveis, arquitetura clara e tecnologia a serviço do negócio.',
      'Já liderei projetos no Brasil, na China (com a Huawei) e em hospitais do Equador e do Uruguai, em português, inglês e espanhol.',
      'Aberto a posições de Engineering Manager, Director e VP of Engineering.',
      'Últimos artigos no Medium',
      mediumList('pt'),
      [L.medium],
    ],
  },
  contato: {
    kicker: 'Escritório · Tablet',
    title: 'Vamos conversar?',
    body: ['Bora falar de times, arquitetura ou um projeto novo:', [L.linkedin, L.whatsapp, L.github, L.medium]],
  },
  sinuca: {
    kicker: 'Boteco · Sinuca',
    title: 'Partida de bola 8',
    body: ['Clique na mesa para jogar.'],
  },
  cardapio: {
    kicker: 'Boteco · Quadro de giz',
    title: 'Cardápio de serviços',
    body: [
      [
        'Liderança de engenharia — sob consulta',
        'Arquitetura de software — sob consulta',
        'IA generativa no negócio — sob consulta',
        'Mentoria de tech leads — sob consulta',
        'Cerveja gelada — R$ 6',
      ],
      'Pede o orçamento no balcão:',
      [L.linkedin, L.whatsapp],
    ],
  },
  tv: {
    kicker: 'Boteco · TV',
    title: 'Passando agora',
    body: [
      'Projetos rodando e textos sobre engenharia:',
      [
        { text: 'memory-bridge — página do projeto', href: 'https://dellanio.github.io/memory-bridge/' },
        { text: 'Hermes3D — engine 3D open source', href: 'https://github.com/dellanio/Hermes3D' },
        L.medium,
      ],
    ],
  },
  mesa: {
    kicker: 'Boteco · Mesa',
    title: 'Senta aí',
    body: ['Bora tomar uma e falar de projeto? Manda um oi:', [L.whatsapp, L.linkedin, L.github]],
  },
}

const E = LINKS.en
const EN = {
  curriculo: {
    kicker: 'Office · Computer',
    title: 'Dellanio Alencar',
    body: [
      'Software Engineering, Architecture and Applied Artificial Intelligence',
      "I'm Dellanio Alencar, a technology professional experienced in leading software engineering, enterprise architecture and the development of solutions for banks, hospitals, health insurers and financial and accounting management systems.",
      'My path combines technical depth, team leadership and business vision. I managed Enterprise Architecture and a Software Factory, defining standards, evolving critical systems and adopting new technologies. I also worked on international projects, communicating in English with Huawei and in Spanish with hospitals in Ecuador and Uruguay.',
      "Today my focus is where software engineering meets artificial intelligence: bringing together language models, data, tools and automation to build solutions that are useful, safe and sustainable. More than adding AI to a product, I want to understand where it adds value, how to evaluate its results and how to keep it reliable in production.",
      'Core skills and technical focus',
      [
        'AI engineering and generative AI: integrating large language models (LLMs) into applications and processes with LangChain, the OpenAI APIs and Amazon Bedrock. Attention to context and prompt engineering, model limitations and the balance between quality, cost and latency.',
        'Agents and intelligent automation: AI connected to tools, APIs and workflows, focused on collaboration between people and agents, human oversight and clear limits on autonomy.',
        'Knowledge and context for AI: RAG (retrieval-augmented generation), embeddings and semantic search to connect models to the documents and information that matter to the business.',
        'AI quality, safety and operations: response evaluation, observability, traceability and guardrails, taking into account data privacy, incorrect answers and application reliability.',
        'Software architecture and engineering: building and evolving scalable, secure and integrated systems with Java, Spring Boot, React, Angular, APIs and messaging with Kafka, RabbitMQ and ActiveMQ.',
        'Cloud, DevOps and continuous delivery: experience with AWS, Oracle Cloud and Huawei Cloud, CI/CD pipelines, test automation and code quality as part of the development cycle.',
        'Technical leadership and team development: managing multidisciplinary teams, mentoring, developing people and aligning architecture decisions, technical execution and business goals.',
      ],
      'I believe the value of artificial intelligence depends on the engineering that connects it to the real world: the right context, well-built integrations, evaluated results and people in control.',
      [E.linkedin, E.github],
    ],
  },
  portfolio: {
    kicker: 'Office · Wall',
    title: 'Portfolio',
    body: ['Projects pinned on my GitHub and live platforms.', projectList('en'), [E.github]],
  },
  sobre: {
    kicker: 'Office · Bookshelf',
    title: 'About',
    body: [
      'Born in Recife, software engineer for over 15 years and now an Engineering Manager. I believe in people at the center and engineering at scale: healthy teams, clear architecture and technology serving the business.',
      "I've led projects in Brazil, in China (with Huawei) and in hospitals in Ecuador and Uruguay, in Portuguese, English and Spanish.",
      'Open to Engineering Manager, Director and VP of Engineering roles.',
      'Latest articles on Medium',
      mediumList('en'),
      [E.medium],
    ],
  },
  contato: {
    kicker: 'Office · Tablet',
    title: "Let's talk",
    body: ['Happy to talk about teams, architecture or a new project:', [E.linkedin, E.whatsapp, E.github, E.medium]],
  },
  sinuca: {
    kicker: 'Boteco · Pool',
    title: '8-ball match',
    body: ['Click the table to play.'],
  },
  cardapio: {
    kicker: 'Boteco · Chalkboard',
    title: 'Services menu',
    body: [
      [
        'Engineering leadership — on request',
        'Software architecture — on request',
        'Generative AI for business — on request',
        'Tech lead mentoring — on request',
        'Ice-cold beer — R$ 6',
      ],
      'Ask for a quote at the counter:',
      [E.linkedin, E.whatsapp],
    ],
  },
  tv: {
    kicker: 'Boteco · TV',
    title: 'Now showing',
    body: [
      'Running projects and writing on engineering:',
      [
        { text: 'memory-bridge — project page', href: 'https://dellanio.github.io/memory-bridge/' },
        { text: 'Hermes3D — open-source 3D engine', href: 'https://github.com/dellanio/Hermes3D' },
        E.medium,
      ],
    ],
  },
  mesa: {
    kicker: 'Boteco · Table',
    title: 'Pull up a chair',
    body: ["Fancy a beer and a chat about a project? Say hi:", [E.whatsapp, E.linkedin, E.github]],
  },
}

export const CONTENT = { pt: PT, en: EN }

export const NAV = {
  pt: {
    day: [
      { id: 'curriculo', label: 'Currículo' },
      { id: 'portfolio', label: 'Portfólio' },
      { id: 'sobre', label: 'Sobre' },
      { id: 'contato', label: 'Contato' },
    ],
    night: [
      { id: 'cardapio', label: 'Cardápio' },
      { id: 'sinuca', label: 'Sinuca' },
      { id: 'tv', label: 'TV' },
      { id: 'mesa', label: 'Senta aí' },
    ],
  },
  en: {
    day: [
      { id: 'curriculo', label: 'Résumé' },
      { id: 'portfolio', label: 'Portfolio' },
      { id: 'sobre', label: 'About' },
      { id: 'contato', label: 'Contact' },
    ],
    night: [
      { id: 'cardapio', label: 'Menu' },
      { id: 'sinuca', label: 'Pool' },
      { id: 'tv', label: 'TV' },
      { id: 'mesa', label: 'Pull up a chair' },
    ],
  },
}

// Tooltip over each 3D hotspot.
export const HOTSPOT_LABELS = {
  pt: { curriculo: 'Currículo', portfolio: 'Portfólio', sobre: 'Sobre', contato: 'Contato', sinuca: 'Jogar sinuca 🎱', cardapio: 'Cardápio de serviços', tv: 'Demos & vídeos', mesa: 'Senta aí' },
  en: { curriculo: 'Résumé', portfolio: 'Portfolio', sobre: 'About', contato: 'Contact', sinuca: 'Play pool 🎱', cardapio: 'Services menu', tv: 'Demos & videos', mesa: 'Pull up a chair' },
}

// HUD strings.
export const UI = {
  pt: {
    office: 'Escritório',
    bar: 'Boteco',
    toggle: 'Alternar dia e noite',
    close: 'Fechar',
    radio: { label: 'Rádio do boteco', on: 'Desligar o rádio', off: 'Ligar o rádio', volume: 'Volume do rádio', hint: 'Clique para ligar ou desligar', status: { off: 'Desligado', loading: 'Sintonizando…', playing: 'Ao vivo', blocked: 'Toque para ligar', error: 'Fora do ar' } },
  },
  en: {
    office: 'Office',
    bar: 'Boteco',
    toggle: 'Switch day and night',
    close: 'Close',
    radio: { label: 'Boteco radio', on: 'Turn the radio off', off: 'Turn the radio on', volume: 'Radio volume', hint: 'Click to switch it on or off', status: { off: 'Off', loading: 'Tuning in…', playing: 'Live', blocked: 'Tap to turn on', error: 'Off the air' } },
  },
}
