import {Construct} from "constructs";
import {CfnElement, Duration, RemovalPolicy, Stack, StackProps,} from 'aws-cdk-lib';
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  OriginRequestPolicy,
  PriceClass,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront';
import {CognitoUserPoolsAuthorizer, RestApi} from "aws-cdk-lib/aws-apigateway";
import {UserPool, UserPoolEmail} from "aws-cdk-lib/aws-cognito";
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";
import {HttpOrigin, S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import AdminApiEndpointsSubstack from "./admin/admin-api-endpoints.substack";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {MainBucketKey} from "@senado-cl/global/config";
import {Architecture, Code, LayerVersion, Runtime} from "aws-cdk-lib/aws-lambda";
import AdminWorkflowsSubstack from "./admin/admin-workflows.substack";

const prefix = 'senado-cl-admin';
const domain = 'open-data.cl';
const subdomain = `senado-admin.${domain}`;

export default class AdminStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const globalLy = new LayerVersion(this, `${prefix}-global-ly`, {
      layerVersionName: `${prefix}-global-layer`,
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../global/layer'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const scraperCommonsLy = new LayerVersion(this, `${prefix}-scraper-commons-ly`, {
      layerVersionName: `${prefix}-scraper-commons-layer`,
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../scraper/Commons/layer'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const scraperLy = new LayerVersion(this, `${prefix}-scraper-ly`, {
      layerVersionName: `${prefix}-scraper-layer`,
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../../layers/scraper'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const commonsLy = new LayerVersion(this, `${prefix}-commons-ly`, {
      layerVersionName: `${prefix}-commons-layer`,
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../../commons/layer'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

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

    const oai2 = new OriginAccessIdentity(this, `${prefix}-cloudfront-OAI-2`, {
      comment: `OAI for ${MainBucketKey.S3_BUCKET}`
    });

    const dataBucket = Bucket.fromBucketArn(this, `${prefix}-data`, `arn:aws:s3:::${MainBucketKey.S3_BUCKET}`);
    dataBucket.grantRead(oai2);

    const api = new RestApi(this, `${prefix}-apigw`, {
      deploy: true,
      deployOptions: {
        stageName: 'api'
      }
    });

    const userPool = new UserPool(this, `${prefix}-user-pool`, {
      userPoolName: `${prefix}-user-pool`,
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

    const userPoolClient = userPool.addClient(`${prefix}-user-pool-client`, {
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

    const distribution = new Distribution(this, `${prefix}-distribution`, {
      domainNames: [subdomain],
      defaultBehavior: {
        origin: new S3Origin(hostingBucket, {
          originId: `${prefix}-dist-origin-s3`,
          originAccessIdentity: oai,
          originPath: '/',
        }),
        cachePolicy: CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        'api/*': {
          origin: new HttpOrigin(`${api.restApiId}.execute-api.${api.env.region}.amazonaws.com`, {
            originId: `${prefix}-dist-origin-apigw`
          }),
          allowedMethods: AllowedMethods.ALLOW_ALL,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        '/img/*': {
          origin: new S3Origin(dataBucket, {
            originId: `${prefix}-dist-origin-s3-data`,
            originAccessIdentity: oai2,
          }),
          cachePolicy: CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        }
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

    new StringParameter(this, `${prefix}-parameter-userpool-id`, {
      parameterName: "/openData/senadoCl/admin/cognitoUserPool/id",
      description: `${prefix}-parameter-userpool-id`,
      stringValue: userPool.userPoolId,
    });

    new StringParameter(this, `${prefix}-parameter-userpool-clientid`, {
      parameterName: "/openData/senadoCl/admin/cognitoUserPool/clientId",
      description: `${prefix}-parameter-userpool-clientid`,
      stringValue: userPoolClient.userPoolClientId,
    });

    const adminWorkflowSubstack = new AdminWorkflowsSubstack(this, {
      layers: [scraperCommonsLy, globalLy, scraperLy, commonsLy],
      dataBucket
    });

    const adminApiEndpointsSubstack = new AdminApiEndpointsSubstack(this, {
      api, authorizer,
      layers: [scraperCommonsLy, globalLy, scraperLy, commonsLy],
      dataBucket,
      sesionesGetSaveWf: adminWorkflowSubstack.legSesGetSaveWf
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
