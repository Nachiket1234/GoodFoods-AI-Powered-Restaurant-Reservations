# GoodFoods AI Concierge - Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Agent Design & Tool Calling](#agent-design--tool-calling)
3. [Database & Data Models](#database--data-models)
4. [Frontend Implementation](#frontend-implementation)
5. [Extending the System](#extending-the-system)
6. [Testing & Quality Assurance](#testing--quality-assurance)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend (Vite)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   App.tsx    │  │ Restaurant   │  │  ApiKeyModal.tsx     │  │
│  │ (Chat UI)    │  │   Card.tsx   │  │  (Auth Check)        │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘  │
│         │                                                        │
│         │ sendMessageToGemini()                                 │
│         ▼                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           geminiService.ts (Agent Orchestrator)            │ │
│  │  • Maintains chat session                                  │ │
│  │  • Autonomous tool calling loop                            │ │
│  │  • Error handling & retries                                │ │
│  └───────┬──────────────────────────────────────┬─────────────┘ │
│          │                                       │               │
└──────────┼───────────────────────────────────────┼───────────────┘
           │                                       │
           ▼                                       ▼
    ┌─────────────┐                      ┌──────────────────┐
    │  Gemini API │                      │   mockDb.ts      │
    │ (LLM Brain) │◄─────────────────────│  (Data Layer)    │
    │             │  Function Responses  │                  │
    └─────────────┘                      └──────────────────┘
           │
           │ Function Calls
           ▼
    ┌─────────────────────────────────────────────┐
    │  Tool Definitions (Function Declarations)   │
    │  • searchRestaurants                        │
    │  • checkAvailability                        │
    │  • bookTable                                │
    │  • cancelReservation                        │
    │  • getMyReservations                        │
    └─────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + TypeScript | Type-safe UI components |
| **Build Tool** | Vite 6 | Fast dev server, HMR |
| **LLM** | Google Gemini 2.0 Flash | Intent detection, tool calling |
| **Styling** | Tailwind CSS (via className) | Utility-first styling |
| **Icons** | Lucide React | Consistent iconography |
| **State** | React useState | Local component state |

---

## Agent Design & Tool Calling

### Philosophy: Autonomous vs. Scripted

**Traditional Chatbot (Rule-Based):**
```typescript
// ❌ Hardcoded logic - brittle and inflexible
if (message.includes("book") && message.includes("table")) {
  askForRestaurantName();
  askForDate();
  askForTime();
  callBookingAPI();
}
```

**AI Agent (Intent-Driven):**
```typescript
// ✅ LLM decides what to do based on context
const response = await chatSession.sendMessage(userMessage);
// Model autonomously calls searchRestaurants, checkAvailability, etc.
```

### Tool Calling Protocol (MCP-Inspired)

Our implementation follows Model Context Protocol principles:

1. **Tool Discovery**: LLM receives function schemas at initialization
2. **Intent Detection**: Model analyzes user input and selects appropriate tool(s)
3. **Parameter Extraction**: Model populates function arguments from conversation
4. **Execution Loop**: Agent autonomously chains tools until task completion
5. **Response Generation**: Model synthesizes tool results into natural language

### Implementation Deep Dive

#### Step 1: Tool Definition Schema

```typescript
const searchRestaurantsTool: FunctionDeclaration = {
  name: 'searchRestaurants',
  description: 'Search for restaurants based on criteria. Use this to find options for the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING, description: 'City or neighborhood' },
      cuisine: { type: Type.STRING, description: 'Cuisine type' },
      query: { type: Type.STRING, description: 'Descriptive keywords' }
    },
  }
};
```

**Key Insight:** The `description` field is critical - it's the LLM's guide for when/how to use the tool.

#### Step 2: Agent Execution Loop

```typescript
export const sendMessageToGemini = async (message: string) => {
  // 1. Send user message to LLM
  let result = await chatSession.sendMessage({ message });
  
  // 2. Autonomous loop - LLM decides if tools are needed
  let loopCount = 0;
  const MAX_LOOPS = 8; // Safety limit
  
  while (result.functionCalls && result.functionCalls.length > 0) {
    if (loopCount >= MAX_LOOPS) {
      return { text: "System overload. Please simplify your request." };
    }
    loopCount++;
    
    const toolParts: Part[] = [];
    
    // 3. Execute each tool the LLM requested
    for (const call of result.functionCalls) {
      console.log(`[Agent] Executing ${call.name}`, call.args);
      
      let toolResult;
      switch (call.name) {
        case 'searchRestaurants':
          toolResult = db.searchRestaurants(/*...*/);
          break;
        // ... other tools
      }
      
      // 4. Package result for LLM
      toolParts.push({
        functionResponse: {
          name: call.name,
          response: { result: toolResult },
          id: call.id // Critical for matching
        }
      });
    }
    
    // 5. Feed results back to LLM - it will decide next step
    result = await chatSession.sendMessage(toolParts);
  }
  
  // 6. LLM has finished tool calling - return final text response
  return { text: result.text };
};
```

**Critical Details:**
- **Loop Safety**: `MAX_LOOPS` prevents infinite loops if LLM gets stuck
- **ID Matching**: `call.id` ensures LLM matches responses to requests
- **Autonomous Decision**: LLM decides when to stop calling tools and respond to user

#### Step 3: Tool Implementation (Example)

```typescript
checkAvailability: (restaurantId: string, date: string, time: string, partySize: number) => {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) return { available: false, reason: "Restaurant not found" };
  
  // Parse time
  const [hourStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  
  // Business logic: Check operating hours
  if (hour < restaurant.openHour || hour >= restaurant.closeHour) {
    return { 
      available: false, 
      reason: `Closed at ${time}. Open ${restaurant.openHour}:00 - ${restaurant.closeHour}:00.` 
    };
  }
  
  // Check capacity (simplified slot logic)
  const bookingsAtTime = reservations.filter(r => 
    r.restaurantId === restaurantId && 
    r.date === date && 
    r.time.startsWith(hourStr)
  );
  
  if (bookingsAtTime.length >= 5) {
    return { available: false, reason: "Fully booked. Try ±1 hour." };
  }
  
  return { available: true };
}
```

### System Prompt Engineering

Our system instruction is designed for business outcomes:

**Key Strategies:**
1. **Upselling Logic**: "For generic requests, prioritize $$$-$$$$ venues"
2. **Fallback Behavior**: "If unavailable, suggest alternatives"
3. **Date Parsing**: "Today is November 26, 2025 - use for relative dates"
4. **Validation Mandate**: "NEVER book without checkAvailability"

**Example:**
```
If user says "book a table for 4 tonight", the agent:
1. Calls searchRestaurants (infers current location or asks)
2. Presents 3-5 options
3. User picks one
4. Calls checkAvailability(restaurantId, "2025-11-26", "19:00", 4)
5. If available → calls bookTable
6. If unavailable → suggests alternative times/venues
```

---

## Database & Data Models

### Schema Design

#### Restaurant Model
```typescript
interface Restaurant {
  id: string;              // Unique identifier (rest-1, rest-2, ...)
  name: string;            // Display name
  cuisine: string;         // Italian, Japanese, etc. (24 types)
  location: string;        // Neighborhood (20 locations)
  rating: number;          // 1.0 - 5.0 (weighted towards 4.0+)
  priceRange: '$$' | '$$$' | '$$$$';  // Price tier
  capacity: number;        // Max simultaneous diners
  openHour: number;        // 24hr format (11-17)
  closeHour: number;       // 24hr format (21-23)
  description: string;     // Marketing copy
  features: string[];      // Tags (Rooftop, Romantic, etc.)
}
```

#### Reservation Model
```typescript
interface Reservation {
  id: string;              // res-{timestamp}-{random}
  restaurantId: string;    // Foreign key to Restaurant
  restaurantName: string;  // Denormalized for display
  customerName: string;    // User identifier
  date: string;            // YYYY-MM-DD
  time: string;            // HH:MM (24hr)
  partySize: number;       // Number of guests
  status: 'confirmed' | 'cancelled';
}
```

### Data Generation Strategy

**Goal:** 100 realistic restaurants with diverse characteristics

**Distribution:**
- **Price Range**: 45% $$, 40% $$$, 15% $$$$
- **Ratings**: Bell curve around 4.0 (range 3.5-5.0)
- **Cuisines**: 24 types (Italian, Japanese, Ethiopian, etc.)
- **Locations**: 20 neighborhoods (Manhattan, Brooklyn, SoHo, etc.)
- **Features**: 35% probability per feature (results in 2-5 features/restaurant)

**Realism Enhancements:**
```typescript
// Capacity based on price tier
const capacityBase = priceRange === '$$$$' ? 40 : priceRange === '$$$' ? 60 : 80;
const capacity = capacityBase + Math.floor(Math.random() * 80);

// Operating hours (70% do lunch, 30% dinner-only)
const openHour = Math.random() > 0.7 ? 11 : Math.random() > 0.4 ? 12 : 17;
```

### Recommendation Algorithm

**Scoring System** (in `searchRestaurants`):

```typescript
score = baseRating + contextualBoosts + penaltyFactors

// Base: Restaurant rating (0-5 points)
// Boosts:
// - Name/description match: +2-3 points
// - Feature match: +2 per feature
// - Keyword context:
//   * "cheap" → $$ venues +5, $$$$ venues -3
//   * "romantic" → Romantic/Rooftop/Private Dining +4
//   * "family" → Family Friendly +5, high capacity +2
//   * "business" → Business Dining/Private +4
```

**Example:**
User asks: "romantic Italian restaurant in Manhattan"

1. Filter: `cuisine=Italian`, `location=Manhattan`
2. Score boosts for restaurants with:
   - "Romantic" feature: +4
   - Rooftop/Private Dining: +4
   - High price tier ($$$-$$$$): +2
3. Sort by total score, return top 8

---

## Frontend Implementation

### Component Hierarchy

```
<App>
├── <ApiKeyModal />          // Blocks UI if API key missing
├── <header>                 // Branding
├── <ChatArea>              // Scrollable message feed
│   └── {messages.map(...)}
│       ├── UserMessage      // Right-aligned, green
│       └── AIMessage        // Left-aligned, white
│           └── <RestaurantCard>[]  // Horizontal scroll
└── <InputArea>
    ├── Quick Actions        // Suggested prompts
    └── Text Input + Send
```

### State Management

```typescript
const [messages, setMessages] = useState<Message[]>([/* welcome message */]);
const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
const [input, setInput] = useState('');
```

**Flow:**
1. User types → `setInput(text)`
2. User hits Enter → `handleSend()`
3. Add user message to `messages`, set loading state
4. Call `sendMessageToGemini(input)`
5. Receive response, add AI message to `messages`
6. Reset loading state

### Restaurant Card Component

**Purpose:** Visual display of search results

**Features:**
- Star rating badge
- Cuisine + location tags
- Feature pills (limited to 3 for space)
- Operating hours, capacity, price range
- CTA button: "Check Availability"

**Click Handler:**
```typescript
const handleCardClick = (restaurantName: string) => {
  setInput(`Check availability for ${restaurantName} for 2 people tonight at 7 PM`);
  // User can edit before sending
};
```

---

## Extending the System

### Adding New Tools

**Step 1:** Define function schema in `geminiService.ts`
```typescript
const modifyReservationTool: FunctionDeclaration = {
  name: 'modifyReservation',
  description: 'Change date/time/party size for existing reservation',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reservationId: { type: Type.STRING },
      newDate: { type: Type.STRING, description: 'YYYY-MM-DD' },
      newTime: { type: Type.STRING, description: 'HH:MM' },
      newPartySize: { type: Type.NUMBER }
    },
    required: ['reservationId']
  }
};
```

**Step 2:** Add to tools array
```typescript
const tools: Tool[] = [{
  functionDeclarations: [
    searchRestaurantsTool,
    // ... existing tools
    modifyReservationTool  // ✅ Add here
  ]
}];
```

**Step 3:** Implement handler in agent loop
```typescript
switch (call.name) {
  // ... existing cases
  case 'modifyReservation':
    toolResult = db.modifyReservation(
      call.args.reservationId as string,
      call.args.newDate as string,
      // ...
    );
    break;
}
```

**Step 4:** Implement database function in `mockDb.ts`
```typescript
modifyReservation: (resId: string, newDate: string, newTime: string, newPartySize: number) => {
  const res = reservations.find(r => r.id === resId);
  if (!res) return { error: "Reservation not found" };
  
  // Re-check availability
  const check = db.checkAvailability(res.restaurantId, newDate, newTime, newPartySize);
  if (!check.available) return { error: check.reason };
  
  // Update
  res.date = newDate;
  res.time = newTime;
  res.partySize = newPartySize;
  return res;
}
```

**Step 5:** Update system instruction to mention new capability
```typescript
systemInstruction = `...
4. **Modification**: Allow users to change existing reservations via modifyReservation tool
...`
```

### Adding New Features to Restaurant Model

**Example:** Add `amenities` field for parking, Wi-Fi, etc.

**Step 1:** Update type definition in `types.ts`
```typescript
export interface Restaurant {
  // ... existing fields
  amenities?: string[];  // ['Free Parking', 'WiFi', 'Wheelchair Accessible']
}
```

**Step 2:** Update data generator in `mockDb.ts`
```typescript
const AMENITIES = ['Free Parking', 'WiFi', 'Wheelchair Accessible', 'Valet', 'EV Charging'];

restaurants.push({
  // ... existing fields
  amenities: AMENITIES.filter(() => Math.random() > 0.6)
});
```

**Step 3:** Display in `RestaurantCard.tsx`
```tsx
{data.amenities && data.amenities.length > 0 && (
  <div className="flex gap-1 text-xs text-gray-500">
    {data.amenities.map(a => <span key={a}>✓ {a}</span>)}
  </div>
)}
```

**Step 4:** Update search logic to match amenities
```typescript
if (r.amenities?.some(a => a.toLowerCase().includes(q))) {
  score += 3;
}
```

### Integrating Real APIs

**Replace Mock Database with Live Backend:**

**Step 1:** Create API client
```typescript
// services/apiClient.ts
const API_BASE = 'https://api.goodfoods.com/v1';

export const searchRestaurants = async (filters: SearchFilters) => {
  const response = await fetch(`${API_BASE}/restaurants/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  });
  return response.json();
};
```

**Step 2:** Update tool handlers
```typescript
case 'searchRestaurants':
  toolResult = await apiClient.searchRestaurants({
    location: call.args.location,
    cuisine: call.args.cuisine,
    query: call.args.query
  });
  break;
```

**Step 3:** Handle async operations
```typescript
// Make tool execution async
const toolParts: Part[] = await Promise.all(
  result.functionCalls.map(async (call) => {
    const toolResult = await executeToolAsync(call);
    return { functionResponse: { /*...*/ } };
  })
);
```

---

## Testing & Quality Assurance

### Manual Testing Checklist

#### Search Functionality
- [ ] Generic search: "Find a restaurant"
- [ ] Cuisine filter: "Italian restaurants in Manhattan"
- [ ] Budget constraint: "Cheap sushi near Downtown"
- [ ] Feature request: "Romantic restaurant with rooftop"
- [ ] No results: "Mongolian food in Brooklyn" (should suggest alternatives)

#### Booking Flow
- [ ] Full flow: Search → Select → Check availability → Book
- [ ] Availability check fails (fully booked) → Suggests alternatives
- [ ] Booking outside hours → Rejects with reason
- [ ] Missing customer name → Asks for it
- [ ] Successful booking → Returns confirmation with ID

#### Reservation Management
- [ ] View reservations: "Show my bookings for John Doe"
- [ ] Cancel: "Cancel reservation res-12345"
- [ ] Non-existent reservation → Handles gracefully

#### Edge Cases
- [ ] Ambiguous date: "next Friday" (should calculate correctly)
- [ ] Invalid party size: "100 people" (exceeds all capacities)
- [ ] Typo in restaurant name → Fuzzy matches or asks for clarification
- [ ] Long conversation → Maintains context across 10+ messages

### Automated Testing (Future)

**Unit Tests** (Jest + React Testing Library)
```typescript
// tests/geminiService.test.ts
describe('sendMessageToGemini', () => {
  it('should handle search queries', async () => {
    const result = await sendMessageToGemini("Find Italian restaurants");
    expect(result.relatedData).toHaveLength(8);
  });
  
  it('should prevent booking without availability check', async () => {
    const result = await sendMessageToGemini("Book The Golden Spoon for tonight");
    // Should call checkAvailability before bookTable
    expect(mockDb.checkAvailability).toHaveBeenCalled();
  });
});
```

**Integration Tests**
```typescript
// tests/e2e/booking.test.ts
describe('End-to-end booking', () => {
  it('completes full booking flow', async () => {
    render(<App />);
    
    // User searches
    fireEvent.change(screen.getByPlaceholderText('Type your request...'), {
      target: { value: 'Italian in Manhattan' }
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Wait for results
    await waitFor(() => expect(screen.getByText(/Golden/i)).toBeInTheDocument());
    
    // Click card
    fireEvent.click(screen.getByText('Check Availability'));
    
    // Confirm booking
    // ... assertions
  });
});
```

### Performance Optimization

**Current Bottlenecks:**
1. **LLM Latency**: 1-3 seconds per round trip
2. **Tool Chaining**: Up to 8 loops × 1-3 seconds each

**Mitigations:**
- **Streaming Responses**: Use Gemini streaming API for perceived performance
- **Parallel Tool Execution**: When multiple independent tools called
- **Caching**: Cache restaurant search results for 5 minutes
- **Optimistic UI**: Show "searching..." state immediately

**Example Streaming:**
```typescript
for await (const chunk of chatSession.sendMessageStream(message)) {
  setMessages(prev => {
    const last = prev[prev.length - 1];
    last.content += chunk.text;
    return [...prev];
  });
}
```

---

## Deployment

### Environment Variables

**Required:**
- `GEMINI_API_KEY`: Google AI Studio API key

**Optional:**
- `VITE_API_BASE_URL`: If using real backend API
- `VITE_ANALYTICS_ID`: For usage tracking

### Build Commands

```bash
# Development
npm run dev         # Starts dev server at http://localhost:3000

# Production
npm run build       # Creates dist/ folder
npm run preview     # Preview production build locally
```

### Hosting Options

**Recommended: Vercel**
```bash
vercel deploy
# Set GEMINI_API_KEY in dashboard environment variables
```

**Alternative: Netlify**
```bash
netlify deploy --prod
```

**Docker (Self-Hosted)**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

---

## Security Considerations

### API Key Protection
- ✅ Never commit `.env.local` to git (in `.gitignore`)
- ✅ Use environment variables in production
- ❌ Do NOT expose key in client-side code (currently safe - Vite replaces at build time)

### Data Privacy
- User names stored in-memory only (no persistence)
- No PII logged to console in production
- HTTPS required for production deployment

### Input Validation
- LLM handles most validation via tool schemas
- Backend should re-validate all bookings (defense-in-depth)
- Rate limiting on API routes to prevent abuse

---

## Troubleshooting

### Common Issues

**Problem:** "API Key missing" error
- **Solution:** Ensure `.env.local` exists with `GEMINI_API_KEY=your_key`
- Restart dev server after adding key

**Problem:** LLM not calling tools
- **Solution:** Check system instruction clarity
- Verify tool descriptions are specific enough
- Review console logs for `[Agent Action]` messages

**Problem:** Infinite loop in agent
- **Solution:** Increase `MAX_LOOPS` limit (currently 8)
- Check if tool is returning valid response format
- Add console logs to debug loop iterations

**Problem:** Restaurant cards not showing
- **Solution:** Verify `relatedData` is set in geminiService
- Check `lastToolResultData` assignment in search tool handler
- Inspect React DevTools for `msg.relatedData`

---

## Future Enhancements

### Phase 2 Features
1. **User Authentication**: Persistent profiles, saved preferences
2. **Email/SMS Confirmations**: Twilio integration for notifications
3. **Voice Interface**: Google Assistant/Alexa integration
4. **Multi-Language**: Spanish, Mandarin support
5. **Group Bookings**: Coordinate reservations across multiple venues

### Phase 3 Intelligence
1. **Personalization Engine**: ML-based preference learning
2. **Dynamic Pricing**: Yield management for peak hours
3. **Waitlist Management**: Auto-notify when slots open
4. **POS Integration**: Real-time table availability from restaurant systems

### Phase 4 Platform
1. **White-Label SaaS**: Multi-tenant architecture
2. **API Marketplace**: Third-party integrations
3. **Analytics Dashboard**: Restaurant-facing insights
4. **Mobile App**: React Native version

---

*Last Updated: November 26, 2025*  
*For questions or contributions, contact: dev@goodfoods.ai*
