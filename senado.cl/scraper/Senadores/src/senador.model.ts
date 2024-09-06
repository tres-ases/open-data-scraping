export interface SenadorEventoLegislatura {
  ID_LEGISLATURA: number
  NUMERO: number
  INICIO: string
  TERMINO: string
  TIPO: null
}

export interface SenadorResponse {
  pageProps: {
    resource: {
      data: {
        title: string //Nombre parlamentario
        parliamentarianDrupalData: {
          title: string //Nombre parlamentario (mejor)
          body: {
            body: string //Descripción larga
            processed: string //Descripción larga
            summary: string //Resumen
          }
        }
        parliamentarianSenadoData: {
          total: 1
          data: {
            ID_PARLAMENTARIO: number
            UUID: string
            SLUG: string
            NOMBRE: string
            APELLIDO_PATERNO: string
            APELLIDO_MATERNO: string
            CAMARA: 'S'
            PARTIDO_ID: number
            PARTIDO: string
            CIRCUNSCRIPCION_ID: number
            REGION: string
            REGION_ID: number
            COMITE: {
              ID: string
              UUID: string
              NOMBRE: string
              ABREVIATURA: string
            },
            FONO: string
            EMAIL: string
            SEXO: 1 | 2
            PERIODOS:
              {
                ID: number
                UUID: number
                CAMARA: 'S'
                DESDE: string
                HASTA: string
                VIGENTE: 1 | 0
              } []
            IMAGEN: string
            IMAGEN_120: string
            IMAGEN_450: string
            IMAGEN_600: string
            NOMBRE_COMPLETO: string
            SEXO_ETIQUETA: string
            SEXO_ETIQUETA_ABREVIATURA: string
          }[]
          CARGOS: string
          ENLACES: {
            FACEBOOK_PAGE: string | null
            FACEBOOK_CUENTA: string | null
            TWITTER: string | null
            WEB_PERSONAL: string | null
            INSTAGRAM: string | null
            LINKEDIN: string | null
            FLICKR: string | null
          }[]
          ASISTENCIA_SALA: SenadorEventoLegislatura[]
          ASISTENCIA_COMISIONES: SenadorEventoLegislatura[]
          COMISIONES: SenadorEventoLegislatura[]
          MOCIONES: SenadorEventoLegislatura[]
          MOCIONES_INADMISIBLES: SenadorEventoLegislatura[]
          ASUNTOS: SenadorEventoLegislatura[]
          OFICIOS_INCIDENTES: SenadorEventoLegislatura[]
          INTERVENCIONES_TRANSCRITAS: SenadorEventoLegislatura[]
          INTERVENCIONES_VIDEO: SenadorEventoLegislatura[]
        }
      }
    }
  }
}
