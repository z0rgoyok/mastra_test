import { anthropic } from '@ai-sdk/anthropic';
// import { openai } from '@ai-sdk/openai'; // Uncomment and use if you prefer OpenAI

// You can change this to any supported AI SDK model
export const model = anthropic('claude-sonnet-4-20250514');
// export const model = openai('gpt-4o-mini'); // Example for OpenAI
