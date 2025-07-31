# Technology Stack & Architecture

## Core Architecture
**Serverless-first AWS architecture** using TypeScript and AWS CDK for infrastructure as code.

## Lambda Development Standards

### Required Dependencies
```json
{
  "@aws-lambda-powertools/commons": "^1.x.x",
  "@aws-lambda-powertools/logger": "^1.x.x",
  "@aws-lambda-powertools/tracer": "^1.x.x",
  "@aws-lambda-powertools/metrics": "^1.x.x",
  "@aws-lambda-powertools/parameters": "^1.x.x",
  "zod": "^3.x.x"
}
```

### Lambda Function Structure
All Lambda functions must follow this pattern:

```typescript
import { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
import { z } from 'zod';

// Input validation schema
const InputSchema = z.object({
  legislatorId: z.string(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional()
});

type InputType = z.infer<typeof InputSchema>;

// Response schema
const ResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional()
});

type ResponseType = z.infer<typeof ResponseSchema>;

class LegislatorExtractorHandler implements LambdaInterface {
  private logger = new Logger({ serviceName: 'legislator-extractor' });
  private tracer = new Tracer({ serviceName: 'legislator-extractor' });
  private metrics = new Metrics({ namespace: 'ODM', serviceName: 'legislator-extractor' });

  @this.tracer.captureLambdaHandler()
  @this.logger.injectLambdaContext()
  @this.metrics.logMetrics()
  public async handler(event: InputType): Promise<ResponseType> {
    try {
      // Validate input
      const validatedInput = InputSchema.parse(event);
      
      // Get configuration from SSM
      const apiEndpoint = await getParameter('/odm/senado/api-endpoint');
      
      // Add custom metrics
      this.metrics.addMetric('ExtractorInvocation', MetricUnits.Count, 1);
      
      this.logger.info('Starting legislator extraction', { 
        legislatorId: validatedInput.legislatorId 
      });

      // Business logic here
      const result = await this.extractLegislatorData(validatedInput);
      
      this.metrics.addMetric('ExtractionSuccess', MetricUnits.Count, 1);
      
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      this.logger.error('Extraction failed', { error });
      this.metrics.addMetric('ExtractionError', MetricUnits.Count, 1);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  @this.tracer.captureMethod()
  private async extractLegislatorData(input: InputType) {
    // Implementation here
  }
}

export const handler = new LegislatorExtractorHandler().handler;
```

### API Gateway Integration Standards

#### Non-Proxy Integration
- **NO usar Lambda Proxy Integration**
- Lambdas reciben solo parámetros necesarios
- API Gateway maneja transformaciones con Velocity Templates

#### OpenAPI Definition
All APIs must be defined using OpenAPI 3.0 specification:

```yaml
# api-spec.yaml
openapi: 3.0.0
info:
  title: Open Data API
  version: 1.0.0
paths:
  /legislators/{id}:
    get:
      summary: Get legislator details
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Legislator details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LegislatorResponse'
      x-amazon-apigateway-integration:
        type: aws
        httpMethod: POST
        uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LegislatorFunction.Arn}/invocations'
        requestTemplates:
          application/json: |
            {
              "legislatorId": "$input.params('id')",
              "includeMetrics": #if($input.params('includeMetrics') == "true")true#{else}false#end
            }
        responses:
          default:
            statusCode: 200
            responseTemplates:
              application/json: |
                #if($input.path('$.success') == true)
                $input.path('$.data')
                #else
                {
                  "error": "$input.path('$.error')"
                }
                #end

components:
  schemas:
    LegislatorResponse:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        party:
          type: string
        metrics:
          $ref: '#/components/schemas/PerformanceMetrics'
```

#### Request/Response Mapping
```typescript
// CDK Stack configuration
const api = new RestApi(this, 'ODMApi', {
  restApiName: 'Open Data API',
  description: 'API for legislative transparency data',
  apiDefinition: ApiDefinition.fromAsset('api-spec.yaml')
});

// Integration with mapping templates
const integration = new LambdaIntegration(legislatorFunction, {
  proxy: false, // NEVER use proxy integration
  requestTemplates: {
    'application/json': JSON.stringify({
      legislatorId: '$input.params(\'id\')',
      dateRange: {
        start: '$input.params(\'startDate\')',
        end: '$input.params(\'endDate\')'
      }
    })
  },
  integrationResponses: [{
    statusCode: '200',
    responseTemplates: {
      'application/json': '$input.path(\'$.data\')'
    }
  }, {
    statusCode: '400',
    selectionPattern: '.*"success":false.*',
    responseTemplates: {
      'application/json': '{"error": "$input.path(\'$.error\')"}'
    }
  }]
});
```

## Tech Stack

### Backend
- **Language**: TypeScript
- **Infrastructure**: AWS CDK v2
- **Compute**: AWS Lambda functions
- **Orchestration**: AWS Step Functions for data extraction workflows
- **Scheduling**: Amazon EventBridge for automated data collection
- **AI/ML**: Amazon Bedrock with Claude 3.5 Sonnet for behavioral analysis

### Data Layer
- **Raw Storage**: Amazon S3 with organized folder structure (`raw/senado/`, `raw/camara/`, `raw/servel/`)
- **Processed Storage**: S3 with Parquet format, partitioned by year/month
- **Database**: Amazon DynamoDB for fast queries and structured data
- **Analytics**: AWS Glue Data Catalog + Amazon Athena for SQL queries
- **Data Processing**: Lambda functions for ETL operations

### API & Frontend
- **API**: Amazon API Gateway with Lambda handlers
- **Authentication**: JWT tokens, API keys for external developers
- **Frontend**: React with TypeScript
- **CDN**: Amazon CloudFront for global distribution
- **Monitoring**: Amazon CloudWatch for metrics and logging

## Data Sources
- **senado.cl**: Senate data (legislators, sessions, votes, expenses)
- **camara.cl**: Chamber of Deputies data (same structure as Senate)
- **servel.cl**: Electoral results and candidate information

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Deploy to development environment
npm run deploy:dev

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Build CDK stacks
npm run build

# Synthesize CloudFormation templates
cdk synth

# Deploy specific stack
cdk deploy StorageStack
cdk deploy ProcessingStack
cdk deploy ApiStack
```

### Data Operations
```bash
# Trigger manual data extraction
aws stepfunctions start-execution --state-machine-arn <extraction-sm-arn>

# Query processed data with Athena
aws athena start-query-execution --query-string "SELECT * FROM senado_legisladores LIMIT 10"

# Check extraction status
aws stepfunctions describe-execution --execution-arn <execution-arn>
```

### Monitoring
```bash
# View Lambda logs
aws logs tail /aws/lambda/data-extractor --follow

# Check API Gateway metrics
aws cloudwatch get-metric-statistics --namespace AWS/ApiGateway --metric-name Count

# Monitor costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31
```

## Performance Requirements
- API response time: p95 < 500ms
- Data extraction success rate: > 99%
- Athena query performance: < 10 seconds for standard queries
- Frontend load time: < 3 seconds initial load

## Scaling Considerations
- Lambda concurrency limits for data extraction
- DynamoDB read/write capacity planning
- S3 request rate optimization
- API Gateway throttling configuration
