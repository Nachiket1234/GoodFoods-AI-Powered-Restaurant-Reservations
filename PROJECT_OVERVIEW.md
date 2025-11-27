## Sample Prompts

Try these example prompts in the chat UI:

- "Find a romantic Italian restaurant in Manhattan."
- "Book a table for 4 at a sushi place near Downtown tonight."
- "Show me vegan-friendly options with outdoor seating."
- "Check availability for The Golden Spoon for 2 people at 7 PM."
- "Cancel my reservation for tomorrow."
- "List my upcoming reservations."

You can ask for recommendations, search by cuisine/location/features, check availability, book, or manage reservations.
# GoodFoods AI-Powered Restaurant Reservations: Project Overview

## Project Description
An end-to-end AI-powered restaurant reservation agent. Users can discover restaurants, get recommendations, check availability, and book instantly. The system uses a modern frontend and a backend agent powered by Llama (via OpenRouter) with dynamic tool calling (MCP/A2A protocols).

## Architecture
- **Frontend:** React (TypeScript) web app for chat-based interaction and restaurant browsing.
- **Backend Agent:** Custom service integrating Llama via OpenRouter. Handles user queries, determines intent, and calls tools (search, recommend, reserve, cancel) using MCP/A2A protocols.
- **Database:** In-memory mock database with 100 synthetic restaurants, each with name, location, cuisine, seating capacity, cost, and features.

## Key Features
- 50–100 restaurant locations with varied attributes
- LLM-driven recommendations and search
- Real-time availability checks and booking
- Tool calling architecture: LLM selects tools based on user intent (not hardcoded)
- No LangChain or similar frameworks

## Workflow
1. **User Input:** User enters a request in the chat UI (e.g., "Find a romantic Italian restaurant in Manhattan").
2. **Frontend:** Sends the request to the backend agent.
3. **LLM Processing:** Llama model receives the message, determines intent, and selects the appropriate tool (search, check availability, book, etc.).
4. **Tool Execution:** Backend executes the tool call using the mock database.
5. **Response:** LLM synthesizes a response and sends it back to the frontend, which displays results and cards.

## File Structure
- `App.tsx`: Main React app and chat UI
- `components/RestaurantCard.tsx`: Restaurant display card
- `data/mockDb.ts`: Restaurant data and logic
- `services/openRouterService.ts`: Backend agent logic and tool orchestration
- `types.ts`: Type definitions
- `README.md`: Project summary and setup
- `DOCUMENTATION.md`: Detailed codebase explanation

## How to Run
1. Install dependencies: `npm install`
2. Start the app: `npm run dev`
3. Open in browser: `http://localhost:3000` (or next available port)

## API Key
Update the OpenRouter API key in `services/openRouterService.ts` as needed.

## Extensibility
The system is designed for easy extension: add new tools, models, or data sources as needed.