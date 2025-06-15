export const languages = {
  en: { code: 'en', name: 'English' },
  ja: { code: 'ja', name: '日本語' },
  zhs: { code: 'zhs', name: '简体中文' },
  zht: { code: 'zht', name: '繁體中文' },
} as const;

export type LanguageCode = keyof typeof languages;

export const defaultLanguage: LanguageCode = 'en';

export function getLanguageFromPath(pathname: string): LanguageCode {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && firstSegment in languages) {
    return firstSegment as LanguageCode;
  }
  
  return defaultLanguage;
}

export function removeLanguageFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && firstSegment in languages) {
    return '/' + segments.slice(1).join('/');
  }
  
  return pathname;
}

export function addLanguageToPath(pathname: string, language: LanguageCode): string {
  const cleanPath = removeLanguageFromPath(pathname);
  
  if (language === defaultLanguage) {
    return cleanPath || '/';
  }
  
  return `/${language}${cleanPath === '/' ? '' : cleanPath}`;
}
