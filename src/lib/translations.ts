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
      viewAsMarkdown: 'View as Markdown',
    },
    comments: {
      title: 'Comments',
      loading: 'Loading comments…',
      empty: 'No comments yet',
      error: 'Comments could not be loaded.',
      rateLimit: 'GitHub is rate-limiting comment requests. Try again in a few minutes.',
      refresh: 'Refresh',
      cta: 'Comment on GitHub',
      loadMore: 'Load more',
      deletedUser: 'Deleted user',
      viewOnGitHub: 'View on GitHub',
      openOnGitHub: 'Open on GitHub',
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
      viewAsMarkdown: 'Markdown で表示',
    },
    comments: {
      title: 'コメント',
      loading: 'コメントを読み込み中…',
      empty: 'まだコメントはありません',
      error: 'コメントを読み込めませんでした。',
      rateLimit: 'GitHub のレート制限により、コメントを読み込めません。数分後にもう一度お試しください。',
      refresh: '更新',
      cta: 'GitHub でコメント',
      loadMore: 'さらに読み込む',
      deletedUser: '削除されたユーザー',
      viewOnGitHub: 'GitHub で見る',
      openOnGitHub: 'GitHub で開く',
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
      viewAsMarkdown: '以 Markdown 查看',
    },
    comments: {
      title: '评论',
      loading: '正在加载评论…',
      empty: '还没有评论',
      error: '评论加载失败。',
      rateLimit: 'GitHub 暂时限制了评论请求的频率，请几分钟后重试。',
      refresh: '刷新',
      cta: '在 GitHub 上评论',
      loadMore: '加载更多',
      deletedUser: '已删除的用户',
      viewOnGitHub: '在 GitHub 上查看',
      openOnGitHub: '在 GitHub 上打开',
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
      viewAsMarkdown: '以 Markdown 檢視',
    },
    comments: {
      title: '評論',
      loading: '正在載入評論…',
      empty: '還沒有評論',
      error: '評論載入失敗。',
      rateLimit: 'GitHub 暫時限制了評論請求的頻率，請幾分鐘後重試。',
      refresh: '重新整理',
      cta: '在 GitHub 上評論',
      loadMore: '載入更多',
      deletedUser: '已刪除的使用者',
      viewOnGitHub: '在 GitHub 上查看',
      openOnGitHub: '在 GitHub 上開啟',
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
