// Data sources
export const DATA_SOURCES = {
  SENADO: 'senado',
  CAMARA: 'camara',
  SERVEL: 'servel',
} as const;

// Chambers
export const CHAMBERS = {
  SENADO: 'senado',
  CAMARA: 'camara',
} as const;

// Legislator states
export const LEGISLATOR_STATES = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  REEMPLAZADO: 'reemplazado',
} as const;

// Session types
export const SESSION_TYPES = {
  ORDINARIA: 'ordinaria',
  EXTRAORDINARIA: 'extraordinaria',
} as const;

// Vote types
export const VOTE_TYPES = {
  FAVOR: 'favor',
  CONTRA: 'contra',
  ABSTENCION: 'abstencion',
  AUSENTE: 'ausente',
} as const;

// Voting types
export const VOTING_TYPES = {
  GENERAL: 'general',
  PARTICULAR: 'particular',
  ARTICULO: 'articulo',
} as const;

// Project types
export const PROJECT_TYPES = {
  LEY: 'ley',
  REFORMA_CONSTITUCIONAL: 'reforma_constitucional',
  ACUERDO: 'acuerdo',
} as const;

// Urgency levels
export const URGENCY_LEVELS = {
  SIMPLE: 'simple',
  SUMA: 'suma',
  DISCUSION_INMEDIATA: 'discusion_inmediata',
} as const;

// Problematic behavior types
export const PROBLEMATIC_BEHAVIOR_TYPES = {
  INASISTENCIA_EXCESIVA: 'inasistencia_excesiva',
  ASISTENCIA_PASIVA: 'asistencia_pasiva',
  GASTO_EXCESIVO: 'gasto_excesivo',
  VOTO_INCONSISTENTE: 'voto_inconsistente',
} as const;

// Severity levels
export const SEVERITY_LEVELS = {
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
} as const;

// Analytics types
export const ANALYTICS_TYPES = {
  PERFORMANCE: 'performance',
  RANKING: 'ranking',
  BEHAVIOR: 'behavior',
  TREND: 'trend',
} as const;

// Ranking types
export const RANKING_TYPES = {
  ASISTENCIA: 'asistencia',
  PARTICIPACION: 'participacion',
  GASTOS: 'gastos',
  CONSISTENCIA: 'consistencia',
} as const;

// AI Insight types
export const AI_INSIGHT_TYPES = {
  PATTERN_DETECTION: 'pattern_detection',
  ANOMALY_IDENTIFICATION: 'anomaly_identification',
  TREND_ANALYSIS: 'trend_analysis',
  COMPARATIVE_INSIGHT: 'comparative_insight',
} as const;

// Trend directions
export const TREND_DIRECTIONS = {
  ASCENDENTE: 'ascendente',
  DESCENDENTE: 'descendente',
  ESTABLE: 'estable',
  VOLATIL: 'volatil',
} as const;

// DynamoDB table prefixes
export const DYNAMODB_PREFIXES = {
  LEGISLATOR: 'LEG#',
  SESSION: 'SESSION#',
  VOTING: 'VOTING#',
  PROJECT: 'PROJECT#',
  ANALYTICS: 'ANALYTICS#',
} as const;

// S3 prefixes
export const S3_PREFIXES = {
  RAW: 'raw',
  PROCESSED: 'processed',
  SENADO: 'senado',
  CAMARA: 'camara',
  SERVEL: 'servel',
  LEGISLATORS: 'legisladores',
  SESSIONS: 'sesiones',
  VOTINGS: 'votaciones',
  PROJECTS: 'proyectos',
  EXPENSES: 'gastos',
  ANALYTICS: 'analisis',
} as const;

// API response codes
export const API_RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const;

// Default pagination
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Date formats
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
} as const;

// Extraction batch sizes
export const EXTRACTION_BATCH_SIZES = {
  LEGISLATORS: 50,
  SESSIONS: 100,
  VOTINGS: 200,
  PROJECTS: 100,
  EXPENSES: 500,
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  LEGISLATORS: 3600, // 1 hour
  SESSIONS: 1800, // 30 minutes
  VOTINGS: 1800, // 30 minutes
  ANALYTICS: 7200, // 2 hours
  RANKINGS: 14400, // 4 hours
} as const;
