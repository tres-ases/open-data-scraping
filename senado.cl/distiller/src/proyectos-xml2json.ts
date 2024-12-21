import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {DynamoDBDocumentClient, PutCommand} from "@aws-sdk/lib-dynamodb";
import {S3Event} from "aws-lambda";
import * as cheerio from "cheerio";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";

const serviceName = 'ProyectosExtractSaveRawFromQueue';
const logger = new Logger({
  logLevel: 'DEBUG',
  serviceName
});
const tracer = new Tracer({serviceName});

const s3Client = tracer.captureAWSv3Client(new S3Client({}));
const ddbClient = tracer.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(ddbClient);

export class Xml2Json implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler(event: S3Event, _context: any) {
    logger.info('Ejecutando Xml2Json', {event});
    for (const {s3: {bucket, object}} of event.Records) {
      const key = decodeURIComponent(object.key);
      const boletin = key.match(/boletin=(\d+)/)![1];
      logger.appendKeys({bucketName: bucket.name, key, boletin});
      const xml = await this.readFile(bucket.name, key)
      logger.debug('XML', {xml});
      const info = await this.transform(xml);
      logger.debug('XML transformado', {json: info});

      await docClient.send(new PutCommand({
        TableName: process.env.PROYECTOS_TABLE as string,
        Item: {
          boletin,
          info,
          fechaModificacion: new Date().toISOString()
        },
      }));
      logger.removeKeys(['bucketName', 'key'])
    }
  }

  @tracer.captureMethod()
  public async readFile(bucket: string, key: string) {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }));
    return await response.Body!.transformToString();
  }

  @tracer.captureMethod()
  public async transform(xml: string) {
    const $ = cheerio.load(xml, {
      xml: {
        lowerCaseAttributeNames: true,
        xmlMode: true,
        lowerCaseTags: true,
        recognizeSelfClosing: true,
      }
    });

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
    });
    if (data.proyecto && data.proyecto[0]) {
      try {
        const proyecto = data.proyecto[0] as any;
        logger.debug('Proyecto obtenido satisfactoriamente', {proyecto})
        return proyecto;
      } catch (error) {
        logger.error('Error al obtener proyecto', {error});
        return undefined;
      }
    } else {
      logger.error('No se encontró el proyecto');
      return undefined;
    }
  }
}

const instance = new Xml2Json();
export const handler = instance.handler.bind(instance);
