import type { LanguageCode } from './language.ts';

export const translations = {
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      writing: 'Writing',
      tags: 'Tags',
    },
    common: {
      noPosts: 'No posts yet',
      created: 'Created',
      updated: 'Updated',
      history: 'History',
    },
    tags: {
      title: 'Tags',
      related: 'Related writing',
      chooseTag: 'Choose a tag',
      empty: 'No tagged articles in this language yet.',
      emptyTag: 'No articles with this tag in this language yet.',
      browseWriting: 'Browse all writing',
      allTags: 'All tags',
      current: 'You are here',
      mobileControl: 'Related writing',
      closeRelated: 'Close related writing',
      toc: 'Table of Contents',
      closeToc: 'Close table of contents',
    },
  },
  ja: {
    nav: {
      home: 'ホーム',
      about: 'アバウト',
      writing: 'ライティング',
      tags: 'タグ',
    },
    common: {
      noPosts: 'まだ投稿がありません',
      created: '作成',
      updated: '更新',
      history: '履歴',
    },
    tags: {
      title: 'タグ',
      related: '関連する文章',
      chooseTag: 'タグを選ぶ',
      empty: 'この言語のタグ付き記事はまだありません。',
      emptyTag: 'この言語では、このタグの記事はまだありません。',
      browseWriting: 'すべての文章を見る',
      allTags: 'すべてのタグ',
      current: '現在の記事',
      mobileControl: '関連する文章',
      closeRelated: '関連する文章を閉じる',
      toc: '目次',
      closeToc: '目次を閉じる',
    },
  },
  zhs: {
    nav: {
      home: '首页',
      about: '关于',
      writing: '写作',
      tags: '标签',
    },
    common: {
      noPosts: '暂无文章',
      created: '创建',
      updated: '更新',
      history: '历史',
    },
    tags: {
      title: '标签',
      related: '相关文章',
      chooseTag: '选择标签',
      empty: '当前语言还没有带标签的文章。',
      emptyTag: '当前语言还没有这枚标签下的文章。',
      browseWriting: '浏览全部文章',
      allTags: '全部标签',
      current: '当前文章',
      mobileControl: '相关文章',
      closeRelated: '关闭相关文章',
      toc: '目录',
      closeToc: '关闭目录',
    },
  },
  zht: {
    nav: {
      home: '首頁',
      about: '關於',
      writing: '寫作',
      tags: '標籤',
    },
    common: {
      noPosts: '暫無文章',
      created: '建立',
      updated: '更新',
      history: '歷史',
    },
    tags: {
      title: '標籤',
      related: '相關文章',
      chooseTag: '選擇標籤',
      empty: '目前語言還沒有帶標籤的文章。',
      emptyTag: '目前語言還沒有這枚標籤下的文章。',
      browseWriting: '瀏覽全部文章',
      allTags: '全部標籤',
      current: '目前文章',
      mobileControl: '相關文章',
      closeRelated: '關閉相關文章',
      toc: '目錄',
      closeToc: '關閉目錄',
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
