import {CfnElement, NestedStack, NestedStackProps, RemovalPolicy,} from 'aws-cdk-lib';
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3';
import {Construct} from "constructs";
import {
  CloudFrontWebDistribution,
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront';
import {S3Origin} from 'aws-cdk-lib/aws-cloudfront-origins';
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {Certificate} from "aws-cdk-lib/aws-certificatemanager";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";

const prefix = 'senado-cl-admin';
const subdomain = 'senado-admin.open-data.cl';

export default class AdminSubstack extends NestedStack {
  constructor(scope: Construct) {
    super(scope, prefix);

    const hostingBucket = new Bucket(this, 'open-data-senado-cl-admin', {
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const zone = HostedZone.fromLookup(this, `${prefix}-hz`, {
      domainName: 'open-data.cl',
    });

    const myCertificate = new Certificate(this, `${prefix}-certificate`, {
      domainName: subdomain
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      "OIA",
      {
        comment: "Setup access from CloudFront to the bucket ( read )",
      }
    );
    hostingBucket.grantRead(originAccessIdentity);

    const distribution = new Distribution(this, `${prefix}-distribution`, {
      defaultBehavior: {
        origin: new S3Origin(hostingBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      certificate: myCertificate
    });

    const cfDist = new CloudFrontWebDistribution(this, `${prefix}-cloudfront`, {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: hostingBucket,
            originAccessIdentity: originAccessIdentity,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],

    });

    // Create the wildcard DNS entry in route53 as an alias to the new CloudFront Distribution.
    new ARecord(this, `${prefix}-alias-record`, {
      zone,
      recordName: subdomain,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(cfDist)
      ),
    });
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
