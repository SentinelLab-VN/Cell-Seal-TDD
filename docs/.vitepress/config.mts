import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Source files live in `docs/`. They are published under `/seal/` so that
// docs.cellprivate.com can host other Cell products next to Seal later.
//
//   docs/technical-architecture.md  ->  /seal/architecture      (the SCF TAD)
//   docs/architecture.md            ->  /seal/system-architecture
//   docs/design/README.md           ->  /seal/design/
//   docs/<page>.md                  ->  /seal/<page>
const rewrites = (id: string): string => {
  if (id === 'technical-architecture.md') return 'seal/architecture.md'
  if (id === 'architecture.md') return 'seal/system-architecture.md'
  if (id === 'design/README.md') return 'seal/design/index.md'
  return `seal/${id}`
}

const seal = (path: string) => `/seal/${path}`

export default withMermaid(
  defineConfig({
    title: 'Cell Private',
    description: 'Technical documentation for Cell Private products on Stellar',
    lang: 'en',
    cleanUrls: true,
    rewrites,
    srcExclude: ['**/node_modules/**'],
    head: [
      ['meta', { name: 'theme-color', content: '#0A0B0D' }],
      ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ],
    ignoreDeadLinks: [/\.pen$/],
    vite: {
      // Dev server only. Mermaid itself must stay un-bundled (pre-bundling it makes
      // the first diagram hang), but its CommonJS dependencies must be pre-bundled
      // or the browser fails on their missing default export and shows a blank page.
      // Those packages are listed as devDependencies so Vite can resolve them.
      optimizeDeps: {
        exclude: ['mermaid'],
        include: ['fastdom', 'fastdom/extensions/fastdom-promised.js', 'cytoscape-fcose'],
      },
      resolve: {
        // The plugin aliases the other dayjs plugins mermaid uses to their ESM builds.
        alias: { 'dayjs/plugin/duration.js': 'dayjs/esm/plugin/duration' },
      },
    },
    markdown: {
      lineNumbers: false,
      config(md) {
        // The markdown sources are written for GitHub: `design/README.md` is the
        // design index and `../README.md` is the repository README. Map both onto
        // the published pages, and send folder links to the repository tree.
        const GITHUB = 'https://github.com/SentinelLab-VN/Cell-Seal-TDD/tree/main/docs/design/'
        const fix = (href: string): string => {
          if (href === '../README.md') return './index.md'
          if (/(^|\/)architecture\.md(#.*)?$/.test(href)) return href.replace(/architecture\.md/, 'system-architecture.md')
          if (/(^|\/)README\.md$/.test(href)) return href.replace(/README\.md$/, 'index.md')
          if (/^screens\/(fund|investor)\/$/.test(href)) return GITHUB + href
          return href
        }
        md.core.ruler.push('cell-links', (state) => {
          for (const block of state.tokens) {
            if (block.type !== 'inline' || !block.children) continue
            for (const tok of block.children) {
              if (tok.type !== 'link_open') continue
              const href = tok.attrGet('href')
              if (href) tok.attrSet('href', fix(href))
            }
          }
        })
      },
    },
    themeConfig: {
      siteTitle: 'Cell Private',
      nav: [
        { text: 'Seal', link: seal('architecture'), activeMatch: '^/seal/' },
        { text: 'SCF Handbook', link: 'https://stellar.gitbook.io/scf-handbook' },
      ],
      sidebar: {
        '/seal/': [
          {
            text: 'Cell Seal',
            items: [
              { text: 'Technical Architecture', link: seal('architecture') },
            ],
          },
          {
            text: 'Product',
            collapsed: false,
            items: [
              { text: 'Overview', link: seal('overview') },
              { text: 'Glossary', link: seal('glossary') },
              { text: 'Flows', link: seal('flows') },
              { text: 'Integration', link: seal('integration') },
              { text: 'Onboarding a fund', link: seal('onboarding') },
              { text: 'Primitives', link: seal('primitives') },
            ],
          },
          {
            text: 'Technical design',
            collapsed: false,
            items: [
              { text: 'System architecture', link: seal('system-architecture') },
              { text: 'Contracts', link: seal('contracts') },
              { text: 'Cryptography', link: seal('cryptography') },
              { text: 'Keys', link: seal('keys') },
              { text: 'Client SDK', link: seal('sdk') },
              { text: 'Security', link: seal('security') },
            ],
          },
          {
            text: 'Sandbox',
            collapsed: false,
            items: [
              { text: 'Backend', link: seal('backend') },
              { text: 'Frontend', link: seal('frontend') },
              { text: 'Design', link: seal('design/') },
            ],
          },
        ],
      },
      outline: { level: [2, 3], label: 'On this page' },
      search: { provider: 'local' },
      socialLinks: [
        { icon: 'github', link: 'https://github.com/SentinelLab-VN/Cell-Seal-TDD' },
      ],
      footer: {
        message: 'Cell Seal technical design, version 1.',
        copyright: 'Cell Private',
      },
      docFooter: { prev: 'Previous', next: 'Next' },
    },
    // The design README links to the exported screens and the Pen source file.
    // Those are not markdown assets, so copy them next to the published page.
    buildEnd(siteConfig) {
      const from = resolve(siteConfig.srcDir, 'design')
      const to = resolve(siteConfig.outDir, 'seal/design')
      for (const entry of ['screens', 'cell-seal.pen']) {
        const src = resolve(from, entry)
        if (existsSync(src)) cpSync(src, resolve(to, entry), { recursive: true })
      }
    },
  }),
  {
    // The plugin switches to Mermaid's dark theme whenever the site is in dark mode.
    mermaid: {
      themeVariables: {
        fontFamily: 'inherit',
      },
    },
    mermaidPlugin: {
      class: 'mermaid',
    },
  },
)
