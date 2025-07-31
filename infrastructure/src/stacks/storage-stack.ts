import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { ParametersConstruct } from '../config/parameters';

export interface StorageStackProps extends cdk.StackProps {
  environment: string;
}

export class StorageStack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;
  public readonly legislatorsTable: dynamodb.Table;
  public readonly sessionsTable: dynamodb.Table;
  public readonly analyticsTable: dynamodb.Table;
  public readonly votationsTable: dynamodb.Table;
  public readonly projectsTable: dynamodb.Table;
  public readonly expensesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // Create SSM parameters
    new ParametersConstruct(this, 'Parameters', { environment });

    // S3 Bucket for raw and processed data with enhanced configuration
    this.dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `open-data-bucket-${environment}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      transferAcceleration: environment === 'prod',
      // Intelligent tiering will be configured via lifecycle rules
      lifecycleRules: [
        {
          id: 'raw-data-lifecycle',
          prefix: 'raw/',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
        {
          id: 'processed-data-lifecycle',
          prefix: 'processed/',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          noncurrentVersionExpiration: cdk.Duration.days(180),
        },
        {
          id: 'athena-results-cleanup',
          prefix: 'athena-results/',
          enabled: true,
          expiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        {
          id: 'temp-data-cleanup',
          prefix: 'temp/',
          enabled: true,
          expiration: cdk.Duration.days(7),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      // Inventory configuration will be added via separate construct if needed
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
    });

    // Add bucket policies for enhanced security and access control
    this.dataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.dataBucket.bucketArn,
          `${this.dataBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    this.dataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedObjectUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${this.dataBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'AES256',
          },
        },
      })
    );

    // Lambda function to initialize S3 folder structure
    const s3InitializerFunction = new lambda.Function(this, 'S3InitializerFunction', {
      functionName: `odm-${environment}-s3-initializer`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      loggingFormat: lambda.LoggingFormat.JSON,
      code: lambda.Code.fromInline(`
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

        const s3Client = new S3Client({ region: process.env.AWS_REGION });

        exports.handler = async (event) => {
          console.log('Initializing S3 folder structure', JSON.stringify(event, null, 2));

          const bucketName = process.env.BUCKET_NAME;
          const folders = [
            // Raw data structure
            'raw/senado/legisladores/',
            'raw/senado/sesiones/',
            'raw/senado/votaciones/',
            'raw/senado/proyectos/',
            'raw/senado/gastos/',
            'raw/camara/legisladores/',
            'raw/camara/sesiones/',
            'raw/camara/votaciones/',
            'raw/camara/proyectos/',
            'raw/camara/gastos/',
            'raw/servel/elecciones/',
            'raw/servel/candidatos/',
            'raw/servel/resultados/',

            // Processed data structure
            'processed/senado/legisladores/',
            'processed/senado/sesiones/',
            'processed/senado/votaciones/',
            'processed/senado/proyectos/',
            'processed/senado/gastos/',
            'processed/camara/legisladores/',
            'processed/camara/sesiones/',
            'processed/camara/votaciones/',
            'processed/camara/proyectos/',
            'processed/camara/gastos/',
            'processed/servel/elecciones/',
            'processed/analisis/comportamientos_problematicos/',
            'processed/analisis/metricas_rendimiento/',
            'processed/analisis/reportes_ia/',

            // Utility folders
            'athena-results/',
            'temp/',
            'inventory/',
            'logs/',
          ];

          try {
            for (const folder of folders) {
              const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: folder + '.gitkeep',
                Body: 'This file maintains the folder structure',
                ContentType: 'text/plain',
                ServerSideEncryption: 'AES256',
              });

              await s3Client.send(command);
              console.log(\`Created folder: \${folder}\`);
            }

            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'S3 folder structure initialized successfully',
                foldersCreated: folders.length,
              }),
            };
          } catch (error) {
            console.error('Error initializing S3 structure:', error);
            throw error;
          }
        };
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: {
        BUCKET_NAME: this.dataBucket.bucketName,
      },
    });

    // Grant the initializer function permissions to write to the bucket
    this.dataBucket.grantWrite(s3InitializerFunction);

    // Custom resource to run the initializer on stack deployment
    const s3InitializerProvider = new cr.Provider(this, 'S3InitializerProvider', {
      onEventHandler: s3InitializerFunction,
    });

    new cdk.CustomResource(this, 'S3InitializerResource', {
      serviceToken: s3InitializerProvider.serviceToken,
      properties: {
        BucketName: this.dataBucket.bucketName,
        Timestamp: Date.now(), // Force update on each deployment
      },
    });

    // DynamoDB Table for Legislators with enhanced configuration
    this.legislatorsTable = new dynamodb.Table(this, 'LegislatorsTable', {
      tableName: `ODM-${environment}-Legislators`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: environment === 'prod',
      },
      contributorInsightsEnabled: environment === 'prod',
      deletionProtection: environment === 'prod',
      tableClass: dynamodb.TableClass.STANDARD,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI for querying by chamber and region
    this.legislatorsTable.addGlobalSecondaryIndex({
      indexName: 'ChamberRegionIndex',
      partitionKey: { name: 'chamber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'region', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying by party
    this.legislatorsTable.addGlobalSecondaryIndex({
      indexName: 'PartyIndex',
      partitionKey: { name: 'party', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'chamber', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying by status and period
    this.legislatorsTable.addGlobalSecondaryIndex({
      indexName: 'StatusPeriodIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'period', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying by performance metrics (for rankings)
    this.legislatorsTable.addGlobalSecondaryIndex({
      indexName: 'PerformanceIndex',
      partitionKey: { name: 'chamber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'performanceScore', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['name', 'party', 'region', 'lastUpdated'],
    });

    // DynamoDB Table for Sessions with enhanced configuration
    this.sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: `ODM-${environment}-Sessions`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: environment === 'prod',
      },
      contributorInsightsEnabled: environment === 'prod',
      deletionProtection: environment === 'prod',
      tableClass: dynamodb.TableClass.STANDARD,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI for querying sessions by date and chamber
    this.sessionsTable.addGlobalSecondaryIndex({
      indexName: 'DateChamberIndex',
      partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'chamber', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying sessions by chamber and date (reverse order)
    this.sessionsTable.addGlobalSecondaryIndex({
      indexName: 'ChamberDateIndex',
      partitionKey: { name: 'chamber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying sessions by type and date
    this.sessionsTable.addGlobalSecondaryIndex({
      indexName: 'TypeDateIndex',
      partitionKey: { name: 'sessionType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying sessions by period
    this.sessionsTable.addGlobalSecondaryIndex({
      indexName: 'PeriodIndex',
      partitionKey: { name: 'period', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['chamber', 'sessionType', 'quorum', 'attendanceCount'],
    });

    // DynamoDB Table for Analytics with enhanced configuration
    this.analyticsTable = new dynamodb.Table(this, 'AnalyticsTable', {
      tableName: `ODM-${environment}-Analytics`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl',
      contributorInsightsEnabled: environment === 'prod',
      deletionProtection: environment === 'prod',
      tableClass: dynamodb.TableClass.STANDARD,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI for querying analytics by type and period
    this.analyticsTable.addGlobalSecondaryIndex({
      indexName: 'TypePeriodIndex',
      partitionKey: { name: 'analyticsType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'period', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying analytics by legislator and type
    this.analyticsTable.addGlobalSecondaryIndex({
      indexName: 'LegislatorTypeIndex',
      partitionKey: { name: 'legislatorId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'analyticsType', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying analytics by chamber and calculated date
    this.analyticsTable.addGlobalSecondaryIndex({
      indexName: 'ChamberCalculatedIndex',
      partitionKey: { name: 'chamber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'calculatedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['analyticsType', 'period', 'legislatorId', 'data'],
    });

    // GSI for querying rankings and comparisons
    this.analyticsTable.addGlobalSecondaryIndex({
      indexName: 'RankingIndex',
      partitionKey: { name: 'rankingType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'score', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['legislatorId', 'chamber', 'period', 'rank'],
    });

    // DynamoDB Table for Votations (Voting records)
    this.votationsTable = new dynamodb.Table(this, 'VotationsTable', {
      tableName: `ODM-${environment}-Votations`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: environment === 'prod',
      },
      contributorInsightsEnabled: environment === 'prod',
      deletionProtection: environment === 'prod',
      tableClass: dynamodb.TableClass.STANDARD,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI for querying votations by project
    this.votationsTable.addGlobalSecondaryIndex({
      indexName: 'ProjectDateIndex',
      partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'votingDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying votations by legislator
    this.votationsTable.addGlobalSecondaryIndex({
      indexName: 'LegislatorDateIndex',
      partitionKey: { name: 'legislatorId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'votingDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying votations by chamber and date
    this.votationsTable.addGlobalSecondaryIndex({
      indexName: 'ChamberVotingDateIndex',
      partitionKey: { name: 'chamber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'votingDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['projectId', 'votingType', 'result', 'legislatorId', 'vote'],
    });

    // DynamoDB Table for Projects (Legislative projects)
    this.projectsTable = new dynamodb.Table(this, 'ProjectsTable', {
      tableName: `ODM-${environment}-Projects`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: environment === 'prod',
      },
      contributorInsightsEnabled: environment === 'prod',
      deletionProtection: environment === 'prod',
      tableClass: dynamodb.TableClass.STANDARD,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI for querying projects by status
    this.projectsTable.addGlobalSecondaryIndex({
      indexName: 'StatusDateIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'lastUpdated', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying projects by chamber of origin
    this.projectsTable.addGlobalSecondaryIndex({
      indexName: 'OriginChamberIndex',
      partitionKey: { name: 'originChamber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submissionDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying projects by urgency
    this.projectsTable.addGlobalSecondaryIndex({
      indexName: 'UrgencyDateIndex',
      partitionKey: { name: 'urgency', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submissionDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['title', 'status', 'originChamber', 'currentStage'],
    });

    // DynamoDB Table for Expenses (Parliamentary expenses)
    this.expensesTable = new dynamodb.Table(this, 'ExpensesTable', {
      tableName: `ODM-${environment}-Expenses`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: environment === 'prod',
      },
      contributorInsightsEnabled: environment === 'prod',
      deletionProtection: environment === 'prod',
      tableClass: dynamodb.TableClass.STANDARD,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // GSI for querying expenses by legislator and date
    this.expensesTable.addGlobalSecondaryIndex({
      indexName: 'LegislatorDateIndex',
      partitionKey: { name: 'legislatorId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'expenseDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying expenses by category and date
    this.expensesTable.addGlobalSecondaryIndex({
      indexName: 'CategoryDateIndex',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'expenseDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying expenses by chamber and amount (for rankings)
    this.expensesTable.addGlobalSecondaryIndex({
      indexName: 'ChamberAmountIndex',
      partitionKey: { name: 'chamber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'amount', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['legislatorId', 'category', 'expenseDate', 'description'],
    });

    // GSI for querying expenses by period (monthly aggregations)
    this.expensesTable.addGlobalSecondaryIndex({
      indexName: 'PeriodAmountIndex',
      partitionKey: { name: 'period', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'amount', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['legislatorId', 'chamber', 'category'],
    });

    // Output important ARNs and names
    new cdk.CfnOutput(this, 'DataBucketName', {
      value: this.dataBucket.bucketName,
      description: 'S3 bucket for raw and processed data',
      exportName: `ODM-${environment}-DataBucketName`,
    });

    new cdk.CfnOutput(this, 'LegislatorsTableName', {
      value: this.legislatorsTable.tableName,
      description: 'DynamoDB table for legislators data',
      exportName: `ODM-${environment}-LegislatorsTableName`,
    });

    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: this.sessionsTable.tableName,
      description: 'DynamoDB table for sessions data',
      exportName: `ODM-${environment}-SessionsTableName`,
    });

    new cdk.CfnOutput(this, 'AnalyticsTableName', {
      value: this.analyticsTable.tableName,
      description: 'DynamoDB table for analytics data',
      exportName: `ODM-${environment}-AnalyticsTableName`,
    });

    new cdk.CfnOutput(this, 'VotationsTableName', {
      value: this.votationsTable.tableName,
      description: 'DynamoDB table for voting records',
      exportName: `ODM-${environment}-VotationsTableName`,
    });

    new cdk.CfnOutput(this, 'ProjectsTableName', {
      value: this.projectsTable.tableName,
      description: 'DynamoDB table for legislative projects',
      exportName: `ODM-${environment}-ProjectsTableName`,
    });

    new cdk.CfnOutput(this, 'ExpensesTableName', {
      value: this.expensesTable.tableName,
      description: 'DynamoDB table for parliamentary expenses',
      exportName: `ODM-${environment}-ExpensesTableName`,
    });
  }
}
