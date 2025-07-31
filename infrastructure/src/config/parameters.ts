// import * as cdk from 'aws-cdk-lib'; // Will be used later
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface ParametersConfig {
  environment: string;
}

export class ParametersConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ParametersConfig) {
    super(scope, id);

    const { environment } = props;

    // Data source endpoints
    new ssm.StringParameter(this, 'SenadoBaseUrl', {
      parameterName: `/odm/${environment}/senado/base-url`,
      stringValue: 'https://www.senado.cl',
      description: 'Base URL for Senate website',
    });

    new ssm.StringParameter(this, 'CamaraBaseUrl', {
      parameterName: `/odm/${environment}/camara/base-url`,
      stringValue: 'https://www.camara.cl',
      description: 'Base URL for Chamber of Deputies website',
    });

    new ssm.StringParameter(this, 'ServelBaseUrl', {
      parameterName: `/odm/${environment}/servel/base-url`,
      stringValue: 'https://www.servel.cl',
      description: 'Base URL for SERVEL website',
    });

    // Extraction configuration
    new ssm.StringParameter(this, 'ExtractionBatchSize', {
      parameterName: `/odm/${environment}/extraction/batch-size`,
      stringValue: '100',
      description: 'Batch size for data extraction',
    });

    new ssm.StringParameter(this, 'ExtractionRetryAttempts', {
      parameterName: `/odm/${environment}/extraction/retry-attempts`,
      stringValue: '3',
      description: 'Number of retry attempts for failed extractions',
    });

    new ssm.StringParameter(this, 'ExtractionTimeout', {
      parameterName: `/odm/${environment}/extraction/timeout`,
      stringValue: '30000',
      description: 'Timeout for extraction requests in milliseconds',
    });

    // Analytics configuration
    new ssm.StringParameter(this, 'AnalyticsThresholds', {
      parameterName: `/odm/${environment}/analytics/thresholds`,
      stringValue: JSON.stringify({
        excessiveAbsence: 0.2, // 20% absence rate
        passiveAttendance: 0.3, // 30% non-voting attendance
        excessiveSpending: 2.0, // 2x average spending
        inconsistentVoting: 0.4, // 40% inconsistency rate
      }),
      description: 'Thresholds for problematic behavior detection',
    });

    // AI configuration
    new ssm.StringParameter(this, 'BedrockModelId', {
      parameterName: `/odm/${environment}/ai/bedrock-model-id`,
      stringValue: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      description: 'Bedrock model ID for AI analysis',
    });

    new ssm.StringParameter(this, 'AIAnalysisPrompts', {
      parameterName: `/odm/${environment}/ai/analysis-prompts`,
      stringValue: JSON.stringify({
        behaviorAnalyst: `Eres un analista especializado en transparencia legislativa chilena.
Analiza los datos proporcionados para identificar comportamientos problemáticos:
- Inasistencias injustificadas superiores al promedio
- Participación pasiva (asiste pero no vota)
- Gastos excesivos comparados con pares
- Inconsistencias entre promesas y votaciones

Proporciona análisis objetivo, basado en datos, con contexto histórico.
Formato de respuesta: JSON con campos 'tipo', 'severidad', 'evidencia', 'recomendacion'.`,
        reportGenerator: `Eres un periodista especializado en política chilena.
Genera reportes mensuales claros y accesibles para ciudadanos sobre:
- Resumen ejecutivo del período
- Comportamientos destacados (positivos y negativos)
- Comparaciones históricas
- Impacto en proyectos de ley relevantes

Usa lenguaje claro, evita tecnicismos, incluye contexto político relevante.`,
        trendDetector: `Eres un analista de datos especializado en tendencias políticas.
Identifica patrones emergentes en datos legislativos:
- Cambios en patrones de votación
- Tendencias de asistencia por partido
- Evolución de gastos parlamentarios
- Correlaciones entre eventos políticos y comportamiento

Proporciona insights predictivos con nivel de confianza.`,
      }),
      description: 'AI prompts for different analysis types',
    });

    // API configuration
    new ssm.StringParameter(this, 'ApiRateLimits', {
      parameterName: `/odm/${environment}/api/rate-limits`,
      stringValue: JSON.stringify({
        free: { requests: 1000, period: 'day' },
        premium: { requests: 10000, period: 'day' },
        developer: { requests: 50000, period: 'day' },
      }),
      description: 'API rate limits by user type',
    });

    // Notification configuration
    new ssm.StringParameter(this, 'NotificationSettings', {
      parameterName: `/odm/${environment}/notifications/settings`,
      stringValue: JSON.stringify({
        emailFrom: 'noreply@opendatamotivation.cl',
        webhookTimeout: 5000,
        retryAttempts: 3,
      }),
      description: 'Notification system settings',
    });

    // Data retention policies
    new ssm.StringParameter(this, 'DataRetentionPolicies', {
      parameterName: `/odm/${environment}/data/retention-policies`,
      stringValue: JSON.stringify({
        rawData: { days: 365 },
        processedData: { days: 1095 }, // 3 years
        analyticsData: { days: 730 }, // 2 years
        userSessions: { days: 30 },
      }),
      description: 'Data retention policies in days',
    });
  }
}
