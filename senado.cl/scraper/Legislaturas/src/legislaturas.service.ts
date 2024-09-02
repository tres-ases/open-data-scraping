import axios from "axios";
import {CommonsData} from "@senado-cl/scraper-commons";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {LegislaturasResponse} from "./legislaturas.model";
import {MainBucketKey} from "@senado-cl/global";
import {LegislaturasBucketKey, Legislatura, LegislaturaSc} from "@senado-cl/global/legislaturas";

const LEGISLATURAS_URL = `${CommonsData.SENADO_WEB_BACK}/legislatures`;

const s3Client = new S3Client({});

export const getLegislaturas = async (): Promise<Legislatura[]> => {
  const legislaturas = await axios.get<LegislaturasResponse>(LEGISLATURAS_URL, {
    params: {
      limit: 100
    }
  });
  return transform(legislaturas.data.data);
}

export const saveLegislaturas = async (legislaturas: Legislatura[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: MainBucketKey.S3_BUCKET,
    Key: LegislaturasBucketKey.json,
    Body: JSON.stringify(legislaturas)
  }))
};

const transform = (legislaturas: LegislaturaSc[]): Legislatura[] => {
  return legislaturas.map<Legislatura>(l => ({
    id: l.ID_LEGISLATURA,
    numero: l.NUMERO,
    tipo: l.TIPO,
    inicio: l.INICIO,
    termino: l.TERMINO
  }));
}

export const getSaveLegislaturas = async () => {
  await saveLegislaturas(await getLegislaturas());
}
