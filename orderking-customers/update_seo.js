const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'r', '$slug.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace jsonLd block
const startMarker = '  const jsonLd = restaurant';
const endMarker = '    : null;';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find jsonLd block markers', { startIndex, endIndex });
  process.exit(1);
}

const fullEndIndex = endIndex + endMarker.length;
const replacement = '  const jsonLd = restaurant ? buildRestaurantJsonLd(restaurant, slug, location) : null;';

content = content.slice(0, startIndex) + replacement + content.slice(fullEndIndex);

// Add <RestaurantSeo /> inside <article>
const articleTag = '<article>';
const articleIdx = content.indexOf(articleTag);
if (articleIdx === -1) {
  console.error('Could not find <article> tag');
  process.exit(1);
}

const afterArticle = articleIdx + articleTag.length;
const seoComponent = '\n          <RestaurantSeo restaurant={restaurant} slug={slug} location={location} />';

// Ensure it's not already added
if (!content.includes('<RestaurantSeo')) {
  content = content.slice(0, afterArticle) + seoComponent + content.slice(afterArticle);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated r/$slug.tsx with RestaurantSeo and buildRestaurantJsonLd');
