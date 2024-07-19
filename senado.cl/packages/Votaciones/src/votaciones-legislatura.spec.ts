import {mockClient} from "aws-sdk-client-mock";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSaveLegislaturaSesiones, getSaveLegislaturaSimpleList} from "./votaciones-legislatura.service";

const s3Mock = mockClient(S3Client);

describe('Listado Legislaturas Sesiones', () => {
  const putObjComMock = s3Mock
    .on(PutObjectCommand)
    .resolves({});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Obtener 2 últimas', async () => {
    const result = await getSaveLegislaturaSimpleList(2);

    expect(result.length).toEqual(2);
  }, 20_000);

  test('Obtener detalle sesión', async () => {
    const result = await getSaveLegislaturaSesiones(504);

    expect(result).toBeDefined();
  }, 20_000);
});
