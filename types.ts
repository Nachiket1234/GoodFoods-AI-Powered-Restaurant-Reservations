export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  rating: number;
  priceRange: '$$' | '$$$' | '$$$$';
  capacity: number;
  openHour: number; // 24hr format, e.g., 17 for 5 PM
  closeHour: number; // 24hr format, e.g., 23 for 11 PM
  description: string;
  features: string[]; // e.g., "Rooftop", "Romantic", "Family Friendly"
}

export interface Reservation {
  id: string;
  restaurantId: string;
  restaurantName: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  partySize: number;
  status: 'confirmed' | 'cancelled';
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  relatedData?: Restaurant[]; // For displaying rich cards
  isToolOutput?: boolean;
}

export enum LoadingState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  EXECUTING_TOOL = 'EXECUTING_TOOL',
}