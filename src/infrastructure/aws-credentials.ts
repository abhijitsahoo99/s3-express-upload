// setup-aws-credentials.ts
import fs from "fs/promises";
import readline from "readline";
import path from "path";
import dotenv from "dotenv";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

const updateEnvFile = async (
  awsRegion: string,
  awsAccessKeyId: string,
  awsSecretAccessKey: string
): Promise<void> => {
  const envPath = path.join(process.cwd(), ".env");
  let content: string;
  try {
    content = await fs.readFile(envPath, { encoding: "utf-8" });
  } catch (err) {
    content = ""; // If .env doesn't exist, start with an empty string
  }

  // Update AWS credentials
  const replacements: { [key: string]: string } = {
    AWS_ACCESS_KEY_ID: awsAccessKeyId,
    AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
    AWS_REGION: awsRegion,
  };

  Object.keys(replacements).forEach((key) => {
    const regex = new RegExp(`${key}=".*"`);
    const newValue = `"${replacements[key]}"`;
    if (content.match(regex)) {
      content = content.replace(regex, `${key}=${newValue}`);
    } else {
      content += `${key}=${newValue}\n`;
    }
  });

  await fs.writeFile(envPath, content, { encoding: "utf-8" });
  rl.close();
};

const main = async () => {
  dotenv.config();
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    console.log("AWS credentials already set in .env file.");
    rl.close();
    return;
  }
  const awsAccessKeyId = await askQuestion(
    "Please provide the value of AWS_ACCESS_KEY_ID: "
  );
  const awsSecretAccessKey = await askQuestion(
    "Please provide the value of AWS_SECRET_ACCESS_KEY: "
  );
  await updateEnvFile("us-east-1", awsAccessKeyId, awsSecretAccessKey);
  console.log("AWS credentials updated in .env file.");
};

main();