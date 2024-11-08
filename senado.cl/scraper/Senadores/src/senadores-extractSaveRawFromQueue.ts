import axios from "axios";
import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {SendMessageCommand, SQSClient} from "@aws-sdk/client-sqs";
import {SenadorImgRepo, SenadorRawRepo} from "@senado-cl/global/repo";
import {CommonsData} from "@senado-cl/scraper-commons";
import {SenadorRaw} from "@senado-cl/global/model";
import {parliamentarianSenadoData2SenadorRaw} from "./senadores.mapper";
import * as cheerio from "cheerio";
import {SQSEvent} from "aws-lambda/trigger/sqs";

axios.defaults.timeout = 5000;

const serviceName = 'SenadoresGetSaveFromQueue';
const logger = new Logger({
  logLevel: 'DEBUG',
  serviceName
});
const tracer = new Tracer({serviceName});
const sqsClient = tracer.captureAWSv3Client(new SQSClient({}));

interface Event {
  slug: string
}

interface ImageFileUrlMap {
  [file: string]: string
}

const SENADOR_URL = (slug: string) => `${CommonsData.SENADO_WEB}/senadoras-y-senadores/listado-de-senadoras-y-senadores/${slug}`;

const senadorRawRepo = new SenadorRawRepo();
const senadorImgRepo = new SenadorImgRepo();

export class ExtractSaveRawFromQueue implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler({Records}: SQSEvent, _context: any) {
    logger.info('Ejecutando getSaveDtlQueueHandler', {Records});
    await Promise.all(
      Records.map(async (record) => this.extractSaveRaw(record.body))
    );
  }

  @tracer.captureMethod()
  public async extractSaveRaw(slug: string) {
    logger.info('Ejecutando getSaveHandler', {slug});
    const dLogger = logger.createChild({
      persistentKeys: {slug}
    });
    dLogger.info('Ejecutando getSaveSenador', {slug});
    const json = await this.extractData(slug);
    const imageFileUrlMap = await this.getImageFileUrlMapFromJson(slug, json)
    await this.save(await this.extractFromJson(slug, json), imageFileUrlMap);
    const params = {
      QueueUrl: process.env.PART_MAP_DISTILL_QUEUE_URL!,
      MessageBody: slug,
    };
    const command = new SendMessageCommand(params);
    dLogger.debug('SQS.SendMessageCommand', {params});
    return await sqsClient.send(command);
  }

  @tracer.captureMethod()
  public async extractSaveImgMap(slug: string, imageFileUrlMap: ImageFileUrlMap) {
    const dLogger = logger.createChild({
      persistentKeys: {slug}
    });
    try {
      const promises: Promise<any>[] = [];
      for (const [img, url] of Object.entries(imageFileUrlMap)) {
        promises.push(
          this.extractSaveImg(slug, img, url)
        );
      }
      await Promise.all(promises);
    } catch (error) {
      dLogger.error("Error al extraer la imagen", error);
    }
  }

  @tracer.captureMethod()
  public async extractSaveImg(slug: string, img: string, url: string) {
    const dLogger = logger.createChild({
      persistentKeys: {slug}
    });
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      await senadorImgRepo.save(Buffer.from(response.data), 'image/jpeg', {senSlug: slug, img});
    } catch (error) {
      dLogger.error("Error al extraer la imagen", error);
    }
  }

  @tracer.captureMethod()
  public async getImageFileUrlMapFromJson(slug: string, json: any) {
    const dLogger = logger.createChild({
      persistentKeys: {slug}
    });
    const images: ImageFileUrlMap = {};
    try {
      const senadorData = json['props']['pageProps']['resource']['data']['parliamentarianSenadoData']['data'][0];
      if (senadorData) {
        images['default.jpg'] = senadorData['IMAGEN'];
        images['120x120.jpg'] = senadorData['IMAGEN_120'];
        images['450x750.jpg'] = senadorData['IMAGEN_450'];
        images['600x600.jpg'] = senadorData['IMAGEN_600'];
      } else {
        dLogger.error("La información del senador no está definida");
      }
    } catch (err) {
      dLogger.error("Error al obtener la información del senador", err);
    }
    return images;
  }

  @tracer.captureMethod()
  public async extractFromJson(slug: string, json: any) {
    const dLogger = logger.createChild({
      persistentKeys: {slug}
    });
    const senador = parliamentarianSenadoData2SenadorRaw(json.props.pageProps.resource.data.parliamentarianSenadoData);
    dLogger.info('Senador', {senador});
    return senador;
  }

  @tracer.captureMethod()
  public async extractData(slug: string) {
    const dLogger = logger.createChild({
      persistentKeys: {slug}
    });
    const url = SENADOR_URL(slug);
    dLogger.info('Obteniendo información', {url});
    const $ = await cheerio.fromURL(url);
    const json = JSON.parse($('#__NEXT_DATA__').text());
    dLogger.debug('Información obtenida', {json});
    return json;
  }

  @tracer.captureMethod()
  public async save(senador: SenadorRaw, imageFileUrlMap: ImageFileUrlMap) {
    await Promise.all([
      senadorRawRepo.save(senador, {senSlug: senador.slug}),
      this.extractSaveImgMap(senador.slug, imageFileUrlMap),
    ]);
    return senador;
  };
}

const instance = new ExtractSaveRawFromQueue();
export const handler = instance.handler.bind(instance);
