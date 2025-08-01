# Project Structure & Organization

## Repository Structure (Nx Monorepo)

```
/
├── .kiro/                          # Kiro configuration and specs
│   ├── specs/                      # Feature specifications
│   └── steering/                   # AI assistant guidance rules
├── apps/                           # Nx applications
│   ├── web/                        # React web application
│   │   ├── src/
│   │   │   ├── app/                # Main app component
│   │   │   ├── components/         # App-specific components
│   │   │   ├── pages/              # Route-based page components
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   └── assets/             # Static assets
│   │   ├── project.json            # Nx project configuration
│   │   └── webpack.config.js       # Custom webpack config
│   ├── api/                        # API Gateway application
│   │   ├── src/
│   │   │   ├── handlers/           # Lambda function handlers (LambdaInterface)
│   │   │   │   ├── legislators/    # Legislator endpoints with Powertools
│   │   │   │   ├── analytics/      # Analytics endpoints with Powertools
│   │   │   │   └── subscriptions/  # Premium subscriptions
│   │   │   ├── middleware/         # Auth, rate limiting
│   │   │   └── schemas/            # Zod validation schemas
│   │   ├── api-spec.yaml           # OpenAPI 3.0 specification
│   │   ├── mapping-templates/      # Velocity templates for API Gateway
│   │   └── project.json
│   └── infrastructure/             # CDK infrastructure app
│       ├── src/
│       │   ├── stacks/             # CDK stack definitions
│       │   │   ├── storage-stack.ts
│       │   │   ├── processing-stack.ts
│       │   │   ├── api-stack.ts    # API Gateway from OpenAPI
│       │   │   └── frontend-stack.ts
│       │   └── main.ts             # CDK app entry point
│       └── project.json
├── libs/                           # Nx libraries (shared code)
│   ├── shared/                     # Common utilities and types
│   │   ├── types/                  # TypeScript type definitions
│   │   │   ├── legislator.ts
│   │   │   ├── session.ts
│   │   │   └── analytics.ts
│   │   ├── constants/              # Application constants
│   │   ├── utils/                  # Shared utility functions
│   │   └── project.json
│   ├── extractors/                 # Data extraction libraries
│   │   ├── senado/                 # Senate extractor library
│   │   │   ├── src/
│   │   │   │   ├── legislators.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── votes.ts
│   │   │   │   └── expenses.ts
│   │   │   └── project.json
│   │   ├── camara/                 # Chamber extractor library
│   │   │   ├── src/
│   │   │   │   ├── legislators.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── votes.ts
│   │   │   │   └── expenses.ts
│   │   │   └── project.json
│   │   ├── servel/                 # SERVEL extractor library
│   │   │   ├── src/
│   │   │   │   ├── elections.ts
│   │   │   │   ├── candidates.ts
│   │   │   │   └── results.ts
│   │   │   └── project.json
│   │   └── core/                   # Core extraction utilities
│   │       ├── src/
│   │       │   ├── base-extractor.ts
│   │       │   ├── validation.ts
│   │       │   └── storage.ts
│   │       └── project.json
│   ├── processors/                 # Data processing libraries
│   │   ├── data-transformer/       # Raw to processed conversion
│   │   │   ├── src/
│   │   │   │   ├── parquet-converter.ts
│   │   │   │   ├── schema-validator.ts
│   │   │   │   └── partitioner.ts
│   │   │   └── project.json
│   │   ├── analytics-engine/       # Behavioral analysis
│   │   │   ├── src/
│   │   │   │   ├── behavior-detector.ts
│   │   │   │   ├── performance-calculator.ts
│   │   │   │   └── ranking-generator.ts
│   │   │   └── project.json
│   │   └── ai-insights/            # Bedrock AI integration
│   │       ├── src/
│   │       │   ├── behavior-analyst.ts
│   │       │   ├── report-generator.ts
│   │       │   └── trend-detector.ts
│   │       └── project.json
│   ├── ui-components/              # Shared React components
│   │   ├── src/
│   │   │   ├── legislator-card/
│   │   │   ├── behavior-alert/
│   │   │   ├── performance-chart/
│   │   │   └── regional-view/
│   │   └── project.json
│   └── api-client/                 # API client library
│       ├── src/
│       │   ├── legislators-client.ts
│       │   ├── analytics-client.ts
│       │   └── auth-client.ts
│       └── project.json
├── tools/                          # Nx workspace tools and scripts
│   ├── executors/                  # Custom Nx executors
│   ├── generators/                 # Custom Nx generators
│   └── scripts/                    # Utility scripts
│       ├── deploy.ts
│       ├── seed-data.ts
│       └── backup.ts
├── docs/                           # Documentation
│   ├── api/                        # API documentation
│   ├── architecture/               # Architecture diagrams
│   └── deployment/                 # Deployment guides
├── nx.json                         # Nx workspace configuration
├── workspace.json                  # Nx workspace projects
├── package.json                    # Root package.json
├── tsconfig.base.json             # Base TypeScript configuration
└── .github/                        # GitHub Actions workflows
    └── workflows/
        ├── ci.yml                  # Continuous integration with Nx
        ├── deploy.yml              # Deployment workflow
        └── pr-check.yml            # Pull request validation
```

