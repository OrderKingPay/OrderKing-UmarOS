export interface UserContext {
  userId: string;
  latitude: number;
  longitude: number;
  currentTime: Date;
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  openingTime: string; // 'HH:mm'
  closingTime: string; // 'HH:mm'
}

export class UserIntentPredictor {
  private availableRestaurants: Restaurant[];

  constructor(restaurants: Restaurant[]) {
    this.availableRestaurants = restaurants;
  }

  /**
   * Pre-loads restaurants likely to match the user's intent based on time and location.
   */
  public predictIntentAndPreload(context: UserContext): Restaurant[] {
    const currentHour = context.currentTime.getHours();
    
    let likelyIntentCategory = 'all';
    
    // Time-of-day based intent prediction
    if (currentHour >= 6 && currentHour < 11) {
      likelyIntentCategory = 'breakfast';
    } else if (currentHour >= 11 && currentHour < 15) {
      likelyIntentCategory = 'lunch';
    } else if (currentHour >= 15 && currentHour < 18) {
      likelyIntentCategory = 'snack';
    } else if (currentHour >= 18 && currentHour < 23) {
      likelyIntentCategory = 'dinner';
    } else {
      likelyIntentCategory = 'late_night';
    }

    return this.availableRestaurants
      .filter(r => this.isRestaurantOpen(r, currentHour))
      .filter(r => this.calculateDistance(context.latitude, context.longitude, r.latitude, r.longitude) <= 10) // within 10 km
      .sort((a, b) => {
        // Prioritize restaurants matching the likely intent category
        const aMatches = a.category.toLowerCase().includes(likelyIntentCategory) ? 1 : 0;
        const bMatches = b.category.toLowerCase().includes(likelyIntentCategory) ? 1 : 0;
        
        if (aMatches !== bMatches) {
          return bMatches - aMatches;
        }

        // Secondary sort by distance
        const distA = this.calculateDistance(context.latitude, context.longitude, a.latitude, a.longitude);
        const distB = this.calculateDistance(context.latitude, context.longitude, b.latitude, b.longitude);
        return distA - distB;
      })
      .slice(0, 10); // Top 10 pre-loaded recommendations
  }

  private isRestaurantOpen(restaurant: Restaurant, currentHour: number): boolean {
    const openHour = parseInt(restaurant.openingTime.split(':')[0], 10);
    const closeHour = parseInt(restaurant.closingTime.split(':')[0], 10);
    
    if (closeHour < openHour) {
      // Over-night open (e.g. 18:00 to 02:00)
      return currentHour >= openHour || currentHour < closeHour;
    }
    return currentHour >= openHour && currentHour < closeHour;
  }

  // Haversine formula to calculate distance in km
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
