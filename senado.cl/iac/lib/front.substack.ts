import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { CachePolicy, Distribution, OriginAccessIdentity, PriceClass, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

const domain = 'open-data.cl';
const subdomain = `senado.${domain}`;

export default class FrontStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const oai = new OriginAccessIdentity(this, `${id}-cloudfront-OAI`, {
      comment: `OAI for ${subdomain}`
    });

    const hostingBucket = new Bucket(this, subdomain, {
      bucketName: subdomain,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
      autoDeleteObjects: true, // NOT recommended for production code
    });
    hostingBucket.grantRead(oai);

    const zone = HostedZone.fromLookup(this, `${id}-zone`, {domainName: domain});

    const certificate = new Certificate(this, `${id}-certificate`, {
      domainName: subdomain,
      validation: CertificateValidation.fromDns(zone),
    });

    const distribution = new Distribution(this, `${id}-distribution`, {
      domainNames: [subdomain],
      defaultBehavior: {
        origin: new S3Origin(hostingBucket, {
          originId: `${id}-dist-origin-s3`,
          originAccessIdentity: oai,
          originPath: '/',
        }),
        cachePolicy: CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      priceClass: PriceClass.PRICE_CLASS_ALL,
      certificate,
      errorResponses: [{
        httpStatus: 404,
        responsePagePath: '/index.html',
        responseHttpStatus: 200
      }]
    });

    new ARecord(this, `${id}-alias-record`, {
      zone,
      recordName: subdomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    new StringParameter(this, `${id}-parameter-distribution-id`, {
      parameterName: "/openData/senadoCl/front/distributionId",
      description: `${id}-parameter-distribution-id`,
      stringValue: distribution.distributionId,
    })
  }
}
