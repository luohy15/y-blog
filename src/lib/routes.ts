export type AppPage = 'home' | 'writing' | 'tags' | 'post';

export const routeTable: { path: string; page: AppPage }[] = [
  { path: '/', page: 'home' },
  { path: '/writing', page: 'writing' },
  { path: '/tags', page: 'tags' },
  { path: '/tags/:tagSegment', page: 'tags' },
  { path: '/:param', page: 'post' },
  { path: '/:param/writing', page: 'writing' },
  { path: '/:param/tags', page: 'tags' },
  { path: '/:param/tags/:tagSegment', page: 'tags' },
  { path: '/:param/:slug', page: 'post' },
  { path: '/:yyyy/:mm/:dd/:slug', page: 'post' },
  { path: '/:lang/:yyyy/:mm/:dd/:slug', page: 'post' },
];
