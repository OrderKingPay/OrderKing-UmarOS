import { z } from 'zod';

export interface Location {
  lat: number;
  lng: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  tags?: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  location: Location;
  menu: MenuItem[];
}

export interface SearchResult {
  restaurantId: string;
  menuItemId?: string;
  score: number;
  distance: number;
}

// Synonyms dictionary
const SYNONYMS: Record<string, string[]> = {
  coke: ['coca cola', 'cocacola', 'coca-cola'],
  vegan: ['plant based', 'plant-based', 'vegetarian'],
  veg: ['vegetarian', 'vegan'],
  pizza: ['pizzeria', 'pie'],
  burger: ['hamburger', 'cheeseburger'],
};

// Flatten synonyms for fast lookup (word -> canonical or all equivalents)
function getSynonyms(word: string): string[] {
  const lower = word.toLowerCase();
  const results = new Set<string>([lower]);
  
  for (const [key, values] of Object.entries(SYNONYMS)) {
    if (key === lower || values.includes(lower)) {
      results.add(key);
      values.forEach(v => results.add(v));
    }
  }
  return Array.from(results);
}

// Haversine formula
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371e3; // metres
  const φ1 = (loc1.lat * Math.PI) / 180;
  const φ2 = (loc2.lat * Math.PI) / 180;
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

// Levenshtein distance for typo tolerance
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

// Tokenize text into words
function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 0);
}

// Memory-Mapped Index (Simulated with JS Maps/Sets for sub-millisecond in-memory access)
export class InvertedIndexDiscoveryEngine {
  // item -> token mapping for fast typo resolution without scanning all text
  private vocabulary: Set<string> = new Set();
  
  // token -> Set of "restaurantId:menuItemId" or "restaurantId:REST"
  private index: Map<string, Set<string>> = new Map();
  
  // Storage for quick retrieval
  private restaurants: Map<string, Restaurant> = new Map();

  constructor() {}

  public indexRestaurant(restaurant: Restaurant) {
    this.restaurants.set(restaurant.id, restaurant);

    // Index Restaurant Name
    const restTokens = tokenize(restaurant.name);
    for (const token of restTokens) {
      this.addToIndex(token, `${restaurant.id}:REST`);
    }

    // Index Menu Items
    for (const item of restaurant.menu) {
      const itemTokens = [...tokenize(item.name), ...tokenize(item.description || '')];
      if (item.tags) {
        itemTokens.push(...item.tags.flatMap(t => tokenize(t)));
      }

      for (const token of itemTokens) {
        this.addToIndex(token, `${restaurant.id}:${item.id}`);
      }
    }
  }

  private addToIndex(word: string, docId: string) {
    const synonyms = getSynonyms(word);
    for (const token of synonyms) {
      this.vocabulary.add(token);
      if (!this.index.has(token)) {
        this.index.set(token, new Set());
      }
      this.index.get(token)!.add(docId);
    }
  }

  // Find closest token in vocabulary if exact match fails
  private getBestTokens(queryToken: string, maxTypoDistance: number = 2): string[] {
    if (this.index.has(queryToken)) {
      return [queryToken];
    }
    const matches: { token: string; dist: number }[] = [];
    this.vocabulary.forEach((vocabToken) => {
      // Fast length check before Levenshtein
      if (Math.abs(vocabToken.length - queryToken.length) <= maxTypoDistance) {
        const dist = levenshtein(queryToken, vocabToken);
        if (dist <= maxTypoDistance) {
          matches.push({ token: vocabToken, dist });
        }
      }
    });
    // Sort by distance and return top matches
    return matches.sort((a, b) => a.dist - b.dist).map(m => m.token);
  }

  /**
   * Search Engine: Instantaneous Results, Typos, Synonyms, Distance.
   * @param query Search query (e.g., "Spicy Vegan Pizza")
   * @param userLocation User's current location to filter/sort by distance
   * @param maxDistance Radius in meters
   */
  public search(query: string, userLocation: Location, maxDistance: number = 10000): SearchResult[] {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    // Map each query token to possible index tokens (handling typos & synonyms)
    const expandedTokens = queryTokens.map(qt => {
      const syns = getSynonyms(qt);
      const allPossible = new Set<string>();
      for (const syn of syns) {
        const best = this.getBestTokens(syn, qt.length > 4 ? 2 : 1);
        best.forEach(b => allPossible.add(b));
      }
      return Array.from(allPossible);
    });

    // We want documents that match as many query tokens as possible.
    // Score mapping: docId -> score
    const docScores = new Map<string, number>();

    for (const possibleTokens of expandedTokens) {
      const docIdsForThisTokenGroup = new Set<string>();
      
      for (const token of possibleTokens) {
        const docs = this.index.get(token);
        if (docs) {
          docs.forEach(docId => docIdsForThisTokenGroup.add(docId));
        }
      }

      // Add to global scores
      docIdsForThisTokenGroup.forEach(docId => {
        docScores.set(docId, (docScores.get(docId) || 0) + 1);
      });
    }

    // Process results, apply distance filtering
    const results: SearchResult[] = [];
    
    docScores.forEach((tokenMatches, docId) => {
      // Must match at least 50% of the query tokens (or you can do AND logic)
      if (tokenMatches < Math.ceil(queryTokens.length * 0.5)) return;

      const [restId, itemId] = docId.split(':');
      const restaurant = this.restaurants.get(restId);
      if (!restaurant) return;

      const distance = calculateDistance(userLocation, restaurant.location);
      if (distance > maxDistance) return;

      // Base score on token matches, penalize by distance
      // distanceScore is between 0 and 1 (1 if 0m, 0 if maxDistance)
      const distanceScore = Math.max(0, 1 - (distance / maxDistance));
      const finalScore = (tokenMatches * 10) + (distanceScore * 5);

      results.push({
        restaurantId: restId,
        menuItemId: itemId === 'REST' ? undefined : itemId,
        score: finalScore,
        distance
      });
    });

    // Sort by score descending, then distance ascending
    return results.sort((a, b) => b.score - a.score || a.distance - b.distance);
  }
}
