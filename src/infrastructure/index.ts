import * as AWS from 'aws-sdk';
import { App } from '@aws-cdk/core';
import { MyStack } from './stack';
import { writeFileSync, readFileSync } from 'fs';

// Initialize AWS SDK and CDK app
AWS.config.update({ region: 'us-east-1' });
const cloudformation = new AWS.CloudFormation();
const app = new App();

function synthesizeCdkTemplate(): string {
  // Instantiate your CDK stack
  new MyStack(app, 'pix-stack');

  // Synthesize the CDK app to CloudFormation template
  const assembly = app.synth();
  const template = assembly.getStackByName('pix-stack').template;

  // Save the template to a JSON file and return its path
  const templatePath = './cdk-output.json';
  writeFileSync(templatePath, JSON.stringify(template, null, 2));
  return templatePath;
}

async function deployStack(templatePath: string) {
  const templateBody = readFileSync(templatePath, 'utf8');

  const params = {
    StackName: 'pix-stack',
    TemplateBody: templateBody,
    Capabilities: ['CAPABILITY_NAMED_IAM'],
  };

  try {
    await cloudformation.createStack(params).promise();
    await cloudformation.waitFor('stackCreateComplete', { StackName: 'pix-stack' }).promise();

    const { Stacks } = await cloudformation.describeStacks({ StackName: 'pix-stack' }).promise();
    if (!Stacks || Stacks.length === 0) {
      throw new Error('No stacks found.');
    }
    const outputs = Stacks[0].Outputs;
    if (!outputs) {
      throw new Error('No outputs found in the CloudFormation stack.');
    }
    const distributionUrl = outputs.find(o => o.OutputKey === 'DistributionURL')?.OutputValue;
    // Write distribution URL to the env file
    const envContent = `CLOUDFRONT_URL=${distributionUrl}\n`;
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