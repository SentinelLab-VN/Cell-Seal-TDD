import { defineConfig } from 'vitepress'
import { cpSync } from 'node:fs'
import { resolve } from 'node:path'
import { sidebar } from './sidebar'
import { mermaid } from './markdown/mermaid'
import { repositoryLinks } from './markdown/links'

/**
 * The markdown sources in `docs/` are written for GitHub and published under
 * `/seal/` on docs.cellprivate.com. Three files change name on the way:
 *
 *   docs/technical-architecture.md  ->  /seal/architecture        the SCF document
 *   docs/architecture.md            ->  /seal/system-architecture  the detailed design
 *   docs/design/README.md           ->  /seal/design/
 *
 * Everything else keeps its file name: docs/contracts.md -> /seal/contracts.
 */
function rewrite(source: string): string {
  switch (source) {
    case 'technical-architecture.md':
      return 'seal/architecture.md'
    case 'architecture.md':
      return 'seal/system-architecture.md'
    case 'design/README.md':
      return 'seal/design/index.md'
    default:
      return `seal/${source}`
  }
}

export default defineConfig({
  title: 'Cell Private',
  description: 'Technical documentation for Cell Private products on Stellar',
  lang: 'en',
  cleanUrls: true,
  rewrites: rewrite,
  // The Pen source file is copied next to the design page in `buildEnd` below.
  ignoreDeadLinks: [/\.pen$/],
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],

  markdown: {
    config(md) {
      md.use(mermaid)
      md.use(repositoryLinks)
    },
  },

  themeConfig: {
    nav: [
      { text: 'Seal', link: '/seal/architecture', activeMatch: '^/seal/' },
      { text: 'SCF Handbook', link: 'https://stellar.gitbook.io/scf-handbook' },
    ],
    sidebar,
    outline: { level: [2, 3], label: 'On this page' },
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/SentinelLab-VN/Cell-Seal-TDD' }],
    footer: { message: 'Cell Seal technical design, version 1.', copyright: 'Cell Private' },
  },

  // `docs/design/README.md` links to the exported screens and to the Pen source
  // file. They are not referenced as images, so VitePress does not copy them.
  buildEnd({ srcDir, outDir }) {
    for (const entry of ['screens', 'cell-seal.pen']) {
      cpSync(resolve(srcDir, 'design', entry), resolve(outDir, 'seal/design', entry), {
        recursive: true,
      })
    }
  },
})
