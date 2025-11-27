# GoodFoods AI Concierge: Codebase Overview & Workflow

## Project Description
End-to-end AI-powered restaurant reservation agent. Users can discover, get recommendations, check availability, and book instantly. Powered by Llama (OpenRouter) with dynamic tool calling (MCP/A2A).

## Architecture
- **Frontend:** React (TypeScript) chat UI and restaurant browsing.
- **Backend Agent:** Custom service with Llama via OpenRouter. Handles queries, determines intent, and calls tools (search, recommend, reserve, cancel) using MCP/A2A.
- **Database:** In-memory mock database with 100 synthetic restaurants (name, location, cuisine, seating, cost, features).

## Key Features
- 50–100 restaurant locations
- LLM-driven recommendations and search
- Real-time availability and booking
- Tool calling: LLM selects tools by intent
- No LangChain or similar frameworks

## Workflow
1. User enters request in chat UI (`App.tsx`).
2. Frontend sends request to backend agent (`openRouterService.ts`).
3. LLM determines intent and selects tool (search, check, book, etc.).
4. Backend executes tool using `mockDb.ts`.
5. LLM synthesizes response, frontend displays results/cards.

## File Structure
- `App.tsx`: Main React app and chat UI
- `components/RestaurantCard.tsx`: Restaurant display card
- `data/mockDb.ts`: Restaurant data and logic
- `services/openRouterService.ts`: Backend agent logic/tool orchestration
- `types.ts`: Type definitions
- `PROJECT_OVERVIEW.md`: Project summary and sample prompts

## Extensibility
Easily add new tools, models, or data sources.

## Sample Prompts
- "Find a romantic Italian restaurant in Manhattan."
- "Book a table for 4 at a sushi place near Downtown tonight."
- "Show me vegan-friendly options with outdoor seating."
- "Check availability for The Golden Spoon for 2 people at 7 PM."
- "Cancel my reservation for tomorrow."
- "List my upcoming reservations."

# GoodFoods AI Concierge: Codebase Overview & Workflow

## Major Files & Components

- `App.tsx`: Main React app. Handles user input, displays chat, and renders restaurant cards. Orchestrates communication with the backend agent.
- `components/RestaurantCard.tsx`: UI card for displaying restaurant details and booking actions.
- `components/ApiKeyModal.tsx`: Modal for entering/updating API keys (if needed).
- `data/mockDb.ts`: In-memory database generator for 100 synthetic restaurants. Handles search, availability, booking, and cancellation logic.
- `services/openRouterService.ts`: Backend agent logic. Integrates with OpenRouter/Llama, defines tool schemas, manages conversation history, and executes tool calls based on LLM intent.
- `index.tsx`, `index.html`, `index.css`: App entry point and global styles.
- `types.ts`: TypeScript type definitions for messages, restaurants, reservations, etc.
- `README.md`: Project summary, setup instructions, and file cleanup documentation.
- `DOCUMENTATION.md`: (this file) Explains codebase structure and workflow.

## Workflow Overview

1. **User Interaction**: User enters a request in the chat UI (`App.tsx`).
2. **Frontend Processing**: The app sends the message to the backend agent (`openRouterService.ts`).
3. **LLM Intent Detection**: LLM receives the message, determines intent, and selects the appropriate tool (search, check availability, book, cancel, etc.) using MCP/A2A protocols.
4. **Tool Execution**: The backend executes the tool call (e.g., searches restaurants, checks availability) using logic in `mockDb.ts`.
5. **Response Loop**: Results are sent back to the LLM, which may call additional tools or synthesize a final response.
6. **Frontend Display**: The final response and any related data (e.g., restaurant cards) are displayed in the UI.

## Notes
- All agent logic is custom-built; no LangChain or similar frameworks are used.
- The system is designed for extensibility and can support additional tools or LLMs as needed.