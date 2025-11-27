import { Restaurant, Reservation } from '../types';

// --- Generators ---

const CUISINES = [
  'Italian', 'Japanese', 'Mexican', 'Indian', 'French', 'American', 'Thai', 
  'Mediterranean', 'Steakhouse', 'Fusion', 'Chinese', 'Korean', 'Vietnamese', 
  'Greek', 'Spanish', 'Middle Eastern', 'Brazilian', 'Caribbean', 'Seafood', 
  'Vegan', 'Ethiopian', 'Peruvian', 'German', 'British'
];

const LOCATIONS = [
  'Downtown', 'Manhattan', 'Brooklyn', 'West End', 'Seaport', 'Uptown', 
  'Financial District', 'SoHo', 'Tribeca', 'Chelsea', 'Greenwich Village', 
  'East Village', 'Midtown', 'Upper East Side', 'Williamsburg', 'Queens', 
  'Harlem', 'Lower Manhattan', 'DUMBO', 'Park Slope'
];

const FEATURES = [
  'Rooftop', 'Romantic', 'Outdoor Seating', 'Live Music', 'Vegetarian Friendly', 
  'Waterfront View', 'Private Dining', 'Michelin Starred', 'Wine Bar', 'Craft Cocktails', 
  'Farm-to-Table', 'Pet Friendly', 'Vegan Options', 'Gluten-Free Menu', 'Happy Hour', 
  'Late Night', 'Brunch', 'Birthday Specials', 'Date Night', 'Family Friendly', 
  'Business Dining', 'Chef\'s Table', 'Tasting Menu', 'BYOB'
];

const NAMES_PREFIX = [
  'The', 'Golden', 'Blue', 'Rustic', 'Modern', 'Urban', 'Cozy', 'Grand', 'Silver', 
  'Velvet', 'Iron', 'Glass', 'Royal', 'Elegant', 'Classic', 'Nouveau', 'Pearl', 
  'Emerald', 'Sunset', 'Harbor', 'Garden', 'Oak', 'Marble', 'Crimson'
];

const NAMES_SUFFIX = [
  'Spoon', 'Fork', 'Table', 'Kitchen', 'Bistro', 'Grill', 'House', 'Garden', 
  'Patio', 'Social', 'Lounge', 'Steakhouse', 'Tavern', 'Cafe', 'Eatery', 
  'Parlor', 'Corner', 'Plaza', 'Room', 'Club', 'Diner', 'Hall', 'Hideaway'
];

const generateRestaurants = (count: number): Restaurant[] => {
  const restaurants: Restaurant[] = [];
  for (let i = 0; i < count; i++) {
    const cuisine = CUISINES[Math.floor(Math.random() * CUISINES.length)];
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const name = `${NAMES_PREFIX[Math.floor(Math.random() * NAMES_PREFIX.length)]} ${NAMES_SUFFIX[Math.floor(Math.random() * NAMES_SUFFIX.length)]}`;
    
    // Weighted rating generation for realism (bell curve around 4.0)
    const baseRating = 3.5;
    const ratingVariance = Math.random() * 1.5;
    const rating = Math.min(5, baseRating + ratingVariance);

    // Synthetic arbitrary cost value (e.g., 20–200)
    const cost = Math.floor(20 + Math.random() * 180); // 20 to 200

    // Realistic capacity based on cost
    const capacityBase = cost > 150 ? 40 : cost > 80 ? 60 : 80;
    const capacity = capacityBase + Math.floor(Math.random() * 80);

    // Varied operating hours
    const openHour = Math.random() > 0.7 ? 11 : Math.random() > 0.4 ? 12 : 17; // Some lunch, some dinner only
    const closeHour = Math.random() > 0.8 ? 23 : Math.random() > 0.5 ? 22 : 21;

    // More descriptive text
    const featureHighlight = FEATURES[Math.floor(Math.random() * FEATURES.length)].toLowerCase();
    const descriptions = [
      `Experience the finest ${cuisine.toLowerCase()} dining in ${location}. Known for our ${featureHighlight} atmosphere.`,
      `Authentic ${cuisine.toLowerCase()} cuisine in the heart of ${location}. Perfect for ${featureHighlight} occasions.`,
      `Award-winning ${cuisine.toLowerCase()} restaurant featuring ${featureHighlight}. A ${location} favorite since 2015.`,
      `Modern ${cuisine.toLowerCase()} fusion with a ${featureHighlight} vibe. Located in vibrant ${location}.`,
      `Traditional ${cuisine.toLowerCase()} flavors meet contemporary style. Enjoy ${featureHighlight} in ${location}.`
    ];

    restaurants.push({
      id: `rest-${i + 1}`,
      name: i < 10 ? name : `${name} ${i+1}`,
      cuisine,
      location,
      rating: Number(rating.toFixed(1)),
      cost, // synthetic cost value
      capacity,
      openHour,
      closeHour,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      features: FEATURES.filter(() => Math.random() > 0.65),
    });
  }
  return restaurants;
};

// --- In-Memory Store ---

const restaurants: Restaurant[] = generateRestaurants(100);
const reservations: Reservation[] = [];

// --- Database Logic ---

