import { defineConfig } from 'vitepress'
import { sidebar } from './sidebar'
import { mermaid } from './markdown/mermaid'
import { repositoryLinks } from './markdown/links'

/**
 * One folder per product, one URL prefix per product:
 *
 *   docs/seal/     ->  docs.cellprivate.com/seal/
 *   docs/channel/  ->  docs.cellprivate.com/channel/   (when it exists)
 *
 * Inside a product folder the file name is the URL, with three exceptions:
 *
 *   README.md                          ->  index.md            GitHub folder index
 *   seal/technical-architecture.md     ->  seal/architecture   the SCF document
 *   seal/architecture.md               ->  seal/system-architecture
 */
function rewrite(source: string): string {
  if (source === 'seal/technical-architecture.md') return 'seal/architecture.md'
  if (source === 'seal/architecture.md') return 'seal/system-architecture.md'
  return source.replace(/(^|\/)README\.md$/, '$1index.md')
}

export default defineConfig({
  title: 'Cell Protocol',
  description: 'Technical documentation for Cell Protocol products on Stellar',
  lang: 'en',
  cleanUrls: true,
  rewrites: rewrite,
  // The sandbox screen designs stay in the repository and are not published on the site.
  // Links to them are rewritten to GitHub in markdown/links.ts.
  srcExclude: ['seal/design/**'],
  sitemap: { hostname: 'https://docs.cellprivate.com' },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0a0b0d' }],
  ],

  markdown: {
    config(md) {
      md.use(mermaid)
      md.use(repositoryLinks)
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    // One entry per product. Add { text: 'Cell Channel', link: '/channel/', activeMatch: '^/channel/' } later.
    nav: [{ text: 'Cell Seal', link: '/seal/', activeMatch: '^/seal/' }],
    sidebar,
    // Section headings only. Every document numbers its sections, so the
    // outline reads as a table of contents without the subsection noise.
    outline: { level: 2, label: 'Contents' },
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/cellprivacy/cell-seal' }],
    footer: { message: 'Cell Protocol technical documentation.', copyright: 'Cell Protocol' },
  },
})
