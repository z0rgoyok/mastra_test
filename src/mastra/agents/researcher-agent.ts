import { Agent } from '@mastra/core/agent';
import { searchTool } from '../tools/search-tool';
import { model } from '../config/model';

export const researcherAgent = new Agent({
  name: 'Researcher Agent',
  instructions: `
      You are a research assistant. Your goal is to find and synthesize information on a given topic.
      Use the searchTool to find relevant information.
      Provide a summary of the findings.
`,
  model,
  tools: { searchTool },
});
