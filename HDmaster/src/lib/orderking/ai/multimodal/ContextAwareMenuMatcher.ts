export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export interface MatchedItem {
  menuItem: MenuItem;
  confidence: number;
  spokenName: string;
}

export class ContextAwareMenuMatcher {
  private menu: MenuItem[];

  constructor(menu: MenuItem[]) {
    this.menu = menu;
  }

  // A basic Levenshtein distance implementation for fuzzy matching
  private getLevenshteinDistance(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            )
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Calculate similarity percentage (0 to 1)
  private getSimilarity(a: string, b: string): number {
    const aLower = a.trim().toLowerCase();
    const bLower = b.trim().toLowerCase();
    if (aLower === bLower) return 1.0;
    if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.8;
    
    const distance = this.getLevenshteinDistance(aLower, bLower);
    const maxLength = Math.max(aLower.length, bLower.length);
    return maxLength === 0 ? 1.0 : (maxLength - distance) / maxLength;
  }

  /**
   * Matches a spoken string (e.g. "biryani") to the closest menu item.
   */
  public matchItem(spokenName: string, threshold = 0.4): MatchedItem | null {
    if (!this.menu.length) return null;

    let bestMatch: MenuItem | null = null;
    let highestConfidence = -1;

    for (const item of this.menu) {
      const confidence = this.getSimilarity(spokenName, item.name);
      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = item;
      }
    }

    if (bestMatch && highestConfidence >= threshold) {
      return {
        menuItem: bestMatch,
        confidence: highestConfidence,
        spokenName,
      };
    }

    return null;
  }

  public matchItems(spokenNames: string[], threshold = 0.4): MatchedItem[] {
    const matches: MatchedItem[] = [];
    for (const name of spokenNames) {
      const match = this.matchItem(name, threshold);
      if (match) {
        matches.push(match);
      }
    }
    return matches;
  }
}
