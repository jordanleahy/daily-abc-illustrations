# OpenAI Agents SDK Guide

## Overview

The OpenAI Agents SDK provides a powerful framework for building AI agents that can perform complex tasks, use tools, and maintain conversations. This guide covers how to use the Agents SDK in your application.

## Key Concepts

### 1. Agents
Agents are AI assistants that can:
- Execute complex workflows
- Use tools and functions
- Maintain conversation context
- Handle multi-step tasks
- Integrate with external APIs

### 2. Tools/Functions
Tools allow agents to interact with external systems:
- API calls
- Database operations
- File operations
- Custom business logic

### 3. Runs
Runs represent the execution of an agent's task:
- Track progress
- Handle streaming responses
- Manage tool calls
- Provide status updates

## Basic Usage

### Creating an Agent

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create an agent
const agent = await openai.beta.assistants.create({
  name: "My Assistant",
  instructions: "You are a helpful assistant that can help with various tasks.",
  model: "gpt-4o",
  tools: [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get weather information for a location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA"
            }
          },
          required: ["location"]
        }
      }
    }
  ]
});
```

### Creating and Running a Thread

```javascript
// Create a thread (conversation)
const thread = await openai.beta.threads.create();

// Add a message to the thread
await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: "What's the weather like in San Francisco?"
});

// Run the agent
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: agent.id,
});
```

### Handling Tool Calls

```javascript
// Poll for run completion and handle tool calls
let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

while (runStatus.status !== 'completed') {
  if (runStatus.status === 'requires_action') {
    const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
    
    const toolOutputs = await Promise.all(
      toolCalls.map(async (toolCall) => {
        if (toolCall.function.name === 'get_weather') {
          const args = JSON.parse(toolCall.function.arguments);
          const weatherData = await getWeatherData(args.location);
          
          return {
            tool_call_id: toolCall.id,
            output: JSON.stringify(weatherData)
          };
        }
      })
    );

    // Submit tool outputs
    await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
      tool_outputs: toolOutputs
    });
  }

  // Wait and check again
  await new Promise(resolve => setTimeout(resolve, 1000));
  runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
}
```

### Streaming Responses

```javascript
const run = openai.beta.threads.runs.stream(thread.id, {
  assistant_id: agent.id,
})
  .on('textCreated', (text) => console.log('New text:', text))
  .on('textDelta', (textDelta, snapshot) => {
    console.log('Text delta:', textDelta.value);
  })
  .on('toolCallCreated', (toolCall) => {
    console.log('Tool call created:', toolCall);
  })
  .on('toolCallDelta', (toolCallDelta, snapshot) => {
    if (toolCallDelta.type === 'function') {
      console.log('Function arguments:', toolCallDelta.function?.arguments);
    }
  });
```

## Advanced Features

### File Uploads and Retrieval

```javascript
// Upload a file
const file = await openai.files.create({
  file: fs.createReadStream('document.pdf'),
  purpose: 'assistants'
});

// Create agent with file search
const agent = await openai.beta.assistants.create({
  name: "Document Analyzer",
  instructions: "Analyze uploaded documents and answer questions about them.",
  model: "gpt-4o",
  tools: [{ type: "file_search" }],
  tool_resources: {
    file_search: {
      vector_stores: [{
        file_ids: [file.id]
      }]
    }
  }
});
```

### Code Interpreter

```javascript
const agent = await openai.beta.assistants.create({
  name: "Data Analyst",
  instructions: "Analyze data and create visualizations using Python.",
  model: "gpt-4o",
  tools: [{ type: "code_interpreter" }]
});
```

## Best Practices

### 1. Error Handling

```javascript
try {
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: agent.id,
  });
  
  // Handle run status
  if (run.status === 'failed') {
    console.error('Run failed:', run.last_error);
  }
} catch (error) {
  console.error('API Error:', error);
}
```

### 2. Function Definitions

- Keep function descriptions clear and specific
- Define proper parameter schemas
- Include examples in descriptions
- Handle edge cases in function implementations

### 3. Performance Optimization

- Use streaming for long-running tasks
- Implement proper polling intervals
- Cache frequently used agents
- Batch similar operations

### 4. Security

- Validate all function inputs
- Sanitize outputs before display
- Use environment variables for API keys
- Implement proper authentication

## Common Patterns

### Chat Interface with Agents

```javascript
class AgentChat {
  constructor(assistantId) {
    this.assistantId = assistantId;
    this.thread = null;
  }

  async initialize() {
    this.thread = await openai.beta.threads.create();
  }

  async sendMessage(content) {
    await openai.beta.threads.messages.create(this.thread.id, {
      role: "user",
      content: content
    });

    const run = await openai.beta.threads.runs.create(this.thread.id, {
      assistant_id: this.assistantId
    });

    return this.waitForCompletion(run.id);
  }

  async waitForCompletion(runId) {
    // Implementation for waiting and handling tool calls
  }
}
```

### Tool Registry Pattern

```javascript
const toolRegistry = {
  get_weather: async (args) => {
    // Weather API implementation
  },
  send_email: async (args) => {
    // Email sending implementation
  },
  database_query: async (args) => {
    // Database query implementation
  }
};

async function handleToolCall(toolCall) {
  const handler = toolRegistry[toolCall.function.name];
  if (handler) {
    const args = JSON.parse(toolCall.function.arguments);
    return await handler(args);
  }
  throw new Error(`Unknown tool: ${toolCall.function.name}`);
}
```

## Integration with Supabase Edge Functions

### Edge Function for Agents

```javascript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.20.1/mod.ts";

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

serve(async (req) => {
  const { message, threadId, assistantId } = await req.json();
  
  try {
    // Add message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message
    });

    // Create and handle run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId
    });

    // Return run ID for client-side polling
    return new Response(JSON.stringify({ runId: run.id }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
```

## Resources

- [OpenAI Agents API Documentation](https://platform.openai.com/docs/assistants/overview)
- [Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [File Upload Documentation](https://platform.openai.com/docs/assistants/tools/file-search)
- [Code Interpreter Guide](https://platform.openai.com/docs/assistants/tools/code-interpreter)

## Troubleshooting

### Common Issues

1. **Run stuck in 'queued' status**: Check API rate limits and retry with exponential backoff
2. **Tool calls failing**: Validate function schemas and parameter types
3. **File upload errors**: Ensure file format is supported and within size limits
4. **Token limit exceeded**: Break down complex tasks or use file search for large documents

### Debugging Tips

- Enable detailed logging for run status changes
- Log all tool call inputs and outputs
- Monitor API usage and rate limits
- Use the OpenAI dashboard for run inspection