export type Locale = 'en-US' | 'ar-AE' | 'fr-FR' | 'hi-IN';
export type Direction = 'ltr' | 'rtl';

export interface TranslationDictionary {
    [key: string]: string | TranslationDictionary;
}

export class I18nDynamicRouter {
    private currentLocale: Locale;
    private dictionaries: Map<Locale, TranslationDictionary> = new Map();
    
    // Defines which locales require RTL alignment
    private rtlLocales: Set<Locale> = new Set(['ar-AE']);

    constructor(defaultLocale: Locale = 'en-US') {
        this.currentLocale = defaultLocale;
    }

    /**
     * Sets the current locale and dynamically adjusts the UI direction if running in a browser environment.
     */
    public setLocale(locale: Locale): void {
        this.currentLocale = locale;
        this.applyDirection();
    }

    public getLocale(): Locale {
        return this.currentLocale;
    }

    public getDirection(): Direction {
        return this.rtlLocales.has(this.currentLocale) ? 'rtl' : 'ltr';
    }

    /**
     * Registers a translation dictionary for a specific locale without hardcoding strings in the components.
     */
    public registerDictionary(locale: Locale, dictionary: TranslationDictionary): void {
        this.dictionaries.set(locale, dictionary);
    }

    /**
     * Recursively fetches the translation string by dot-notation key (e.g. "home.greeting")
     * and optionally interpolates variables.
     */
    public translate(key: string, variables?: Record<string, string>): string {
        const dictionary = this.dictionaries.get(this.currentLocale);
        if (!dictionary) {
            return `[Missing Dictionary: ${this.currentLocale}]`;
        }
        
        const keys = key.split('.');
        let current: any = dictionary;
        for (const k of keys) {
            if (current[k] === undefined) {
                return `[Missing Translation: ${key}]`;
            }
            current = current[k];
        }

        if (typeof current !== 'string') {
            return `[Invalid Translation Type: ${key}]`;
        }

        let translation = current;
        
        if (variables) {
            for (const [varKey, varValue] of Object.entries(variables)) {
                translation = translation.replace(new RegExp(`{{${varKey}}}`, 'g'), varValue);
            }
        }

        return translation;
    }

    /**
     * Mathematically adjusts UI alignment by setting the HTML document direction
     */
    private applyDirection(): void {
        const dir = this.getDirection();
        if (typeof document !== 'undefined' && document.documentElement) {
            document.documentElement.dir = dir;
            document.documentElement.lang = this.currentLocale;
        }
    }
}
