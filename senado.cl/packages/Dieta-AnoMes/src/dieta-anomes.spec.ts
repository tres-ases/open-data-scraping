import {PutObjectCommandInput} from "@aws-sdk/client-s3/dist-types/commands/PutObjectCommand";
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {Ano} from "@senado-cl/commons/dist/dieta/model";
import {mockClient} from 'aws-sdk-client-mock';
import {getAnos, saveJsonLines} from "./dieta-anomes.service";

const s3Mock = mockClient(S3Client);

test('Extracción Ano 2023 - Meses', async () => {
  const response = await getAnos('2023');
  expect(response.length).toBeGreaterThan(0);
});

describe('Almacenar Ano - Mes Test', () => {
  const putObjComMock = s3Mock
    .on(PutObjectCommand)
    .resolves({});
  const anos: Ano[] = [
    {
      id: '2023',
      description: '2023',
      meses: [{id: '01', description: 'Enero'}, {id: '02', description: 'Febrero'}]
    }, {
      id: '2024',
      description: '2024',
      meses: [{id: '01', description: 'Enero'}, {id: '02', description: 'Febrero'}]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Almacenar flatten Ano - Mes', async () => {
    await saveJsonLines(anos);
    const input = putObjComMock.call(0).args[0].input as PutObjectCommandInput;
    expect(input.Body)
      .toEqual(
        '{"anoId":"2023","anoDesc":"2023","mesId":"01","mesDesc":"Enero"}\n' +
        '{"anoId":"2023","anoDesc":"2023","mesId":"02","mesDesc":"Febrero"}\n' +
        '{"anoId":"2024","anoDesc":"2024","mesId":"01","mesDesc":"Enero"}\n' +
        '{"anoId":"2024","anoDesc":"2024","mesId":"02","mesDesc":"Febrero"}'
      );
  });
});

