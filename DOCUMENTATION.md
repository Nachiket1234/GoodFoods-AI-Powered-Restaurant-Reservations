
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