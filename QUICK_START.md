# Quick Start Guide - GoodFoods AI Concierge

## Installation & Setup

### Prerequisites
- Node.js (v18+) - [Download here](https://nodejs.org/)

### Steps

1. **Open terminal in project directory:**
   ```bash
   cd c:\Users\nachi\Downloads\goodfoods-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

That's it! The API key is already configured.

---

## Testing the Agent

### Try These Commands:

#### Basic Search
```
"Find Italian restaurants"
"Show me cheap sushi in Downtown"
"Romantic restaurant with rooftop"
```

#### Check Availability
```
"Check availability for The Golden Spoon for 2 people tonight at 7 PM"
"Is The Silver Bistro available tomorrow at 8?"
```

#### Make a Booking
```
"Book a table for 4 at The Golden Spoon tonight at 7 PM"
(Agent will ask for your name)
```

#### View Reservations
```
"Show my reservations for John Doe"
"What bookings do I have?"
```

#### Cancel Reservation
```
"Cancel reservation res-12345"
(Use the reservation ID from booking confirmation)
```

---

## Features to Demonstrate

### 1. Intelligent Recommendations
**Try:** "I want a fancy dinner"
- Agent prioritizes $$$$ venues
- Shows Michelin Starred options
- Highlights premium features

### 2. Contextual Understanding
**Try:** "Cheap family restaurant for 6"
- Filters to $$ price range
- Prioritizes "Family Friendly" feature
- Suggests high-capacity venues

### 3. Availability Handling
**Try booking a popular restaurant:**
- Agent checks availability first
- If booked, suggests alternatives
- Offers different time slots

### 4. Multi-Turn Conversations
```
You: "Find Japanese restaurants in Manhattan"
Agent: [Shows 8 results]
You: "Check the first one for tonight"
Agent: [Remembers context, checks availability]
```

---

## Project Documentation

| File | What It Contains |
|------|------------------|
| **README.md** | Full features, setup, deployment guide |
| **BUSINESS_STRATEGY.md** | Business case, ROI analysis, expansion opportunities |
| **TECHNICAL_DOCUMENTATION.md** | Architecture, agent design, how to extend |
| **PROJECT_SUMMARY.md** | Challenge evaluation summary |

---

## Key Highlights

✅ **100 Restaurants** - Diverse cuisines, locations, features  
✅ **Autonomous Agent** - LLM decides tool usage (no hardcoded logic)  
✅ **Smart Recommendations** - Multi-factor scoring algorithm  
✅ **398% ROI** - Comprehensive business case  
✅ **Production Ready** - Error handling, validation, logging  

---

## Support

If you encounter issues:

1. **Node.js not found:** Install from [nodejs.org](https://nodejs.org/)
2. **Port 3000 in use:** Change port in `vite.config.ts`
3. **API errors:** Verify `.env.local` has correct key

---

## What Makes This Special

### vs. Traditional Booking Systems:
- ❌ OpenTable: Form-based, requires exact details
- ✅ GoodFoods: Natural conversation, interprets vague requests

### vs. Other AI Chatbots:
- ❌ Generic bots: Hardcoded decision trees
- ✅ GoodFoods: LLM autonomously orchestrates tools

### Business Integration:
- Upselling logic in prompts
- Premium venue prioritization
- Fallback strategies for recovery

---

**Ready to explore!** Start with: *"Find me a romantic Italian restaurant"*
