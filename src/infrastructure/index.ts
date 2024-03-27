/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';
// Import dotenv to load environment variables from the .env file
// eslint-disable-next-line import/no-extraneous-dependencies
import * as dotenv from 'dotenv';

// Correctly load the .env file from the project root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('Using .env at', path.resolve(__dirname, '../../.env'));

// Define an S3 bucket
const bucket = new aws.s3.Bucket('myBucket', {
  website: {
    indexDocument: 'index.html',
  },
});

const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity('myOAI', {
  comment: 'Origin Access Identity created by Pulumi',
});

// Use the created Origin Access Identity in your Distribution
const distribution = new aws.cloudfront.Distribution('myDistribution', {
  origins: [{
    domainName: bucket.bucketRegionalDomainName,
    originId: bucket.arn,
    s3OriginConfig: {
      originAccessIdentity: pulumi.interpolate`origin-access-identity/cloudfront/${originAccessIdentity.id}`,
    },
  }],
  enabled: true,
  defaultCacheBehavior: {
    allowedMethods: ['GET', 'HEAD'],
    cachedMethods: ['GET', 'HEAD'],
    targetOriginId: bucket.arn,
    forwardedValues: {
      queryString: false,
      cookies: { forward: 'none' },
    },
    viewerProtocolPolicy: 'redirect-to-https',
  },
  restrictions: {
    geoRestriction: {
      restrictionType: 'none',
    },
  },
  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },
});

// Output bucket name and CloudFront domain
export const bucketName = bucket.id;
export const cloudFrontDomain = distribution.domainName;

// Function to update the .env file
function updateEnv(values: { [key: string]: string }) {
  const envPath = path.resolve(__dirname, '../../.env');
  console.log('Updating .env at', envPath);
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    console.warn('.env file does not exist at expected path:', envPath);
    return;
  }

  Object.keys(values).forEach(key => {
    // Change here: Include double quotes around the value
    const newValue = `"${values[key]}"`; // <-- Change made here
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${newValue}`);
    } else {
      envContent += `\n${key}=${newValue}`;
    }
  });

  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log('Successfully updated .env file');
}

// Use `apply` to ensure the values are resolved before attempting to write to the .env file
// eslint-disable-next-line @typescript-eslint/no-shadow
pulumi.all([bucketName, cloudFrontDomain]).apply(([bucket, domain]) => {
  updateEnv({
    'AWS_BUCKET': bucket,
    'CLOUDFRONT_DOMAIN': domain,
  });
});