export const db = {
  /**
   * Fuzzy search for restaurants with intelligent ranking.
   * Implements recommendation engine with multi-factor scoring.
   */
  searchRestaurants: (location?: string, cuisine?: string, query?: string): Restaurant[] => {
    let results = restaurants;

    // Filter by location
    if (location && location.toLowerCase() !== 'any') {
      results = results.filter(r => r.location.toLowerCase().includes(location.toLowerCase()));
    }
    
    // Filter by cuisine
    if (cuisine && cuisine.toLowerCase() !== 'any') {
      results = results.filter(r => r.cuisine.toLowerCase().includes(cuisine.toLowerCase()));
    }
    
    // Intelligent query-based filtering with scoring
    if (query) {
      const q = query.toLowerCase();
      
      // Keyword-based filtering and scoring
      results = results.map(r => {
        let score = 0;
        
        // Base score from rating (0-5 points)
        score += r.rating;
        
        // Name/description match (bonus points)
        if (r.name.toLowerCase().includes(q)) score += 3;
        if (r.description.toLowerCase().includes(q)) score += 2;
        
        // Feature matching (high value)
        const featureMatches = r.features.filter(f => f.toLowerCase().includes(q)).length;
        score += featureMatches * 2;
        
        // Contextual keyword boosting
        if (q.includes('cheap') || q.includes('budget') || q.includes('affordable')) {
          if (r.priceRange === '$$') score += 5;
          if (r.priceRange === '$$$$') score -= 3; // Penalize expensive
        }
        
        if (q.includes('romantic') || q.includes('date') || q.includes('anniversary')) {
          if (r.features.some(f => ['Romantic', 'Private Dining', 'Rooftop', 'Waterfront View'].includes(f))) {
            score += 4;
          }
          if (r.priceRange === '$$$$' || r.priceRange === '$$$') score += 2;
        }
        
        if (q.includes('family') || q.includes('kids')) {
          if (r.features.includes('Family Friendly')) score += 5;
          if (r.capacity > 100) score += 2; // Larger venues better for families
        }
        
        if (q.includes('business') || q.includes('corporate') || q.includes('meeting')) {
          if (r.features.some(f => ['Business Dining', 'Private Dining', 'Quiet'].includes(f))) {
            score += 4;
          }
        }
        
        if (q.includes('fancy') || q.includes('upscale') || q.includes('fine dining')) {
          if (r.priceRange === '$$$$') score += 5;
          if (r.features.includes('Michelin Starred')) score += 8;
        }
        
        if (q.includes('rooftop') || q.includes('outdoor') || q.includes('view')) {
          if (r.features.some(f => ['Rooftop', 'Outdoor Seating', 'Waterfront View'].includes(f))) {
            score += 6;
          }
        }
        
        return { ...r, score };
      });
      
      // Filter out low-scoring results (must match at least something)
      results = results.filter(r => (r as any).score > 3);
      
      // Sort by score
      results = results.sort((a, b) => (b as any).score - (a as any).score);
    } else {
      // No query - sort by rating and price (premium positioning)
      results = results.sort((a, b) => {
        const priceWeight = { '$$$$': 3, '$$$': 2, '$$': 1 };
        const aScore = a.rating + (priceWeight[a.priceRange] * 0.3);
        const bScore = b.rating + (priceWeight[b.priceRange] * 0.3);
        return bScore - aScore;
      });
    }
    
    // Limit to top 8 results for UX
    return results.slice(0, 8);
  },

  getRestaurantById: (id: string): Restaurant | undefined => {
    return restaurants.find(r => r.id === id);
  },

  /**
   * Core logic for availability checks. 
   * Handles capacity, hours, and existing booking conflicts.
   */
  checkAvailability: (restaurantId: string, date: string, time: string, partySize: number): { available: boolean; reason?: string } => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) return { available: false, reason: "Restaurant ID not found in database." };

    // Parse time (HH:MM)
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    
    if (isNaN(hour)) return { available: false, reason: "Invalid time format. Use HH:MM." };

    // Check Operating Hours
    if (hour < restaurant.openHour || hour >= restaurant.closeHour) {
      return { 
        available: false, 
        reason: `Closed at ${time}. Open hours: ${restaurant.openHour}:00 - ${restaurant.closeHour}:00.` 
      };
    }

    // Check Capacity
    if (partySize > restaurant.capacity) {
      return { available: false, reason: `Party size ${partySize} exceeds max capacity (${restaurant.capacity}).` };
    }

    // Check Bookings
    const existingBookings = reservations.filter(
      r => r.restaurantId === restaurantId && r.date === date && r.status === 'confirmed'
    );
    
    // Simulate capacity fill (simple logic: 5 bookings max per slot per restaurant)
    const bookingsAtTime = existingBookings.filter(r => r.time.startsWith(hourStr));
    if (bookingsAtTime.length >= 5) {
        return { available: false, reason: "No tables available at this specific time. Please try +/- 1 hour." };
    }

    return { available: true };
  },

  createReservation: (restaurantId: string, date: string, time: string, partySize: number, customerName: string): Reservation | { error: string } => {
    // Re-validate availability to prevent race conditions
    const check = db.checkAvailability(restaurantId, date, time, partySize);
    if (!check.available) {
        return { error: `Booking Failed: ${check.reason}` };
    }

    const restaurant = restaurants.find(r => r.id === restaurantId);
    
    const reservation: Reservation = {
      id: `res-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      restaurantId,
      restaurantName: restaurant?.name || "Unknown",
      customerName,
      date,
      time,
      partySize,
      status: 'confirmed',
    };
    reservations.push(reservation);
    return reservation;
  },

  cancelReservation: (reservationId: string): boolean => {
    const res = reservations.find(r => r.id === reservationId);
    if (res) {
      res.status = 'cancelled';
      return true;
    }
    return false;
  },

  getUserReservations: (customerName: string): Reservation[] => {
    if (!customerName) return [];
    return reservations.filter(r => 
        r.customerName.toLowerCase().includes(customerName.toLowerCase()) && 
        r.status === 'confirmed'
    );
  }
};