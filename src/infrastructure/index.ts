/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';


// Define an S3 bucket using the AWS region from your centralized configuration
const bucket = new aws.s3.Bucket('myBucket', {
  website: {
    indexDocument: 'index.html',
  },
});

const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity('myOAI', {
  comment: 'Origin Access Identity created by Pulumi',
});

// Then, use the created Origin Access Identity in your Distribution
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

// Output  bucket name, and CloudFront domain from the config
export const bucketName = bucket.id;
export const cloudFrontDomain = distribution.domainName;
// Function to update the .env file
function updateEnv(values: { [key: string]: string }) {
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, { encoding: 'utf8' });
  }

  Object.keys(values).forEach(key => {
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${values[key]}`);
    } else {
      envContent += `\n${key}=${values[key]}`;
    }
  });

  fs.writeFileSync(envPath, envContent);
}

// Use `apply` to ensure the values are resolved before attempting to write to the .env file
// eslint-disable-next-line @typescript-eslint/no-shadow
pulumi.all([bucketName, cloudFrontDomain]).apply(([bucket, domain]) => {
  updateEnv({
    'AWS_BUCKET': bucket,
    'CLOUDFRONT_DOMAIN': domain,
  });
});
