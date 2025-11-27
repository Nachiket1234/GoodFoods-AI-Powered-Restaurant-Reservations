import { GoogleGenAI, FunctionDeclaration, Type, Chat, Tool, Part } from "@google/genai";
import { db } from "../data/mockDb";

// --- Tool Definitions (Schema) ---

const searchRestaurantsTool: FunctionDeclaration = {
  name: 'searchRestaurants',
  description: 'Search for restaurants based on criteria. Use this to find options for the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING, description: 'City or neighborhood (e.g., Manhattan, Downtown)' },
      cuisine: { type: Type.STRING, description: 'Cuisine type (e.g., Italian, Japanese)' },
      query: { type: Type.STRING, description: 'Descriptive keywords (e.g., romantic, rooftop, cheap, quiet)' }
    },
  }
};

const checkAvailabilityTool: FunctionDeclaration = {
  name: 'checkAvailability',
  description: 'Check if a specific restaurant has a table for a given slot. MANDATORY before booking.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      restaurantId: { type: Type.STRING, description: 'The exact ID of the restaurant (e.g., rest-12)' },
      date: { type: Type.STRING, description: 'YYYY-MM-DD format' },
      time: { type: Type.STRING, description: 'HH:MM format (24hr)' },
      partySize: { type: Type.NUMBER, description: 'Number of guests' }
    },
    required: ['restaurantId', 'date', 'time', 'partySize']
  }
};

const bookTableTool: FunctionDeclaration = {
  name: 'bookTable',
  description: 'Finalize a reservation. Only use this after the user explicitly confirms a valid available slot.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      restaurantId: { type: Type.STRING },
      date: { type: Type.STRING },
      time: { type: Type.STRING },
      partySize: { type: Type.NUMBER },
      customerName: { type: Type.STRING, description: 'Name provided by the user' }
    },
    required: ['restaurantId', 'date', 'time', 'partySize', 'customerName']
  }
};

const cancelReservationTool: FunctionDeclaration = {
  name: 'cancelReservation',
  description: 'Cancel a reservation given its ID.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reservationId: { type: Type.STRING }
    },
    required: ['reservationId']
  }
};

const getMyReservationsTool: FunctionDeclaration = {
  name: 'getMyReservations',
  description: 'Retrieve confirmed reservations for a specific user name.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerName: { type: Type.STRING }
    },
    required: ['customerName']
  }
};

const tools: Tool[] = [{
  functionDeclarations: [
    searchRestaurantsTool,
    checkAvailabilityTool,
    bookTableTool,
    cancelReservationTool,
    getMyReservationsTool
  ]
}];

// --- Agent State ---

let chatSession: Chat | null = null;
let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!aiClient) {
    // Securely access API key from environment (Vite exposes process.env via define)
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      console.error("❌ API Key missing or placeholder detected. Please set GEMINI_API_KEY in .env.local");
      return null;
    }
    console.log("✅ Initializing Gemini client with API key");
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const initializeChat = () => {
  const client = getClient();
  if (!client) return null;

  // Strategic Business Prompting with Advanced Intelligence
  const systemInstruction = `You are the GoodFoods Concierge, an elite AI agent designed to deliver exceptional dining experiences through intelligent conversation and autonomous decision-making.

  CORE MISSION:
  Transform vague dining desires into perfect restaurant matches and seamless bookings through:
  1. **Intelligent Discovery**: Interpret ambiguous requests and proactively recommend venues
  2. **Rigorous Verification**: ALWAYS validate availability before suggesting bookings
  3. **Seamless Conversion**: Guide users to confirmed reservations with minimal friction
  4. **Ongoing Support**: Manage, modify, or cancel existing reservations

  BUSINESS & UPSELLING STRATEGY:
  - **Premium Positioning**: For generic requests ("good restaurant"), prioritize high-rated ($$$-$$$$) venues unless budget constraints mentioned
  - **Contextual Intelligence**: 
    * "Romantic/anniversary/date" → Rooftop, Private Dining, Michelin Starred features
    * "Cheap/budget/affordable" → $$ range only, avoid upselling
    * "Family" → Family Friendly features, larger capacity
    * "Business/corporate" → Business Dining, Private Dining, quiet ambiance
  - **Alternative Suggestions**: When a venue is fully booked, immediately suggest:
    1. Different time slots at same restaurant (±1-2 hours)
    2. Similar restaurants with matching features/cuisine
  
  OPERATIONAL PROTOCOLS:
  - **Current Date Context**: Today is November 26, 2025 (Tuesday). Use this for relative date parsing.
  - **Time Parsing**: Convert "tonight" → today's date, "tomorrow" → next day, "this weekend" → upcoming Sat/Sun
  - **Default Party Size**: Assume 2 people unless specified
  - **Availability Mandate**: NEVER confirm a booking without first calling checkAvailability
  - **Data Integrity**: Trust tool outputs implicitly - do not hallucinate availability or restaurant details
  
  CONVERSATION FLOW:
  Step 1: Understand Intent
    - Search query? → Call searchRestaurants
    - Specific booking request? → Validate all parameters (restaurant, date, time, party size)
    - Modification/cancellation? → Get reservation details first
  
  Step 2: Execute Tools
    - Chain multiple tools when needed (search → check availability → book)
    - Provide rich context in responses using tool data
  
  Step 3: User Response
    - Conversational, not robotic
    - Highlight 2-3 top recommendations with key features
    - Always include next action (e.g., "Would you like me to check availability at The Golden Spoon?")
  
  ERROR HANDLING:
  - Restaurant not found: Suggest similar alternatives by cuisine/location
  - No availability: Offer different times or similar venues
  - Missing customer name: Politely request it before booking
  
  TONE: Professional yet warm, concise yet helpful. Emulate a high-end hotel concierge.`;

  chatSession = client.chats.create({
    model: 'gemini-1.5-flash', // Using stable model
    config: {
      temperature: 0.7,
      systemInstruction,
      tools: tools,
    }
  });
  return chatSession;
};

