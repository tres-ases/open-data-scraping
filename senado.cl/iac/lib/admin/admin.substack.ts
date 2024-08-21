import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack, RemovalPolicy,} from 'aws-cdk-lib';
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  PriceClass,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront';
import {CognitoUserPoolsAuthorizer, Cors, RestApi} from "aws-cdk-lib/aws-apigateway";
import {UserPool, UserPoolEmail} from "aws-cdk-lib/aws-cognito";
import {HostedZone} from "aws-cdk-lib/aws-route53";
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";
import {HttpOrigin, S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import AdminApiEndpointsSubstack from "./admin-api-endpoints.substack";

const prefix = 'senado-cl-admin';
const domain = 'open-data.cl';
const subdomain = `senado-admin.${domain}`;

interface AdminSubstackProps {
  bucket: Bucket
}

export default class AdminSubstack extends NestedStack {
  constructor(scope: Construct, {bucket}: AdminSubstackProps) {
    super(scope, prefix);

    const oai = new OriginAccessIdentity(this, `${prefix}-cloudfront-OAI`, {
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

    const api = new RestApi(this, `${prefix}-apigw`, {
      deploy: true,
      deployOptions: {
        stageName: 'api'
      },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'Access-Control-Allow-Credentials',
          'Access-Control-Allow-Headers',
          'Impersonating-User-Sub'
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: Cors.ALL_ORIGINS
      }
    });

    const userPool = new UserPool(this, `${prefix}-user-pool`, {
      passwordPolicy: {
        requireUppercase: true,
        requireSymbols: true,
        requireDigits: true,
        minLength: 8,
      },
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      email: UserPoolEmail.withSES({
        sesRegion: 'us-east-1',
        fromEmail: 'no-responder@open-data.cl',
        fromName: 'Open Data Admin'
      })
    });

    userPool.addClient(`${prefix}-user-pool-client`, {
      idTokenValidity: Duration.hours(8),
      accessTokenValidity: Duration.hours(8),
    });

    const authorizer = new CognitoUserPoolsAuthorizer(this, `${prefix}-authorizer`, {
      cognitoUserPools: [userPool]
    });

    const zone = HostedZone.fromLookup(this, `${prefix}-zone`, {domainName: domain});

    const certificate = new Certificate(this, `${prefix}-certificate`, {
      domainName: subdomain,
      validation: CertificateValidation.fromDns(zone),
    });

    const distribution = new Distribution(scope, 'cloudfront-distribution', {
      domainNames: [subdomain],
      defaultBehavior: {
        origin: new S3Origin(hostingBucket, {
          originAccessIdentity: oai,
          originPath: '/',
        }),
        cachePolicy: CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        'api/*': {
          origin: new HttpOrigin(`${api.restApiId}.execute-api.${api.env.region}.amazonaws.com`),
          allowedMethods: AllowedMethods.ALLOW_ALL,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      defaultRootObject: 'index.html',
      priceClass: PriceClass.PRICE_CLASS_ALL,
      certificate
    });

    //new ARecord(this, `${prefix}-alias-record`, {
    //  zone,
    //  recordName: subdomain,
    //  target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    //});

    //new StringParameter(this, `${prefix}-parameter-distribution-id`, {
    //  parameterName: "/openData/senadoCl/admin/distributionId",
    //  description: `${prefix}-parameter-distribution-id`,
    //  stringValue: distribution.distributionId,
    //});

    const adminApiEndpointsSubstack = new AdminApiEndpointsSubstack(this, {api, authorizer, bucket});
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
