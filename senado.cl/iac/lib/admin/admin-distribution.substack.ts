import {Construct} from "constructs";
import {CfnElement, NestedStack,} from 'aws-cdk-lib';
import {RestApi} from "aws-cdk-lib/aws-apigateway";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  PriceClass,
  ViewerProtocolPolicy
} from "aws-cdk-lib/aws-cloudfront";
import {RestApiOrigin, S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";

const prefix = 'senado-cl-admin-api';

interface AdminApiSubstackProps {
  bucket: Bucket
  api: RestApi
  oai: OriginAccessIdentity
  domain: string
  subdomain: string
}

export default class AdminDistributionSubstack extends NestedStack {
  constructor(scope: Construct, {bucket, api, oai, domain, subdomain}: AdminApiSubstackProps) {
    super(scope, prefix);

    const zone = HostedZone.fromLookup(this, `${prefix}-zone`, { domainName: domain });

    const certificate = new Certificate(this, `${prefix}-certificate`, {
      domainName: subdomain,
      validation: CertificateValidation.fromDns(zone),
    });

    const distribution = new Distribution(scope, 'cloudfront-distribution', {
      domainNames: [subdomain],
      defaultBehavior: {
        origin: new S3Origin(bucket, {
          originAccessIdentity: oai,
          originPath: '/',
        }),
        cachePolicy: CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        'api/*': {
          origin: new RestApiOrigin(api),
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
      try {
        return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
      } catch (e) {
      }
    }
    return super.getLogicalId(element)
  }
}
