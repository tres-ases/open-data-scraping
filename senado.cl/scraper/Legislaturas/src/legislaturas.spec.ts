import {LegExtract} from "./legislaturas-extract";

describe('Descargar listado legislaturas', () => {

  test('Listado completo', async () => {
    const instance = new LegExtract();
    const result = await instance.getList();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(54);
    const tipos = result.reduce((acc, curr) => acc.add(curr.tipo), new Set());
    expect(tipos.size).toEqual(3);

    const array = [
      {
        "id": 8933,
        "sesId": 9300,
        "sesNumero": 85,
        "fecha": "30-11-2022 17:55:56",
        "hora": "30/11/2022 17:49",
        "tema": "Rechazo -por no alcanzarse el quorum exigido por la Carta Fundamental- a la propuesta de su S.E. el Presidente de la República, para designar al señor José Andrés Morales Opazo como Fiscal Nacional del Ministerio Público. (Boletín N° S 2.330-05).",
        "quorum": "Dos tercios Q.C.",
        "boletin": "2330-05",
        "resultado": {
          "si": 31,
          "no": 6,
          "abs": 8,
          "pareo": 0
        },
        "detalle": {
          "si": [
            {
              "uuid": "049F997F-DB98-6F29-E063-5968A8C00BC5",
              "parlId": 986,
              "parSlug": "francisco-chahuan-chahuan-sen",
              "parNombre": "Francisco",
              "parApellidoPaterno": "Chahuán",
              "parApellidoMaterno": "Chahuán"
            },
            {
              "uuid": "049F997F-DB87-6F29-E063-5968A8C00BC5",
              "parlId": 1008,
              "parSlug": "jaime-quintana-leal-sen",
              "parNombre": "Jaime",
              "parApellidoPaterno": "Quintana",
              "parApellidoMaterno": "Leal"
            }
          ],
          "no": [
            {
              "uuid": "049F997F-DC99-6F29-E063-5968A8C00BC5",
              "parlId": 1330,
              "parSlug": "ivan-flores-garcia-sen",
              "parNombre": "Iván",
              "parApellidoPaterno": "Flores",
              "parApellidoMaterno": "García"
            },
            {
              "uuid": "049F997F-DC93-6F29-E063-5968A8C00BC5",
              "parlId": 1324,
              "parSlug": "karim-bianchi-retamales-sen",
              "parNombre": "Karim",
              "parApellidoPaterno": "Bianchi",
              "parApellidoMaterno": "Retamales"
            }
          ],
          "abstencion": [
            {
              "uuid": "049F997F-DB7C-6F29-E063-5968A8C00BC5",
              "parlId": 690,
              "parSlug": "jose-garcia-ruminot-sen",
              "parNombre": "José",
              "parApellidoPaterno": "García",
              "parApellidoMaterno": "Ruminot"
            },
            {
              "uuid": "049F997F-DA9A-6F29-E063-5968A8C00BC5",
              "parlId": 911,
              "parSlug": "carlos-ignacio-kuschel-silva-sen",
              "parNombre": "Carlos Ignacio",
              "parApellidoPaterno": "Kuschel",
              "parApellidoMaterno": "Silva"
            }
          ],
          "pareo": [
            {
              "uuid": "049F997F-DC84-6F29-E063-5968A8C00BC5",
              "parlId": 1214,
              "parSlug": "rafael-prohens-espinosa-sen",
              "parNombre": "Rafael  ",
              "parApellidoPaterno": "Prohens",
              "parApellidoMaterno": "Espinosa"
            }
          ]
        }
      }
    ];
    console.log(JSON.stringify(array));
  }, 20_000);
});
