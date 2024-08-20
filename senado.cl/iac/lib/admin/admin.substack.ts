import {Construct} from "constructs";
import {CfnElement, NestedStack, RemovalPolicy,} from 'aws-cdk-lib';
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  PriceClass,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront';
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";
import AdminApiSubstack from "./admin-api.substack";
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {RestApiOrigin, S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";

const prefix = 'senado-cl-admin';
const domain = 'open-data.cl';
const subdomain = `senado-admin.${domain}`;

interface AdminSubstackProps {
  bucket: Bucket
}

export default class AdminSubstack extends NestedStack {
  constructor(scope: Construct, {bucket}: AdminSubstackProps) {
    super(scope, prefix);

    const zone = HostedZone.fromLookup(this, `${prefix}-zone`, { domainName: domain });

    const cloudfrontOAI = new OriginAccessIdentity(this, `${prefix}-cloudfront-OAI`, {
      comment: `OAI for ${subdomain}`
    });

    const hostingBucket = new Bucket(this, subdomain, {
      bucketName: subdomain,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
      autoDeleteObjects: true, // NOT recommended for production code
    });
    hostingBucket.grantRead(cloudfrontOAI);

    const certificate = new Certificate(this, `${prefix}-certificate`, {
      domainName: subdomain,
      validation: CertificateValidation.fromDns(zone),
    });

    const apiSubstack = new AdminApiSubstack(this, {bucket});

    const distribution = new Distribution(scope, 'cloudfront-distribution', {
      domainNames: [subdomain],
      defaultBehavior: {
        origin: new S3Origin(hostingBucket, {
          originAccessIdentity: cloudfrontOAI,
          originPath: '/',
        }),
        cachePolicy: CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        'api/*': {
          origin: new RestApiOrigin(apiSubstack.api),
          allowedMethods: AllowedMethods.ALLOW_ALL,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      defaultRootObject: 'index.html',
      priceClass: PriceClass.PRICE_CLASS_ALL,
      certificate
    });

    new ARecord(this, `${prefix}-alias-record`, {
      zone,
      recordName: subdomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    new StringParameter(this, `${prefix}-parameter-distribution-id`, {
      parameterName: "/openData/senadoCl/admin/distributionId",
      description: `${prefix}-parameter-distribution-id`,
      stringValue: distribution.distributionId,
    });
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
