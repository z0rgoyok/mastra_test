import { z } from 'zod';
import { createWorkflow, createStep } from '@mastra/core/workflows';
import * as fs from 'fs/promises';
import * as path from 'path';
import { researcherAgent } from '../agents/researcher-agent';
import { writerAgent } from '../agents/writer-agent';
import { editorAgent } from '../agents/editor-agent';
import { humanizerAgent } from '../agents/humanizer-agent';

const inputSchema = z.object({
  topic: z.string().describe('The topic for the article.'),
  styleFilePath: z
    .string()
    .optional()
    .default('src/mastra/styles/default-style.txt'),
  outputFilePath: z
    .string()
    .optional()
    .describe('Path where the final article will be saved. If not provided, will be generated based on topic.'),
});

const outputSchema = z.object({
  finalArticle: z.string(),
  review: z.string(),
  tokenUsage: z.object({
    totalTokens: z.number(),
    breakdown: z.object({
      researcher: z.number(),
      writer: z.number(),
      editor: z.number(),
      humanizer: z.number(),
    }),
  }),
});

const articleCreationStep = createStep({
  id: 'articleCreation',
  inputSchema,
  outputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    const { topic, styleFilePath, outputFilePath } = inputData;

    let style = 'Default formal style: clear, concise, neutral.';
    try {
      const fullPath = path.resolve(styleFilePath);
      style = await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      console.error(`Error reading style file at ${styleFilePath}:`, error);
    }

    // Initialize token tracking
    const tokenUsage = {
      researcher: 0,
      writer: 0,
      editor: 0,
      humanizer: 0,
    };

    // 1. Researcher
    const researchResult = await researcherAgent.generate(
      `Find information about: ${topic}`,
      { runtimeContext }
    );
    tokenUsage.researcher = researchResult.usage?.totalTokens || 0;
    console.log('--- Research Complete ---');
    console.log(`Tokens used: ${tokenUsage.researcher}`);
    console.log(researchResult.text);

    // 2. Writer
    const draft = await writerAgent.generate(
      `Write an article based on the following research:\n\n${researchResult.text}\n\nAdhere to the following style:\n${style}`,
      { runtimeContext }
    );
    tokenUsage.writer = draft.usage?.totalTokens || 0;
    console.log('--- Draft Complete ---');
    console.log(`Tokens used: ${tokenUsage.writer}`);
    console.log(draft.text);

    // 3. Editor
    const editedDraft = await editorAgent.generate(
      `Edit the following draft according to the style guide:\n\nDraft:\n${draft.text}\n\nStyle Guide:\n${style}`,
      { runtimeContext }
    );
    tokenUsage.editor = editedDraft.usage?.totalTokens || 0;
    console.log('--- Editing Complete ---');
    console.log(`Tokens used: ${tokenUsage.editor}`);
    console.log(editedDraft.text);

    // 4. Humanizer
    const humanizedDraft = await humanizerAgent.generate(
      `Make the following text more human, relatable, and engaging while maintaining its core message and accuracy:\n\n${editedDraft.text}`,
      { runtimeContext }
    );
    tokenUsage.humanizer = humanizedDraft.usage?.totalTokens || 0;
    console.log('--- Humanization Complete ---');
    console.log(`Tokens used: ${tokenUsage.humanizer}`);
    console.log(humanizedDraft.text);

    // Calculate total tokens
    const totalTokens = tokenUsage.researcher + tokenUsage.writer + tokenUsage.editor + tokenUsage.humanizer;
    
    // Display token summary
    console.log('--- Token Usage Summary ---');
    console.log(`Researcher: ${tokenUsage.researcher} tokens`);
    console.log(`Writer: ${tokenUsage.writer} tokens`);
    console.log(`Editor: ${tokenUsage.editor} tokens`);
    console.log(`Humanizer: ${tokenUsage.humanizer} tokens`);
    console.log(`Total: ${totalTokens} tokens`);

    // Save the final article to file
    const finalOutputPath = outputFilePath || `articles/${topic.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${Date.now()}.md`;
    
    try {
      // Ensure the directory exists
      const dir = path.dirname(finalOutputPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Save the article
      await fs.writeFile(finalOutputPath, humanizedDraft.text, 'utf-8');
      console.log(`--- Article Saved to: ${finalOutputPath} ---`);
    } catch (error) {
      console.error(`Error saving article to ${finalOutputPath}:`, error);
    }

    return {
      finalArticle: humanizedDraft.text,
      review: `Article has been humanized to be more relatable and engaging. Saved to: ${finalOutputPath}`,
      tokenUsage: {
        totalTokens,
        breakdown: tokenUsage,
      },
    };
  },
});

export const articleWorkflow = createWorkflow({
  id: 'articleWritingWorkflow',
  inputSchema,
  outputSchema,
  steps: [articleCreationStep],
})
  .then(articleCreationStep)
  .commit();
