import { getSaveDietas } from './dieta-detalle.service';
import {expect} from "@jest/globals";
import {mockClient} from "aws-sdk-client-mock";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";

const s3Mock = mockClient(S3Client);

describe('Obtener Dietas Parlamentarias', () => {
  const putObjComMock = s3Mock
    .on(PutObjectCommand)
    .resolves({});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Extraer la data del 2023 - 01', async () => {
    const result = await getSaveDietas('2023', '01');

    expect(result.length).toEqual(50);
  });
});
