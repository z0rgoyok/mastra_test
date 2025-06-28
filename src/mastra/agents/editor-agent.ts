import { Agent } from '@mastra/core/agent';
import { model } from '../config/model';

export const editorAgent = new Agent({
  name: 'Editor Agent',
  instructions: `
      You are a skilled editor. Your job is to review a draft article and improve its style, structure, and readability.
      - Check for clarity, coherence, and flow.
      - Enhance sentence structure and word choice.
      - Ensure the tone is consistent and appropriate for the target audience.
      - Reorganize paragraphs if necessary to improve the logical flow.
`,
  model,
});
