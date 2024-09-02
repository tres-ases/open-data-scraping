import {getVotaciones} from "./votaciones.service";

describe('Descargar listado votaciones', () => {

  test('Para legislatura id 504', async () => {
    const result = await getVotaciones(504);
    expect(result.data).toBeDefined();
    expect(result.data.data.length).toBeGreaterThanOrEqual(163);
    expect(result.status).toEqual('ok');
    expect(result.results).toEqual(1);
    const quorums = result.data.data.reduce((acc, curr) => acc.add(curr.QUORUM), new Set());
    console.log(quorums);
    expect(quorums.size).toEqual(3);
  }, 20_000);
});
