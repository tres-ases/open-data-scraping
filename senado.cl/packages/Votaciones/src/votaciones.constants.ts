export const VOTACIONES_URL = 'https://tramitacion.senado.cl/appsenado/index.php?mo=sesionessala&ac=votacionSala&legiini=462';

export const getVotacionesUrl = (legislatura: number, sesion?: number) => `https://tramitacion.senado.cl/appsenado/index.php?mo=sesionessala&ac=votacionSala&legiini=462&legiid=${legislatura}${sesion ? `&sesiid=${sesion}` : ''}`;



