import {getAnoMesParlIdArray, getSaveData} from "./gastos-operacionales.service";
import {mockClient} from "aws-sdk-client-mock";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";

const s3Mock = mockClient(S3Client);

describe('Listado AnoMesParlId', () => {

  test('Debe obtener la información', async () => {
    const result = await getAnoMesParlIdArray(2024, 4);

    expect(result.length).toBeGreaterThanOrEqual(54);
  });
});

describe('Obtener y almacenar data parlamentario', () => {
  const putObjComMock = s3Mock
    .on(PutObjectCommand)
    .resolves({});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Debe obtener y almacenar el detalle', async () => {
    const result = await getSaveData(2024, 4, 5);

    expect(result.length).toBeGreaterThanOrEqual(24);
  });
});
