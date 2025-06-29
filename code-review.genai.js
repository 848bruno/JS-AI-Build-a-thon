import fs from 'node:fs/promises';
import simpleGit from 'simple-git';

const git = simpleGit();

// Utility function to display code changes
function defineDiff(title, diffOutput) {
  console.log(`## ${title}\n`);
  console.log(diffOutput);
}

async function main() {
  console.log('Reviewing code...');

  try {
    const diffOutput = await git.diff(['--cached']); // Get staged changes

    defineDiff('CODE_CHANGES', diffOutput);

    const prompt = `
## Role
You are a senior developer whose job is to review code changes and provide meaningful feedback.

## Task
Review the following code changes, point out possible mistakes or bad practices, and provide suggestions for improvement.

\`\`\`diff
${diffOutput}
\`\`\`

- Be specific about what's wrong and why it's wrong.
- Reference proper coding standards and best practices.
- Be brief to get your point across.
`;

    await fs.writeFile('code-review-prompt.txt', prompt);
    console.log('Prompt saved to code-review-prompt.txt');
  } catch (error) {
    console.error('Error during code review generation:', error);
  }
}

await main();
