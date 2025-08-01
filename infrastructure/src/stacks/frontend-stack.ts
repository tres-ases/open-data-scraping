import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface FrontendStackProps extends cdk.StackProps {
  environment: string;
  apiGatewayId: string;
}

export class FrontendStack extends cdk.Stack {
  public readonly websiteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly websiteUrl: string;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { environment, apiGatewayId } = props;

    // Construct API Gateway URL from the ID
    const apiGatewayUrl = `https://${apiGatewayId}.execute-api.${this.region}.amazonaws.com/${environment}`;
    const apiGatewayDomain = `${apiGatewayId}.execute-api.${this.region}.amazonaws.com`;

    // Domain configuration
    const domainName = 'open-data.cl';
    const subdomains = environment === 'prod'
      ? ['open-data.cl', 'www.open-data.cl']
      : [`${environment}.open-data.cl`];

    // Import existing hosted zone
    // For development, we can use a placeholder. In production, this will do the actual lookup.
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName,
    });

    // Create SSL certificate for the domains
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: subdomains[0],
      subjectAlternativeNames: subdomains.slice(1),
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // S3 Bucket for website hosting
    this.websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `open-data-website-${environment}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
    });

    // Origin Access Identity for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for OD ${environment} website`,
    });

    // Grant CloudFront access to S3 bucket
    this.websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${this.websiteBucket.bucketArn}/*`],
        principals: [originAccessIdentity.grantPrincipal],
      })
    );

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `OD ${environment} website distribution`,
      domainNames: subdomains,
      certificate: certificate,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(this.websiteBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(apiGatewayDomain, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            originPath: `/${environment}`,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: environment === 'prod'
        ? cloudfront.PriceClass.PRICE_CLASS_ALL
        : cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    // Set website URL to the custom domain
    this.websiteUrl = `https://${subdomains[0]}`;

    // Create DNS records for all subdomains
    subdomains.forEach((subdomain, index) => {
      new route53.ARecord(this, `AliasRecord${index}`, {
        zone: hostedZone,
        recordName: subdomain === domainName ? undefined : subdomain.replace(`.${domainName}`, ''),
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
      });
    });

    // Placeholder deployment (will be replaced by actual build)
    new s3deploy.BucketDeployment(this, 'WebsiteDeployment', {
      sources: [
        s3deploy.Source.data('index.html', `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Open Data</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 600px;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .status {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .api-info {
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏛️ Open Data</h1>
        <p>Plataforma de Transparencia Legislativa Chilena</p>
        <div class="status">
            <h3>🚧 En Construcción</h3>
            <p>La infraestructura base ha sido desplegada exitosamente.</p>
            <p>Próximamente: Extracción de datos del Congreso Nacional y análisis con IA.</p>
        </div>
        <div class="api-info">
            <p>API Endpoint: <code>${apiGatewayUrl}</code></p>
            <p>Environment: <strong>${environment}</strong></p>
        </div>
    </div>
</body>
</html>
        `),
      ],
      destinationBucket: this.websiteBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: this.websiteUrl,
      description: 'Primary website URL',
      exportName: `OD-${environment}-WebsiteUrl`,
    });

    new cdk.CfnOutput(this, 'WebsiteDomains', {
      value: subdomains.join(', '),
      description: 'All configured website domains',
      exportName: `OD-${environment}-WebsiteDomains`,
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: this.websiteBucket.bucketName,
      description: 'Website S3 bucket name',
      exportName: `OD-${environment}-WebsiteBucketName`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: `OD-${environment}-DistributionId`,
    });
  }
}
