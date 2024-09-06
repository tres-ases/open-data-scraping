import * as cheerio from "cheerio";

export const getBoletin = async (id: string) => {
  const $ = await cheerio.fromURL(`https://tramitacion.senado.cl/wspublico/tramitacion.php?boletin=${id}`, {
    xml: {
      lowerCaseAttributeNames: true,
      xmlMode: true,
      lowerCaseTags: true,
      recognizeSelfClosing: true,
    }
  })

  const data = $('proyectos').extract({
    proyecto: [
      {
        selector: 'proyecto',
        value: {
          descripcion: {
            selector: 'descripcion',
            value: {
              boletin: 'boletin',
              titulo: 'titulo',
              fechaIngreso: 'fecha_ingreso',
              iniciativa: 'iniciativa',
              camaraOrigen: 'camara_origen',
              urgenciaActual: 'urgencia_actual',
              etapa: 'etapa',
              subEtapa: 'subEtapa',
              leyNumero: 'leynro',
              diarioOficial: 'diariooficial',
              estado: 'estado',
              linkMensajeMocion: 'link_mensaje_mocion'
            }
          },
          autores: [{
            selector: 'autores > autor',
            value: {
              parlamentario: 'parlamentario',
            }
          }],
          tramitaciones: [{
            selector: 'tramitacion > tramite',
            value: {
              sesion: 'sesion',
              fecha: 'fecha',
              descripcionTramite: 'descripciontramite',
              etapaDescripcion: 'etapdescripcion',
              camaraTramite: 'camaratramite',
            }
          }],
          votaciones: [{
            selector: 'votaciones > votacion',
            value: {
              sesion: 'sesion',
              fecha: 'fecha',
              tema: 'tema',
              si: 'si',
              no: 'no',
              abstencion: 'abstencion',
              pareo: 'pareo',
              quorum: 'quorum',
              tipoProyecto: 'tipoproyecto',
              etapa: 'etapa',
              detalle: [{
                selector: 'detalle_votacion voto',
                value: {
                  parlamentario: 'parlamentario',
                  seleccion: 'seleccion',
                }
              }]
            }
          }],
          urgencias: [{
            selector: 'urgencias > urgencia',
            value: {
              tipo: 'tipo',
              ingresoFecha: 'fechaingreso',
              ingresoMensaje: 'mensajeingreso',
              ingresoCamara: 'camaraingreso',
              retiroFecha: 'fecharetiro',
              retiroMensaje: 'mensajeretiro',
              retiroCamara: 'camararetiro',
            }
          }],
          informes: [{
            selector: 'informes > informe',
            value: {
              fecha: 'fechainforme',
              tramite: 'tramite',
              etapa: 'etapa',
              link: 'link_informe',
            }
          }],
          comparados: [{
            selector: 'comparados > comparado',
            value: {
              comparado: 'comparado',
              link: 'link_comparado',
            }
          }],
          oficios: [{
            selector: 'oficios > oficio',
            value: {
              fecha: 'fecha',
              tramite: 'tramite',
              etapa: 'etapa',
              tipo: 'tipo',
              camara: 'camara',
              descripcion: 'descripcion',
              link: 'link_oficio',
            }
          }],
          indicaciones: [{
            selector: 'indicaciones > indicacion',
            value: {
              fecha: 'fecha',
              tramite: 'tramite',
              etapa: 'etapa',
              link: 'link_indicacion',
            }
          }],
          materias: ['materias > materia > descripcion']
        }
      }
    ],
  })
  return data;
}
