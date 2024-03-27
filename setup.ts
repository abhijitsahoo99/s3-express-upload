import { spawn } from 'child_process';
import path from 'path';

/**
 * Executes a given command interactively, allowing for user input.
 * @param command The command to execute.
 * @param args An array of arguments to pass to the command.
 * @param options Additional options, such as the working directory.
 * @returns A promise that resolves when the command completes successfully.
 */
function runCommandInteractive(command: string, args: string[] = [], options: Record<string, any> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: 'inherit', ...options });
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command "${command} ${args.join(' ')}" exited with code ${code}`));
      }
    });
  });
}

async function setup() {
  // Step 1: Generate API token and update .env file
  console.log('Step 1: Generating API Token and updating .env file...');
  await runCommandInteractive('bun', ['./src/lib/generate-token.ts']);

  // Step 2: Prompt user for AWS credentials and update .env file
  console.log('Step 2: Setting up AWS credentials...');
  await runCommandInteractive('bun', ['./src/lib/aws-credentials.ts']);

  // Step 3: Navigate to src/infrastructure and run Pulumi commands
  console.log('Step 3: Setting up infrastructure with Pulumi...');
  const infrastructurePath = path.join(process.cwd(), 'src', 'infrastructure');
  // await runCommandInteractive('pulumi', ['refresh', '--yes'], { cwd: infrastructurePath });
  await runCommandInteractive('pulumi', ['up', '--yes'], { cwd: infrastructurePath });

  console.log('Setup complete!');
}

setup().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
