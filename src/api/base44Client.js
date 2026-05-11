// base44 API client - using g4f for free AI completions

// Cache the g4f createClient function once loaded
let g4fCreateClient = null;
let geminiClient = null;
let deepinfraClient = null;

// Dynamically load the g4f library
async function loadG4F() {
  if (g4fCreateClient) return g4fCreateClient;
  
  // Load the script dynamically
  return new Promise((resolve, reject) => {
    if (window.g4fCreateClient) {
      g4fCreateClient = window.g4fCreateClient;
      resolve(g4fCreateClient);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://g4f.dev/dist/js/providers.js';
    script.type = 'module';
    script.onload = () => {
      // The library exports createClient globally or via module
      // Wait a tick for module to initialize
      setTimeout(() => {
        if (window.createClient) {
          g4fCreateClient = window.createClient;
          resolve(g4fCreateClient);
        } else {
          reject(new Error('g4f createClient not found after loading'));
        }
      }, 100);
    };
    script.onerror = () => reject(new Error('Failed to load g4f library'));
    document.head.appendChild(script);
  });
}

// Get or create client
async function getClient(provider = 'gemini') {
  await loadG4F();
  
  if (provider === 'deepinfra') {
    if (!deepinfraClient) {
      deepinfraClient = g4fCreateClient('deepinfra');
    }
    return deepinfraClient;
  }
  
  if (!geminiClient) {
    geminiClient = g4fCreateClient('gemini');
  }
  return geminiClient;
}

// Helper to call AI with fallback
async function callAI(prompt, model = 'gemini') {
  const client = await getClient(model);
  const modelId = model === 'deepinfra' 
    ? 'deepseek-ai/DeepSeek-V4-Flash' 
    : 'models/gemini-3-flash-preview';

  const result = await client.chat.completions.create({
    model: modelId,
    messages: [{ role: 'user', content: prompt }],
  });
  return result.choices[0].message.content;
}

// base44-compatible interface using g4f
export const base44 = {
  // Auth mock (not implemented with g4f)
  auth: {
    me: async () => {
      // Return a mock user or null - implement real auth if needed
      return { id: 'guest', email: 'guest@example.com', role: 'user' };
    },
  },

  // Integrations namespace
  integrations: {
    Core: {
      // InvokeLLM replacement using g4f
      InvokeLLM: async ({ prompt, response_json_schema, model = 'gemini' }) => {
        try {
          const result = await callAI(prompt, model);
          
          // If a JSON schema was provided, try to parse the response as JSON
          if (response_json_schema) {
            try {
              // Try to extract JSON from the response
              const jsonMatch = result.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
              }
              return JSON.parse(result);
            } catch {
              // If parsing fails, return the raw text
              return { text: result };
            }
          }
          
          return { text: result };
        } catch (error) {
          console.error('InvokeLLM failed:', error);
          throw error;
        }
      },
    },
  },
};
