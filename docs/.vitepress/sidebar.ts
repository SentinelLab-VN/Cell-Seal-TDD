import type { DefaultTheme } from 'vitepress'

/** Same grouping as the reading order in the repository README. */
export const sidebar: DefaultTheme.Sidebar = {
  '/seal/': [
    {
      text: 'Cell Seal',
      items: [{ text: 'Technical Architecture', link: '/seal/architecture' }],
    },
    {
      text: 'Product',
      items: [
        { text: 'Overview', link: '/seal/overview' },
        { text: 'Glossary', link: '/seal/glossary' },
        { text: 'Flows', link: '/seal/flows' },
        { text: 'Integration', link: '/seal/integration' },
        { text: 'Onboarding a fund', link: '/seal/onboarding' },
        { text: 'Primitives', link: '/seal/primitives' },
      ],
    },
    {
      text: 'Technical design',
      items: [
        { text: 'System architecture', link: '/seal/system-architecture' },
        { text: 'Contracts', link: '/seal/contracts' },
        { text: 'Cryptography', link: '/seal/cryptography' },
        { text: 'Keys', link: '/seal/keys' },
        { text: 'Client SDK', link: '/seal/sdk' },
        { text: 'Security', link: '/seal/security' },
      ],
    },
    {
      text: 'Sandbox',
      items: [
        { text: 'Backend', link: '/seal/backend' },
        { text: 'Frontend', link: '/seal/frontend' },
        { text: 'Design', link: '/seal/design/' },
      ],
    },
  ],
}
