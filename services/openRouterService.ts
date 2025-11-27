import { db } from "../data/mockDb";

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ""; // Uses Vercel environment variable
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.3-70b-instruct"; // Using Llama 3.3 70B

// Tool definitions for OpenRouter (OpenAI-compatible format)
const tools = [
  {
    type: "function",
    function: {
      name: "searchRestaurants",
      description: "Search for restaurants based on criteria like location, cuisine type, or descriptive keywords. Use this to find restaurant options for the user.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City or neighborhood (e.g., Manhattan, Downtown, Brooklyn)" },
          cuisine: { type: "string", description: "Cuisine type (e.g., Italian, Japanese, Mexican)" },
          query: { type: "string", description: "Descriptive keywords (e.g., romantic, rooftop, cheap, quiet, family-friendly)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "checkAvailability",
      description: "Check if a specific restaurant has a table available for a given date, time, and party size. ALWAYS use this before making a booking.",
      parameters: {
        type: "object",
        properties: {
          restaurantId: { type: "string", description: "The exact ID of the restaurant (e.g., rest-1, rest-42)" },
          date: { type: "string", description: "Date in YYYY-MM-DD format (e.g., 2025-11-27)" },
          time: { type: "string", description: "Time in HH:MM 24-hour format (e.g., 19:00 for 7 PM)" },
          partySize: { type: "number", description: "Number of guests" }
        },
        required: ["restaurantId", "date", "time", "partySize"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "bookTable",
      description: "Finalize and confirm a restaurant reservation. Only use this AFTER checking availability and getting user confirmation.",
      parameters: {
        type: "object",
        properties: {
          restaurantId: { type: "string", description: "The restaurant ID" },
          date: { type: "string", description: "Date in YYYY-MM-DD format" },
          time: { type: "string", description: "Time in HH:MM format" },
          partySize: { type: "number", description: "Number of guests" },
          customerName: { type: "string", description: "Name for the reservation" }
        },
        required: ["restaurantId", "date", "time", "partySize", "customerName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancelReservation",
      description: "Cancel an existing reservation using its reservation ID.",
      parameters: {
        type: "object",
        properties: {
          reservationId: { type: "string", description: "The reservation ID to cancel (e.g., res-123456)" }
        },
        required: ["reservationId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getMyReservations",
      description: "Retrieve all confirmed reservations for a customer by their name.",
      parameters: {
        type: "object",
        properties: {
          customerName: { type: "string", description: "Customer name to look up reservations for" }
        },
        required: ["customerName"]
      }
    }
  }
];

// System prompt for the AI agent
const systemPrompt = `You are the GoodFoods Concierge, an elite AI agent for restaurant reservations. You help users discover restaurants, check availability, and make bookings.

CORE CAPABILITIES:
1. **Search**: Find restaurants by location, cuisine, or features (romantic, rooftop, cheap, etc.)
2. **Check Availability**: Verify table availability before booking
3. **Book**: Confirm reservations after availability check
4. **Manage**: View or cancel existing reservations

IMPORTANT RULES:
- Today's date is November 27, 2025 (Wednesday)
- "Tonight" = 2025-11-27, "Tomorrow" = 2025-11-28
- Default party size is 2 unless specified
- ALWAYS check availability before booking
- When showing search results, mention 2-3 top options with their key features
- If unavailable, suggest alternative times or similar restaurants

RESPONSE STYLE:
- Be warm, professional, and concise
- After searches, ask if user wants to check availability
- After availability checks, ask for customer name to complete booking
- Include restaurant IDs when referencing specific venues

TOOL USAGE:
- Use searchRestaurants for discovery queries
- Use checkAvailability before any booking (required!)
- Use bookTable only after confirmed availability AND customer name
- Use getMyReservations when user asks about their bookings
- Use cancelReservation with the reservation ID`;

// Conversation history for context
let conversationHistory: Array<{role: string, content: string, tool_calls?: any[], tool_call_id?: string, name?: string}> = [];

// Execute a tool call
function executeTool(name: string, args: any): any {
  console.log(`[Agent] Executing tool: ${name}`, args);
  
  switch (name) {
    case 'searchRestaurants':
      return db.searchRestaurants(args.location, args.cuisine, args.query);
    case 'checkAvailability':
      return db.checkAvailability(args.restaurantId, args.date, args.time, args.partySize);
    case 'bookTable':
      return db.createReservation(args.restaurantId, args.date, args.time, args.partySize, args.customerName);
    case 'cancelReservation':
      const success = db.cancelReservation(args.reservationId);
      return { success, status: success ? "Cancelled" : "NotFound" };
    case 'getMyReservations':
      return db.getUserReservations(args.customerName);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// Main function to send messages
export const sendMessageToGemini = async (message: string): Promise<{ text: string, relatedData?: any }> => {
  // Add user message to history
  conversationHistory.push({ role: "user", content: message });
  
  let lastToolResultData: any = null;
  let loopCount = 0;
  const MAX_LOOPS = 8;

  try {
    while (loopCount < MAX_LOOPS) {
      loopCount++;
      
      // Make API request to OpenRouter
      const response = await fetch(OPENROUTER_BASE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "GoodFoods AI Concierge"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory
          ],
          tools: tools,
          tool_choice: "auto",
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API Error:", response.status, errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;
      
      // Check if the model wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Add assistant message with tool calls to history
        conversationHistory.push({
          role: "assistant",
          content: assistantMessage.content || "",
          tool_calls: assistantMessage.tool_calls
        });
        
        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          const toolResult = executeTool(functionName, functionArgs);
          
          // Capture search results for UI
          if (functionName === 'searchRestaurants' && Array.isArray(toolResult) && toolResult.length > 0) {
            lastToolResultData = toolResult;
          }
          
          // Add tool result to history
          conversationHistory.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(toolResult)
          });
        }
        
        // Continue loop to get model's response after tool execution
        continue;
      }
      
      // No tool calls - we have the final response
      const finalText = assistantMessage.content || "I'm not sure how to respond to that.";
      
      // Add final assistant message to history
      conversationHistory.push({
        role: "assistant",
        content: finalText
      });
      
      // Keep conversation history manageable (last 20 messages)
      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
      }
      
      return {
        text: finalText,
        relatedData: lastToolResultData
      };
    }
    
    // Max loops reached
    return { text: "I'm having trouble processing your request. Please try again." };
    
  } catch (error) {
    console.error("OpenRouter Error:", error);
    return { text: "I encountered a technical issue connecting to the GoodFoods network. Please try again." };
  }
};

// Reset conversation (optional utility)
export const resetConversation = () => {
  conversationHistory = [];
};
