import {mockClient} from "aws-sdk-client-mock";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSaveVotacionSimpleList} from "./votaciones.service";

const s3Mock = mockClient(S3Client);

describe('Listado Legislaturas Sesiones', () => {
  const putObjComMock = s3Mock
    .on(PutObjectCommand)
    .resolves({});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Obtener Votaciones', async () => {
    const result = await getSaveVotacionSimpleList(503, 9625);

    expect(result.length).toEqual(14);
  }, 5_000);
});
