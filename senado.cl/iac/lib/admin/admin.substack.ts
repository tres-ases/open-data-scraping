import {Construct} from "constructs";
import {CfnElement, CfnOutput, Duration, NestedStack, RemovalPolicy,} from 'aws-cdk-lib';
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3';
import {
  CloudFrontAllowedMethods,
  CloudFrontWebDistribution,
  OriginAccessIdentity, OriginProtocolPolicy,
  ViewerCertificate
} from 'aws-cdk-lib/aws-cloudfront';
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";
import {CanonicalUserPrincipal, PolicyStatement} from "aws-cdk-lib/aws-iam";
import AdminApiSubstack from "./admin-api.substack";
import {StringParameter} from "aws-cdk-lib/aws-ssm";

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

    //const apiSubstack = new AdminApiSubstack(this, {bucket});

    const distribution = new CloudFrontWebDistribution(this, `${prefix}-distribution`, {
      viewerCertificate: ViewerCertificate.fromAcmCertificate(certificate),
      originConfigs: [
        //{
        //  // make sure your backend origin is first in the originConfigs list so it takes precedence over the S3 origin
        //  customOriginSource: {
        //    domainName: `${apiSubstack.api.restApiId}.execute-api.${this.region}.amazonaws.com`,
        //    originProtocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
        //  },
        //  behaviors: [
        //    {
        //      pathPattern: "/api/*"
        //    },
        //  ],
        //},
        {
          s3OriginSource: {
            s3BucketSource: hostingBucket,
            originAccessIdentity: cloudfrontOAI,
          },
          behaviors: [
            {
              compress: true,
              isDefaultBehavior: true,
              defaultTtl: Duration.seconds(0),
              allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
            },
          ],
        },
      ]
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
