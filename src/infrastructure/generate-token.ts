import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const generateToken = (length: number = 64): string => {
  return randomBytes(length / 2).toString('hex');
};

const envVariables = [
  'AWS_REGION=""',
  'AWS_ACCESS_KEY_ID=""',
  'AWS_SECRET_ACCESS_KEY=""',
];

const updateEnvFile = async (token: string): Promise<void> => {
  const envPath = path.join(process.cwd(), '.env');
  let content: string; // Explicitly declare content as a string.
  try {
    content = await fs.readFile(envPath, { encoding: 'utf-8' });
  } catch (err) {
    content = ''; // File does not exist, will create
  }

  // Ensure all environment variables are present, adding any that are missing.
  envVariables.forEach(variable => {
    const [key] = variable.split('=');
    if (!content.includes(`${key}=`)) {
      content += `${variable}\n`;
    }
  });

  // Handle API_TOKEN separately to add the generated token.
  if (content.includes('API_TOKEN=')) {
    content = content.replace(/API_TOKEN=".*"/, `API_TOKEN="${token}"`);
  } else {
    content += `API_TOKEN="${token}"\n`;
  }

  await fs.writeFile(envPath, content, { encoding: 'utf-8' });
};

const main = async () => {
  const token = generateToken();
  await updateEnvFile(token);
  console.log('API token generated and stored in .env file.');
  // Optionally generate a QR code here
};

main();