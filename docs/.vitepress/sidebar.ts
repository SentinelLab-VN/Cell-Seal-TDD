import type { DefaultTheme } from 'vitepress'

/**
 * One key per product prefix. A second product adds its own key, for example
 * '/channel/': [...], and VitePress shows the sidebar that matches the URL.
 *
 * Cell Seal: four groups, in reading order. "Start here" holds the two documents
 * everyone reads, then the Technical Architecture Document, the summary of the
 * whole design. The other groups follow the Scope column of the repository
 * README: what a platform receives (Product), how it is built (Design in detail),
 * and the reference platform that ships with it (Sandbox).
 */
export const sidebar: DefaultTheme.Sidebar = {
  '/seal/': [
    {
      text: 'Start here',
      items: [
        { text: 'Overview', link: '/seal/overview' },
        { text: 'Glossary', link: '/seal/glossary' },
        { text: 'Technical Architecture Document', link: '/seal/architecture' },
      ],
    },
    {
      text: 'Product: what a platform receives',
      items: [
        { text: 'Flows', link: '/seal/flows' },
        { text: 'Integration', link: '/seal/integration' },
        { text: 'Onboarding a fund', link: '/seal/onboarding' },
        { text: 'Primitives', link: '/seal/primitives' },
      ],
    },
    {
      text: 'Design in detail',
      items: [
        { text: 'System architecture', link: '/seal/system-architecture' },
        { text: 'Contracts', link: '/seal/contracts' },
        { text: 'Cryptography', link: '/seal/cryptography' },
        { text: 'Keys', link: '/seal/keys' },
        { text: 'SDK', link: '/seal/sdk' },
        { text: 'Security', link: '/seal/security' },
      ],
    },
    {
      text: 'Sandbox: the reference platform',
      items: [
        { text: 'Backend', link: '/seal/backend' },
        { text: 'Frontend', link: '/seal/frontend' },
      ],
    },
  ],
}
