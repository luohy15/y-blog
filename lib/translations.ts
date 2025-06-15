import { LanguageCode } from './language';

export const translations = {
  en: {
    nav: {
      about: 'About',
      writing: 'Writing',
    },
    common: {
      noPosts: 'No posts yet',
      created: 'Created',
      updated: 'Updated',
    },
  },
  ja: {
    nav: {
      about: 'アバウト',
      writing: 'ライティング',
    },
    common: {
      noPosts: 'まだ投稿がありません',
      created: '作成',
      updated: '更新',
    },
  },
  zhs: {
    nav: {
      about: '关于',
      writing: '写作',
    },
    common: {
      noPosts: '暂无文章',
      created: '创建',
      updated: '更新',
    },
  },
  zht: {
    nav: {
      about: '關於',
      writing: '寫作',
    },
    common: {
      noPosts: '暫無文章',
      created: '建立',
      updated: '更新',
    },
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function useTranslations(language: LanguageCode) {
  return translations[language] || translations.en;
}

export function getTranslation(language: LanguageCode, key: string): string {
  const t = translations[language] || translations.en;
  const keys = key.split('.');
  let value: unknown = t;
  
  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k];
  }
  
  return (typeof value === 'string' ? value : key);
}
