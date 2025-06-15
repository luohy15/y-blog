'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { addLanguageToPath, removeLanguageFromPath } from '@/lib/language';
import { useTranslations } from '@/lib/translations';

export default function Header() {
  const pathname = usePathname();
  const { currentLanguage } = useLanguage();
  const t = useTranslations(currentLanguage);
  
  const cleanPath = removeLanguageFromPath(pathname);

  const navigation = [
    { 
      name: t.nav.about, 
      href: addLanguageToPath('/', currentLanguage),
      active: cleanPath === '/' 
    },
    { 
      name: t.nav.writing, 
      href: addLanguageToPath('/writing', currentLanguage),
      active: cleanPath === '/writing' 
    },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-border bg-background backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-8">
        {/* Avatar */}
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgb(76, 154, 231)' }}>
            <span className="text-white font-semibold text-sm">Y</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                item.active 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Language Switcher */}
        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
