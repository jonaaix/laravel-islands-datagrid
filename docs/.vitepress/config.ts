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
         { text: 'Getting Started', link: '/getting-started' },
         { text: 'API', link: '/use-data-table' },
      ],

      sidebar: [
         {
            text: 'Guide',
            items: [
               { text: 'Getting Started', link: '/getting-started' },
               { text: 'Building a Table', link: '/building-a-table' },
            ],
         },
         {
            text: 'API',
            items: [
               { text: 'useDataTable', link: '/use-data-table' },
               { text: 'DataTable', link: '/data-table' },
               { text: 'Toolbar, Selection, Saved Views', link: '/toolbar-and-selection' },
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
