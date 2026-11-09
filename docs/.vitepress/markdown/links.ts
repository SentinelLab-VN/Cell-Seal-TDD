import type MarkdownIt from 'markdown-it'

/**
 * The documents link to each other the way GitHub expects. Three kinds of link
 * need a different target on the published site:
 *
 *   ../README.md        the repository README      ->  the /seal/ landing page
 *   design/README.md    the design index           ->  /seal/design/
 *   architecture.md     published under a new name ->  system-architecture.md
 *   screens/fund/       a folder of PNG exports    ->  the folder on GitHub
 *
 * VitePress resolves the result against the rewritten page paths, so the
 * replacements are written as source file names, not as URLs.
 */
const GITHUB_DESIGN = 'https://github.com/cellprivacy/cell/tree/main/docs/design/'

function target(href: string): string {
  if (href === '../README.md') return './index.md'
  if (href.endsWith('/README.md')) return href.replace(/README\.md$/, 'index.md')
  if (/(^|\/)architecture\.md(#|$)/.test(href)) return href.replace('architecture.md', 'system-architecture.md')
  if (/^screens\/(fund|investor)\/$/.test(href)) return GITHUB_DESIGN + href
  return href
}

export function repositoryLinks(md: MarkdownIt): void {
  md.core.ruler.push('repository_links', (state) => {
    for (const block of state.tokens) {
      if (block.type !== 'inline' || !block.children) continue
      for (const token of block.children) {
        if (token.type !== 'link_open') continue
        const href = token.attrGet('href')
        if (href) token.attrSet('href', target(href))
      }
    }
  })
}
