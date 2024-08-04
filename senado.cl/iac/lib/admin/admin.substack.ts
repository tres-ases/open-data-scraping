import {Construct} from "constructs";
import {CfnElement, NestedStack, RemovalPolicy,} from 'aws-cdk-lib';
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import {
  AllowedMethods,
  Distribution,
  OriginAccessIdentity,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront';
import {S3Origin} from 'aws-cdk-lib/aws-cloudfront-origins';
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";
import {CanonicalUserPrincipal, PolicyStatement} from "aws-cdk-lib/aws-iam";
import AdminApiSubstack from "./admin-api.substack";

const prefix = 'senado-cl-admin';
const domain = 'open-data.cl';
const subdomain = `senado-admin.${domain}`;

export default class AdminSubstack extends NestedStack {
  constructor(scope: Construct) {
    super(scope, prefix);

    const zone = HostedZone.fromLookup(this, `${prefix}-zone`, { domainName: domain });
    const siteDomain = subdomain;
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

    hostingBucket.addToResourcePolicy(new PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [hostingBucket.arnForObjects('*')],
      principals: [new CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }));

    const certificate = new Certificate(this, `${prefix}-certificate`, {
      domainName: subdomain,
      validation: CertificateValidation.fromDns(zone),
    });

    const distribution = new Distribution(this, `${prefix}-distribution`, {
      certificate: certificate,
      defaultRootObject: "index.html",
      domainNames: [siteDomain],
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses:[
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        },
      ],
      defaultBehavior: {
        origin: new S3Origin(hostingBucket, {originAccessIdentity: cloudfrontOAI}),
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      }
    });

    new ARecord(this, `${prefix}-alias-record`, {
      zone,
      recordName: subdomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    const apiSubtack = new AdminApiSubstack(this);
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