## Key Architectural Patterns

### Nx Monorepo Benefits
- **Code Sharing**: Libraries in `libs/` are shared across applications
- **Dependency Graph**: Nx tracks dependencies between projects for efficient builds
- **Incremental Builds**: Only affected projects are rebuilt when changes occur
- **Consistent Tooling**: Unified linting, testing, and build processes across all projects

### Data Flow Organization
- **Raw Data**: Stored in S3 with source-based partitioning (`raw/senado/`, `raw/camara/`, `raw/servel/`)
- **Processed Data**: Parquet format in S3, partitioned by `year/month` for optimal Athena queries
- **Real-time Data**: DynamoDB for fast API responses and user-facing queries

### Library Organization
- **Extractors**: Each data source has its own library (`libs/extractors/senado`, `libs/extractors/camara`)
- **Processors**: Data processing logic separated into focused libraries
- **Shared Code**: Common types, utilities, and constants in `libs/shared`
- **UI Components**: Reusable React components in `libs/ui-components`

### Application Structure
- **Web App**: React application in `apps/web` consuming shared libraries
- **API**: Lambda handlers in `apps/api` using extractor and processor libraries
- **Infrastructure**: CDK stacks in `apps/infrastructure` with proper dependency management

## Naming Conventions

### AWS Resources
- **Lambda Functions**: `odm-{environment}-{function-name}` (e.g., `odm-prod-senado-extractor`)
- **DynamoDB Tables**: `ODM-{Environment}-{TableName}` (e.g., `ODM-Prod-Legislators`)
- **S3 Buckets**: `open-data-{environment}-{purpose}` (e.g., `open-data-prod-data`)
- **Step Functions**: `ODM-{Environment}-{WorkflowName}` (e.g., `ODM-Prod-DataExtraction`)

