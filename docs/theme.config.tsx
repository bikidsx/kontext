import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 800 }}>⚡ Kontext</span>,
  project: {
    link: 'https://github.com/bikidsx/kontext',
  },
  docsRepositoryBase: 'https://github.com/bikidsx/kontext/tree/main/docs',
  footer: {
    content: 'Kontext - Ultra-Fast AI Agent Memory',
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="Kontext: Graph + Vector Memory for AI Agents" />
    </>
  ),
  // useNextSeoProps() {
  //   return {
  //     titleTemplate: '%s – Kontext',
  //   };
  // },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
};

export default config;
