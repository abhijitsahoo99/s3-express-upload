// generate-token.ts
import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const generateToken = (length: number = 64): string => {
  return randomBytes(length / 2).toString('hex');
};

const updateEnvFile = async (token: string): Promise<void> => {
  const envPath = path.join(process.cwd(), '.env');
  let content;
  try {
    content = await fs.readFile(envPath, { encoding: 'utf-8' });
  } catch (err) {
    content = ''; // File does not exist, will create
  }
  const updatedContent = content.includes('API_TOKEN=')
    ? content.replace(/API_TOKEN=.*/, `API_TOKEN="${token}"`)
    : `${content}\nAPI_TOKEN="${token}"\n`;
    // eslint-disable-next-line @typescript-eslint/indent
    await fs.writeFile(envPath, updatedContent, { encoding: 'utf-8' });
};

const main = async () => {
  const token = generateToken();
  await updateEnvFile(token);
  console.log('API token generated and stored in .env file.');
  // Optionally generate a QR code here
};

main();
