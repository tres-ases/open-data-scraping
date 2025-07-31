import { z } from 'zod';

// Session schema
export const SessionSchema = z.object({
  id: z.string(),
  numeroSesion: z.number(),
  fechaSesion: z.string().datetime(),
  horaInicio: z.string().datetime(),
  horaFin: z.string().datetime().optional(),
  tipoSesion: z.enum(['ordinaria', 'extraordinaria']),
  periodoLegislativo: z.string(),
  presidenteSesion: z.string(),
  secretario: z.string().optional(),
  quorumApertura: z.number(),
  quorumCierre: z.number().optional(),
  camara: z.enum(['senado', 'camara']),
  ordenDia: z.array(z.object({
    numero: z.number(),
    boletin: z.string(),
    titulo: z.string(),
    tipoTramite: z.string(),
    urgencia: z.string().optional(),
  })),
  asistencia: z.array(z.object({
    idLegislador: z.string(),
    nombre: z.string(),
    presente: z.boolean(),
    horaLlegada: z.string().datetime().optional(),
    horaSalida: z.string().datetime().optional(),
    justificacionAusencia: z.string().optional(),
    tipoAusencia: z.enum(['justificada', 'injustificada', 'mision_oficial']).optional(),
  })),
});

export type Session = z.infer<typeof SessionSchema>;

// Voting schema
export const VotingSchema = z.object({
  id: z.string(),
  idSesion: z.string(),
  boletinProyecto: z.string(),
  tituloProyecto: z.string(),
  fechaVotacion: z.string().datetime(),
  tipoVotacion: z.enum(['general', 'particular', 'articulo']),
  articuloVotado: z.string().optional(),
  resultado: z.enum(['aprobado', 'rechazado', 'retirado']),
  quorumRequerido: z.string(),
  votosFavor: z.number(),
  votosContra: z.number(),
  abstenciones: z.number(),
  ausentes: z.number(),
  detalleVotos: z.array(z.object({
    idLegislador: z.string(),
    nombreLegislador: z.string(),
    partido: z.string(),
    voto: z.enum(['favor', 'contra', 'abstencion', 'ausente']),
    justificacionAusencia: z.string().optional(),
    cambioVoto: z.boolean().optional(),
  })),
  urgenciaProyecto: z.string().optional(),
  comisionOrigen: z.string().optional(),
  camara: z.enum(['senado', 'camara']),
});

export type Voting = z.infer<typeof VotingSchema>;

// Project schema
export const ProjectSchema = z.object({
  boletin: z.string(),
  titulo: z.string(),
  tipoProyecto: z.enum(['ley', 'reforma_constitucional', 'acuerdo']),
  camaraOrigen: z.enum(['senado', 'camara']),
  fechaIngreso: z.string().datetime(),
  fechaPublicacion: z.string().datetime().optional(),
  estadoTramitacion: z.string(),
  urgencia: z.enum(['simple', 'suma', 'discusion_inmediata']).optional(),
  etapaTramitacion: z.string(),
  comisionActual: z.string().optional(),
  autores: z.array(z.object({
    nombre: z.string(),
    partido: z.string(),
    camara: z.enum(['senado', 'camara']),
  })),
  materias: z.array(z.string()),
  tramitacion: z.array(z.object({
    fecha: z.string().datetime(),
    tramite: z.string(),
    camara: z.enum(['senado', 'camara']),
    comision: z.string().optional(),
    resultado: z.string(),
  })),
  votacionesAsociadas: z.array(z.string()),
});

export type Project = z.infer<typeof ProjectSchema>;
// Votation schema
export const VotationSchema = z.object({
  id: z.string(),
  numeroVotacion: z.number(),
  fechaVotacion: z.string().datetime(),
  numeroSesion: z.number().optional(),
  boletin: z.string().optional(),
  materia: z.string(),
  descripcion: z.string().optional(),
  tipoVotacion: z.enum(['nominal', 'economica', 'secreta']).optional(),
  resultado: z.enum(['aprobado', 'rechazado', 'retirado', 'pendiente']),
  urgencia: z.string().optional(),
  etapaTramitacion: z.string().optional(),
  votosFavor: z.number().optional(),
  votosContra: z.number().optional(),
  votosAbstenciones: z.number().optional(),
  votosAusentes: z.number().optional(),
  quorumRequerido: z.number().optional(),
  quorumObtenido: z.number().optional(),
  votosIndividuales: z.array(z.object({
    idLegislador: z.string(),
    nombre: z.string(),
    voto: z.enum(['favor', 'contra', 'abstencion', 'ausente']),
    partido: z.string().optional(),
    region: z.string().optional(),
  })).optional(),
  camara: z.enum(['senado', 'camara']),
});

export type Votation = z.infer<typeof VotationSchema>;
