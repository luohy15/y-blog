'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LanguageCode, defaultLanguage, getLanguageFromPath, addLanguageToPath } from '@/lib/language';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(defaultLanguage);

  useEffect(() => {
    // Get language from URL or localStorage
    const urlLanguage = getLanguageFromPath(pathname);
    const storedLanguage = localStorage.getItem('language') as LanguageCode;
    
    if (urlLanguage !== defaultLanguage) {
      setCurrentLanguage(urlLanguage);
      localStorage.setItem('language', urlLanguage);
    } else if (storedLanguage && storedLanguage !== urlLanguage) {
      // If stored language differs from URL, navigate to stored language
      const newPath = addLanguageToPath(pathname, storedLanguage);
      router.push(newPath);
    } else {
      setCurrentLanguage(urlLanguage);
    }
  }, [pathname, router]);

  const setLanguage = (language: LanguageCode) => {
    const newPath = addLanguageToPath(pathname, language);
    localStorage.setItem('language', language);
    setCurrentLanguage(language);
    router.push(newPath);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