// --- Agent Execution Loop ---

export const sendMessageToGemini = async (message: string): Promise<{ text: string, relatedData?: any }> => {
  if (!chatSession) {
    initializeChat();
    if (!chatSession) return { text: "System Error: Unable to initialize AI client. Please check your API key." };
  }

  try {
    // 1. Initial Prompt
    let result = await chatSession.sendMessage({ message });
    
    // 2. Autonomous Agent Loop (Simulating MCP/A2A)
    // The model drives the loop. We execute what it requests until it decides to speak to the user.
    let loopCount = 0;
    const MAX_LOOPS = 8; // Prevent infinite loops
    let lastToolResultData: any = null; // To surface rich UI data

    while (result.functionCalls && result.functionCalls.length > 0) {
      if (loopCount >= MAX_LOOPS) {
        // Break loop and force model to apologize
        return { text: "I'm having trouble connecting to the database right now. Please try again in a moment." };
      }
      loopCount++;

      const toolParts: Part[] = [];
      
      // Execute all function calls requested by the model
      for (const call of result.functionCalls) {
        console.log(`[Agent Action] Executing ${call.name} with params:`, call.args);
        
        let toolResult: any;
        
        try {
          switch (call.name) {
            case 'searchRestaurants':
              toolResult = db.searchRestaurants(
                call.args.location as string, 
                call.args.cuisine as string, 
                call.args.query as string
              );
              // Capture data for UI rendering
              if (Array.isArray(toolResult) && toolResult.length > 0) {
                  lastToolResultData = toolResult;
              }
              break;
              
            case 'checkAvailability':
              toolResult = db.checkAvailability(
                call.args.restaurantId as string,
                call.args.date as string,
                call.args.time as string,
                call.args.partySize as number
              );
              break;
              
            case 'bookTable':
              toolResult = db.createReservation(
                call.args.restaurantId as string,
                call.args.date as string,
                call.args.time as string,
                call.args.partySize as number,
                call.args.customerName as string
              );
              break;
              
            case 'cancelReservation':
              const success = db.cancelReservation(call.args.reservationId as string);
              toolResult = { success, status: success ? "Cancelled" : "NotFound" };
              break;
  
            case 'getMyReservations':
              toolResult = db.getUserReservations(call.args.customerName as string);
              break;

            default:
              toolResult = { error: `Tool ${call.name} not found` };
          }
        } catch (err: any) {
          console.error(`[Tool Error] ${call.name}:`, err);
          toolResult = { error: `Execution failed: ${err.message}` };
        }

        // Compliant Part structure for @google/genai
        toolParts.push({
          functionResponse: {
            name: call.name,
            response: { result: toolResult },
            id: call.id // Critical for matching request/response
          }
        });
      }

      // 3. Feed results back to Model Context
      // The model will now "see" the tool outputs and decide the next step (more tools or final answer)
      result = await chatSession.sendMessage(toolParts);
    }

    // 4. Final Text Response
    return { 
      text: result.text || "I processed that, but I'm not sure what to say.",
      relatedData: lastToolResultData 
    };

  } catch (error) {
    console.error("Critical Agent Error:", error);
    // Graceful degradation
    return { text: "I encountered a technical issue connecting to the GoodFoods network. Please try again." };
  }
};