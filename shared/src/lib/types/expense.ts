import { z } from 'zod';

// Expense schema
export const ExpenseSchema = z.object({
  id: z.string(),
  idLegislador: z.string(),
  nombreLegislador: z.string(),
  fechaGasto: z.string().datetime(),
  concepto: z.string(),
  descripcionDetallada: z.string().optional(),
  categoria: z.string(),
  monto: z.number(),
  montoNeto: z.number().optional(),
  impuestos: z.number().optional(),
  moneda: z.string().default('CLP'),
  proveedor: z.string().optional(),
  fechaAprobacion: z.string().datetime().optional(),
  aprobadoPor: z.string().optional(),
  documentoRespaldo: z.string().url().optional(),
  camara: z.enum(['senado', 'camara']),
});

export type Expense = z.infer<typeof ExpenseSchema>;
