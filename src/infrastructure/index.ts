import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';
import { App } from '@aws-cdk/core';
import { MyStack } from './stack';
import { writeFileSync, readFileSync } from 'fs';

// Initialize AWS SDK and CDK app
AWS.config.update({ region: 'us-east-1' });
const cloudformation = new AWS.CloudFormation();
const app = new App();

const stackName = `pix-stack-${crypto.randomBytes(16).toString('hex')}`;

function synthesizeCdkTemplate(): string {
  // Instantiate your CDK stack
  new MyStack(app, stackName);

  // Synthesize the CDK app to CloudFormation template
  const assembly = app.synth();
  const template = assembly.getStackByName(stackName).template;

  // Save the template to a JSON file and return its path
  const templatePath = './cdk-output.json';
  writeFileSync(templatePath, JSON.stringify(template, null, 2));
  return templatePath;
}

async function deployStack(templatePath: string) {
  const templateBody = readFileSync(templatePath, 'utf8');

  const params = {
    StackName: stackName,
    TemplateBody: templateBody,
    Capabilities: ['CAPABILITY_NAMED_IAM'],
  };

  try {
    console.log('Creating a new stack...');
    await cloudformation.createStack(params).promise();
    console.log('Stack creation initiated. It may take a few minutes to complete.');
    await cloudformation.waitFor('stackCreateComplete', { StackName: stackName }).promise();
  } catch (e) {
    console.error('Failed to create the stack:', e);
    return;
  }

  try {
    const { Stacks } = await cloudformation.describeStacks({ StackName: stackName }).promise();
    if (!Stacks || Stacks.length === 0) {
      throw new Error('Stack creation failed.');
    }

    const outputs = Stacks[0].Outputs;
    console.log(outputs);
    if (!outputs) {
      throw new Error('No outputs found in the CloudFormation stack.');
    }

    const distributionUrl = outputs.find(o => o.OutputKey === 'DistributionURL')?.OutputValue;
    const bucketName = outputs.find(o => o.OutputKey === 'BucketName')?.OutputValue;

    // Read the existing env file
    const envFileData = readFileSync('.env', 'utf8');
    // Write distribution URL to the env file
    const envContent = envFileData + '\n' + `CLOUDFRONT_DOMAIN=${distributionUrl}\nAWS_BUCKET=${bucketName}`;
    writeFileSync('.env', envContent);

    console.log('Environment file updated with CloudFront URL.');
  } catch (error) {
    console.error('Failed to deploy the stack:', error);
  }
}

async function main() {
  const templatePath = synthesizeCdkTemplate();
  await deployStack(templatePath);
}

export default main;