import axios from "axios";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {ParlamentarioDetalle, SenadorFotoTipo} from "./senadores.model";
import Commons from "@senado-cl/commons";
import * as cheerio from "cheerio";

const s3Client = new S3Client({});

const getDetalleUrl = (parlId: number) => `https://tramitacion.senado.cl/appsenado/index.php?mo=senadores&ac=fichasenador&id=${parlId}`;
const getFotoUrl = (parlId: number, tipo: SenadorFotoTipo) => `https://tramitacion.senado.cl/appsenado/index.php?mo=senadores&ac=getFoto&id=${parlId}&tipo=${tipo}`;

const getImageBucketKey = (parlId: number, tipo: SenadorFotoTipo) => `Senadores/Detalle/Foto/parlId=${parlId}/${tipo}.jpeg`;

const getJsonBucketKey = (parlId: number) => `Senadores/Detalle/JsonStructured/parlId=${parlId}/data.json`;

export const downloadSaveImages = async (parlId: number) => {
  try {
    for (const tipo of [SenadorFotoTipo.NORMAL, SenadorFotoTipo.MINI]) {
      const response = await axios.get(getFotoUrl(parlId, tipo), {responseType: 'arraybuffer'});
      const buffer = Buffer.from(response.data);

      const command = new PutObjectCommand({
        Bucket: Commons.Constants.S3_BUCKET_SENADO,
        Key: getImageBucketKey(parlId, tipo),
        Body: buffer,
      });

      await s3Client.send(command);
    }
  } catch (error) {
    console.error('Error al descargar o subir la imagen:', error);
  }
}


export const getSaveDetalle = async (parlId: number): Promise<ParlamentarioDetalle> => {
  const page = await axios.get(getDetalleUrl(parlId));
  const $ = cheerio.load(page.data);

  const result: ParlamentarioDetalle = {
    nombre: $('section.seccion1 div.info.sans > h1').text().trim(),
    region: $('section.seccion1 div.info.sans > h2:nth-child(4)').text().trim(),
  };

  for (const li of $('section.seccion1 div.info.sans ul > li').toArray()) {
    const text = $(li).text();
    if (text.includes('Partido:')) result.partido = text.replace('Partido:', '').trim();
    else if (text.includes('Teléfono:')) result.telefono = text.replace('Teléfono:', '').trim();
    else if (text.includes('Mail:')) result.correo = text.replace('Mail:', '').trim();
  }

  await saveJsonStructured(parlId, result);

  return result;
}

const saveJsonStructured = async (parlId: number, detalle: ParlamentarioDetalle) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: Commons.Constants.S3_BUCKET_SENADO,
    Key: getJsonBucketKey(parlId),
    Body: JSON.stringify(detalle)
  }));
}
