import axios from "axios";
import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {SendMessageCommand, SQSClient} from "@aws-sdk/client-sqs";
import {SenadorImgRepo, SenadorRawRepo} from "@senado-cl/global/repo";
import {CommonsData} from "@senado-cl/scraper-commons";
import {SenadorRaw} from "@senado-cl/global/model";
import {SenadorResponse} from "./senadores.model";
import {parliamentarianSenadoData2SenadorRaw} from "./senadores.mapper";

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

const token = 'GkTQim2_3oBCgZvYsnznZ';
const SENADOR_URL = (slug: string) => `${CommonsData.SENADO_WEB}/_next/data/${token}/senadoras-y-senadores/listado-de-senadoras-y-senadores/${slug}.json`;
const SENADOR_IMG_URL = (uuid: string, slug: string) => `${CommonsData.SENADO_WEB}/_next/image?url=https://cdn.senado.cl/portal-senado-produccion/public/parlamentarios/${uuid}/${slug}_600x600.jpg&w=1080&q=75`;

const senadorRawRepo = new SenadorRawRepo();
const senadorImgRepo = new SenadorImgRepo();

export class ExtractSaveRaw implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler({slug}: Event, _context: any) {
    logger.info('Ejecutando getSaveHandler', {slug});
    const dLogger = logger.createChild({
      persistentKeys: {slug}
    });
    dLogger.info('Ejecutando getSaveSenador', {slug});
    await this.save(await this.extract(slug));
    const params = {
      QueueUrl: process.env.PART_MAP_DISTILL_QUEUE_URL!,
      MessageBody: slug,
    };
    const command = new SendMessageCommand(params);
    dLogger.debug('SQS.SendMessageCommand', {params});
    return await sqsClient.send(command);
  }

  @tracer.captureMethod()
  public async extractSaveImg(uuid: string, slug: string) {
    const dLogger = logger.createChild({
      persistentKeys: {uuid, slug}
    });
    try {
      const imageUrl = SENADOR_IMG_URL(uuid, slug);
      dLogger.info("Obteniendo img src", {imageUrl});
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      await senadorImgRepo.save(Buffer.from(response.data), 'image/jpeg', {senSlug: slug, img: 'default.jpg'});
    } catch (error) {
      dLogger.error("Error al obtener la imagen", error);
    }
  }

  @tracer.captureMethod()
  public async extract(slug: string) {
    const dLogger = logger.createChild({
      persistentKeys: {slug}
    });
    const url = SENADOR_URL(slug);
    dLogger.info('Obteniendo información', {url});
    const response = await axios.get<SenadorResponse>(SENADOR_URL(slug));
    dLogger.debug('Información obtenida', {data: response.data});
    const senador = parliamentarianSenadoData2SenadorRaw(response.data.pageProps.resource.data.parliamentarianSenadoData);
    dLogger.info('Senador', {senador});
    return senador;
  }

  @tracer.captureMethod()
  public async save(senador: SenadorRaw) {
    await Promise.all([
      senadorRawRepo.save(senador, {senSlug: senador.slug}),
      this.extractSaveImg(senador.uuid, senador.slug),
    ]);
    return senador;
  };
}

const instance = new ExtractSaveRaw();
export const handler = instance.handler.bind(instance);
