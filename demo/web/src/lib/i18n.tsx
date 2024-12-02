import React, { createContext, useContext, ReactNode, useState } from 'react';


interface Translations {
  [key: string]: string;
}

interface I18nContextProps {
  t: (key: string) => string;
  locale: string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);


const translations: Record<string, Translations> = {
  en: require('@/locales/en/common.json'),
  'zh-CN': require('@/locales/zh-CN/common.json'),
};


export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<string>('en'); 

  const t = (key: string): string => translations[locale][key] || key;

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};


export const useTranslation = (): I18nContextProps => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
