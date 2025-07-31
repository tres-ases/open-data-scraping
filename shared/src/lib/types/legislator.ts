import { z } from 'zod';

// Base legislator schema
export const LegislatorSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellidoPaterno: z.string(),
  apellidoMaterno: z.string(),
  partido: z.string(),
  region: z.string(),
  circunscripcion: z.string().optional(),
  distrito: z.string().optional(),
  camara: z.enum(['senado', 'camara']),
  periodo: z.string(),
  fechaInicioPeriodo: z.string().datetime(),
  fechaFinPeriodo: z.string().datetime(),
  estado: z.enum(['activo', 'inactivo', 'reemplazado']),
  contacto: z.object({
    email: z.string().email().optional(),
    telefono: z.string().optional(),
    oficina: z.string().optional(),
    direccion: z.string().optional(),
  }).optional(),
  comisiones: z.array(z.object({
    nombre: z.string(),
    tipo: z.string(),
    cargo: z.string().optional(),
    fechaInicio: z.string().datetime(),
    fechaFin: z.string().datetime().optional(),
  })).optional(),
  biografia: z.object({
    fechaNacimiento: z.string().datetime().optional(),
    profesion: z.string().optional(),
    estudios: z.string().optional(),
    experienciaPolitica: z.string().optional(),
  }).optional(),
  resultadoElectoral: z.object({
    anoEleccion: z.number(),
    votosObtenidos: z.number(),
    porcentajeVotos: z.number(),
    listaElectoral: z.string(),
  }).optional(),
});

export type Legislator = z.infer<typeof LegislatorSchema>;

// Performance metrics schema
export const PerformanceMetricsSchema = z.object({
  tasaAsistencia: z.number().min(0).max(1),
  participacionVotaciones: z.number().min(0).max(1),
  gastosPromedio: z.number().min(0),
  puntajeConsistencia: z.number().min(0).max(1),
  ultimaActualizacion: z.string().datetime(),
});

export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;

// Problematic behavior schema
export const ProblematicBehaviorSchema = z.object({
  tipo: z.enum([
    'inasistencia_excesiva',
    'asistencia_pasiva',
    'gasto_excesivo',
    'voto_inconsistente',
  ]),
  severidad: z.enum(['baja', 'media', 'alta']),
  descripcion: z.string(),
  evidencia: z.array(z.object({
    tipo: z.string(),
    valor: z.string(),
    fecha: z.string().datetime(),
    contexto: z.string().optional(),
  })),
  metricas: z.object({
    valorActual: z.number(),
    promedioCamara: z.number(),
    desviacionEstandar: z.number(),
    percentil: z.number().min(0).max(100),
  }),
  comparacionHistorica: z.object({
    valorPeriodoAnterior: z.number().optional(),
    tendencia: z.enum(['mejorando', 'empeorando', 'estable']),
    cambioPorcentual: z.number().optional(),
  }),
  insightIA: z.string().optional(),
  recomendaciones: z.array(z.string()),
  fechaDeteccion: z.string().datetime(),
  fechaActualizacion: z.string().datetime(),
});

export type ProblematicBehavior = z.infer<typeof ProblematicBehaviorSchema>;
