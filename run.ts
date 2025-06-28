import { articleWorkflow } from './src/mastra/workflows/article-workflow';
import { Mastra } from '@mastra/core';
import 'dotenv/config'; // Import and configure dotenv

async function main() {
  const mastra = new Mastra({
    workflows: {
      articleWorkflow,
    },
  });

  const run = await mastra.getWorkflow('articleWorkflow').createRun();

  const topic = 'AI агенты, будущее профессий';

  console.log(`Starting article workflow for topic: "${topic}"`);

  const result = await run.start({
    inputData: {
      topic,
      styleFilePath: 'src/mastra/styles/default-style.txt',
    },
  });

  if (result.status === 'success') {
    console.log('\n--- Final Article ---');
    console.log(result.result.finalArticle);
    console.log('\n--- Review ---');
    console.log(result.result.review);
  } else {
    console.error('Workflow failed:', result);
  }
}

main().catch(console.error);
