import {getSaveDetalle} from "./senadores-detalle.service";
import {mockClient} from "aws-sdk-client-mock";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";

const s3Mock = mockClient(S3Client);

describe('Información Ficha Senador', () => {
  const putObjComMock = s3Mock
    .on(PutObjectCommand)
    .resolves({});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Obtener datos', async () => {
    const result = await getSaveDetalle(985);

    expect(result).toMatchObject({
      nombre: 'Isabel Allende Bussi',
      region: 'Región de Valparaíso',
      partido: 'P.S.',
      telefono: '(56-32) 2504671',
      correo: 'iallende@senado.cl'
    });
  });
});
