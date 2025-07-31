import { z } from 'zod';

// Analytics record schema
export const AnalyticsRecordSchema = z.object({
  id: z.string(),
  tipo: z.enum(['performance', 'ranking', 'behavior', 'trend']),
  periodo: z.string(),
  idLegislador: z.string().optional(),
  camara: z.enum(['senado', 'camara']).optional(),
  datos: z.record(z.string(), z.any()),
  calculadoEn: z.string().datetime(),
  validoHasta: z.string().datetime().optional(),
});

export type AnalyticsRecord = z.infer<typeof AnalyticsRecordSchema>;

// Ranking schema
export const RankingSchema = z.object({
  tipo: z.enum(['asistencia', 'participacion', 'gastos', 'consistencia']),
  camara: z.enum(['senado', 'camara']),
  periodo: z.string(),
  rankings: z.array(z.object({
    posicion: z.number(),
    idLegislador: z.string(),
    nombreLegislador: z.string(),
    partido: z.string(),
    valor: z.number(),
    percentil: z.number(),
    cambioDesdeAnterior: z.number().optional(),
  })),
  estadisticas: z.object({
    promedio: z.number(),
    mediana: z.number(),
    desviacionEstandar: z.number(),
    minimo: z.number(),
    maximo: z.number(),
  }),
  fechaGeneracion: z.string().datetime(),
});

export type Ranking = z.infer<typeof RankingSchema>;

// AI Insight schema
export const AIInsightSchema = z.object({
  id: z.string(),
  tipo: z.enum(['pattern_detection', 'anomaly_identification', 'trend_analysis', 'comparative_insight']),
  confianza: z.number().min(0).max(1),
  narrativa: z.string(),
  datosDeApoyo: z.record(z.string(), z.any()),
  recomendaciones: z.array(z.string()),
  idLegislador: z.string().optional(),
  periodo: z.string(),
  fechaGeneracion: z.string().datetime(),
  modeloUtilizado: z.string(),
});

export type AIInsight = z.infer<typeof AIInsightSchema>;

// Trend schema
export const TrendSchema = z.object({
  id: z.string(),
  tipo: z.string(),
  descripcion: z.string(),
  camara: z.enum(['senado', 'camara']).optional(),
  partido: z.string().optional(),
  region: z.string().optional(),
  tendencia: z.enum(['ascendente', 'descendente', 'estable', 'volatil']),
  magnitud: z.number(),
  confianza: z.number().min(0).max(1),
  periodoInicio: z.string().datetime(),
  periodoFin: z.string().datetime(),
  datosHistoricos: z.array(z.object({
    fecha: z.string().datetime(),
    valor: z.number(),
  })),
  proyeccion: z.array(z.object({
    fecha: z.string().datetime(),
    valorProyectado: z.number(),
    intervaloConfianza: z.object({
      inferior: z.number(),
      superior: z.number(),
    }),
  })).optional(),
  factoresInfluyentes: z.array(z.string()),
  fechaDeteccion: z.string().datetime(),
});

export type Trend = z.infer<typeof TrendSchema>;
