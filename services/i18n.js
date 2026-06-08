/**
 * i18n Service - Handles Multi-language Support
 */
const i18n = {
    currentLocale: localStorage.getItem('stgo_locale') || 'en',
    translations: {},

    init: async () => {
        await i18n.loadTranslations(i18n.currentLocale);
        i18n.applyTranslations();
    },

    loadTranslations: async (locale) => {
        try {
            const response = await fetch(`locales/${locale}.json`);
            i18n.translations = await response.json();
            i18n.currentLocale = locale;
            localStorage.setItem('stgo_locale', locale);
        } catch (error) {
            console.error("Failed to load translations:", error);
        }
    },

    t: (path) => {
        const keys = path.split('.');
        let value = i18n.translations;
        for (const key of keys) {
            if (value[key]) {
                value = value[key];
            } else {
                return path;
            }
        }
        return value;
    },

    applyTranslations: () => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const path = el.getAttribute('data-i18n');
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = i18n.t(path);
            } else {
                el.innerText = i18n.t(path);
            }
        });
    },

    setLocale: async (locale) => {
        await i18n.loadTranslations(locale);
        i18n.applyTranslations();
        // Optional: Trigger event for components to update
        window.dispatchEvent(new CustomEvent('localeChanged', { detail: locale }));
    }
};

window.i18n = i18n;
// Auto-init if not deferred
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', i18n.init);
} else {
    i18n.init();
}
