import { defineConfig } from 'vitepress'

export default defineConfig({
   title: 'Laravel Islands Datagrid',
   description: 'A server-driven data table for Laravel Islands.',
   base: '/laravel-islands-datagrid/',
   cleanUrls: true,
   lastUpdated: true,

   head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/laravel-islands-datagrid/logo.svg' }]],

   themeConfig: {
      logo: '/logo.svg',

      nav: [
         { text: 'Guide', link: '/introduction' },
         { text: 'Laravel Islands', link: 'https://jonaaix.github.io/laravel-islands/' },
      ],

      sidebar: [
         {
            text: 'Getting Started',
            items: [
               { text: 'Introduction', link: '/introduction' },
               { text: 'Installation', link: '/installation' },
               { text: 'Quickstart', link: '/quickstart' },
            ],
         },
         {
            text: 'Guide',
            items: [
               { text: 'The Endpoint', link: '/endpoint' },
               { text: 'Table State', link: '/table-state' },
               { text: 'The DataTable', link: '/data-table' },
               { text: 'Toolbar & Filters', link: '/toolbar' },
               { text: 'Selection', link: '/selection' },
               { text: 'Saved Views', link: '/saved-views' },
               { text: 'Configuration', link: '/configuration' },
            ],
         },
      ],

      socialLinks: [
         { icon: 'github', link: 'https://github.com/jonaaix/laravel-islands-datagrid' },
      ],

      footer: {
         message: 'Released under the MIT License.',
         copyright: 'Copyright © 2026 Jonas Gnioui',
      },

      search: {
         provider: 'local',
      },
   },
})
