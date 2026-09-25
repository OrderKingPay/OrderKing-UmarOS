import fs from 'fs';
const apps = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders', 'Apps-integration-'];
apps.forEach(app => {
  const file = app + '/src/lib/config/defaults.ts';
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/logoUrl: \"\"/g, 'logoUrl: "/logo.jpg"');
    content = content.replace(/faviconUrl: \"[^\"]+\"/g, 'faviconUrl: "/logo.jpg"');
    content = content.replace(/appIconUrl: \"[^\"]+\"/g, 'appIconUrl: "/logo.jpg"');
    content = content.replace(/splashIconUrl: \"[^\"]+\"/g, 'splashIconUrl: "/logo.jpg"');
    content = content.replace(/ogImageUrl: \"[^\"]+\"/g, 'ogImageUrl: "/logo.jpg"');
    fs.writeFileSync(file, content);
    console.log("Patched " + file);
  }
});

// Now let's patch __root.tsx in all 5 apps to ensure standard OG Meta tags exist.
apps.forEach(app => {
  const file = app + '/src/routes/__root.tsx';
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Inject OG tags if missing
    if (!content.includes('property: "og:title"')) {
      const ogTags = `
          { property: "og:title", content: config.brand.seoTitle },
          { property: "og:description", content: config.brand.seoDescription },
          { property: "og:image", content: config.brand.ogImageUrl },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: config.brand.seoTitle },
          { name: "twitter:description", content: config.brand.seoDescription },
          { name: "twitter:image", content: config.brand.ogImageUrl },
        `;
      content = content.replace(/\{ name: \"theme-color\", content: config.brand.primaryColor \},/g, 
        `{ name: "theme-color", content: config.brand.primaryColor },\n${ogTags}`);
      fs.writeFileSync(file, content);
      console.log("Injected OG tags to " + file);
    }
  }
});
