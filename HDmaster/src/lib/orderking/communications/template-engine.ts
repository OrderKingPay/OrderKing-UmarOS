export class MessageTemplateEngine {
  private templates: Record<string, Record<string, string>> = {};

  registerTemplate(locale: string, templateId: string, templateString: string): void {
    if (!this.templates[locale]) {
      this.templates[locale] = {};
    }
    this.templates[locale][templateId] = templateString;
  }

  compile(templateId: string, locale: string, variables: Record<string, string | number>): string {
    const localeTemplates = this.templates[locale];
    if (!localeTemplates || !localeTemplates[templateId]) {
      // Fallback to English
      const enTemplates = this.templates['en'];
      if (!enTemplates || !enTemplates[templateId]) {
        throw new Error(`Template ${templateId} not found for locale ${locale} and no English fallback available.`);
      }
      return this.render(enTemplates[templateId], variables);
    }

    return this.render(localeTemplates[templateId], variables);
  }

  private render(template: string, variables: Record<string, string | number>): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }
}
