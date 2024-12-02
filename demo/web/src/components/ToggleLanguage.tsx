import React from 'react';
import { useTranslation } from '@/lib/i18n';
import Button from '@mui/material/Button';

const ToggleLanguage = () => {
    const { locale, setLocale } = useTranslation();

    const toggleLanguage = () => {
        const newLang = locale === 'en' ? 'zh-CN' : 'en';
        setLocale(newLang);
    };

    return <Button variant="outlined" color='inherit' onClick={toggleLanguage}>
        {locale === 'en' ? '切换到中文' : 'Switch to English'}
    </Button>
};

export default ToggleLanguage;