### Code Organization
- **Files**: kebab-case for file names (`senado-extractor.ts`)
- **Classes**: PascalCase (`SenadoExtractor`)
- **Functions**: camelCase (`extractLegislatorData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)

### Data Schema
- **Database Keys**: PascalCase for partition/sort keys (`PK`, `SK`)
- **JSON Fields**: camelCase for API responses (`legislatorId`, `sessionDate`)
- **S3 Paths**: lowercase with hyphens (`processed/senado/legislators/`)

## Environment Management

### Development Workflow
1. **Local Development**: Use `nx serve` for local development with hot reload
2. **Library Development**: Create and test libraries independently with `nx test <lib-name>`
3. **Affected Builds**: Use `nx affected:build` to build only changed projects
4. **Feature Branches**: Each feature developed in separate branch with isolated CDK stack
5. **Integration Testing**: Staging environment mirrors production configuration
6. **Production Deployment**: Automated deployment with rollback capabilities

### Configuration Management
- **Environment Variables**: Stored in CDK context and SSM Parameter Store
- **Secrets**: AWS Secrets Manager for sensitive data (API keys, database credentials)
- **Feature Flags**: DynamoDB-based feature toggles for gradual rollouts

## Nx Development Commands

### Development
```bash
# Install dependencies
npm install

# Serve web application locally
nx serve web

# Build all projects
nx build

# Build only affected projects
nx affected:build

# Test all projects
nx test

# Test only affected projects
nx affected:test

# Test specific library
nx test shared
nx test extractors-senado

# Lint all projects
nx lint

# Generate new library
nx generate @nrwl/node:library my-lib

# Generate new React component
nx generate @nrwl/react:component my-component --project=ui-components

# Deploy infrastructure
nx build infrastructure
nx deploy infrastructure

# Build and deploy API
nx build api
nx deploy api

# Show dependency graph
nx dep-graph
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
aws logs tail /aws/lambda/odm-prod-senado-extractor --follow

# Check API Gateway metrics
aws cloudwatch get-metric-statistics --namespace AWS/ApiGateway --metric-name Count

# Monitor costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31
```

## GitHub Actions CI/CD Strategy

### Optimized Workflow Design
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      affected-apps: ${{ steps.affected.outputs.apps }}
      affected-libs: ${{ steps.affected.outputs.libs }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - name: Get affected projects
        id: affected
        run: |
          echo "apps=$(npx nx print-affected --type=app --select=projects)" >> $GITHUB_OUTPUT
          echo "libs=$(npx nx print-affected --type=lib --select=projects)" >> $GITHUB_OUTPUT

  test-and-lint:
    needs: setup
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: ${{ fromJson(needs.setup.outputs.affected-libs) }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - name: Restore Nx cache
        uses: actions/cache@v3
        with:
          path: node_modules/.cache/nx
          key: nx-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
      - run: npx nx test ${{ matrix.project }}
      - run: npx nx lint ${{ matrix.project }}

  build:
    needs: [setup, test-and-lint]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: ${{ fromJson(needs.setup.outputs.affected-apps) }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - name: Restore Nx cache
        uses: actions/cache@v3
        with:
          path: node_modules/.cache/nx
          key: nx-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
      - run: npx nx build ${{ matrix.app }}
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.app }}-build
          path: dist/apps/${{ matrix.app }}

  deploy-infrastructure:
    needs: [build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy infrastructure
        run: |
          npx nx build infrastructure
          cd dist/apps/infrastructure
          npx cdk deploy --all --require-approval never

  deploy-applications:
    needs: [deploy-infrastructure]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: ['api', 'web']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: ${{ matrix.app }}-build
          path: dist/apps/${{ matrix.app }}
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy ${{ matrix.app }}
        run: npx nx deploy ${{ matrix.app }}
```

### Performance Optimizations
- **Nx Affected**: Solo ejecuta tests/builds para proyectos afectados por cambios
- **Matrix Strategy**: Paraleliza tests y builds por proyecto
- **Caching**: Cache de node_modules y Nx computation cache
- **Artifact Sharing**: Reutiliza builds entre jobs
- **Conditional Deployment**: Solo deploya en push a main branch

### Caching Strategy
- **Node Modules**: Cache de dependencias npm
- **Nx Computation Cache**: Cache de resultados de builds y tests
- **Build Artifacts**: Compartir builds entre jobs de deployment
- **CDK Assets**: Cache de assets de CloudFormation

## Data Partitioning Strategy

### S3 Data Organization
```
s3://bucket/raw/senado/year=2024/month=01/day=15/
s3://bucket/processed/senado/legislators/year=2024/month=01/
s3://bucket/processed/analytics/behaviors/year=2024/month=01/
```

### DynamoDB Access Patterns
- **Legislators**: `PK: LEG#{id}`, `SK: PROFILE` for basic info
- **Sessions**: `PK: SESSION#{date}#{chamber}`, `SK: DETAIL` for session data
- **Analytics**: `PK: ANALYTICS#{type}`, `SK: #{period}#{legislator_id}` for metrics

## Monitoring & Observability Structure

### CloudWatch Organization
- **Log Groups**: `/aws/lambda/odm-{env}-{function-name}`
- **Metrics**: Custom namespace `ODM/{Environment}` for business metrics
- **Dashboards**: Separate dashboards for technical metrics, business KPIs, and costs

### Error Handling Patterns
- **Dead Letter Queues**: For failed Lambda executions
- **Circuit Breakers**: For external API calls to government websites
- **Graceful Degradation**: Fallback to cached data when sources are unavailable
