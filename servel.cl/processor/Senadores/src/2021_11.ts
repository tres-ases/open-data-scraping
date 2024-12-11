import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import {Votacion} from "@servel-cl/libs/model";

const workbook = new ExcelJS.Workbook();

export const processor = async (inFilePath: string = './2021_11_Senadores_Datos_Eleccion.xlsx', outFilePath: string = './data.json'): Promise<Votacion> => {
  const votacion: Votacion = {};

  await workbook.xlsx.readFile(inFilePath);
  workbook.worksheets[0].eachRow((row, index) => {
    if(index > 7) {
      const circunscripcion = row.getCell(3).toString().split(' ')[2];
      if(votacion[circunscripcion] === undefined) {
        votacion[circunscripcion] = {
          region: {
            numero: +row.getCell(1).toString(),
            nombre: row.getCell(2).toString(),
          },
          candidatos: {},
          comunas: {},
          totales: {
            inscritos: 0,
            votos: {
              blancos: 0,
              nulos: 0,
              total: 0
            },
          }
        };
      }
      const comuna = row.getCell(5).toString().trim();
      if(votacion[circunscripcion].comunas[comuna] === undefined) {
        votacion[circunscripcion].comunas[comuna] = {
          votos: {
            nulos: 0,
            blancos: 0,
            total: 0
          },
          inscritos: 0,
        };
      }
      const candidatoId = row.getCell(9).toString().trim();
      const nombre = row.getCell(10).toString().trim();
      const cantidad = +row.getCell(13).toString();
      if(nombre === 'VOTOS EN BLANCO') {
        votacion[circunscripcion].comunas[comuna].votos.blancos += cantidad;
        votacion[circunscripcion].totales.votos.blancos += cantidad;
      } else if(nombre === 'VOTOS NULOS') {
        votacion[circunscripcion].comunas[comuna].votos.nulos += cantidad;
        votacion[circunscripcion].totales.votos.nulos += cantidad;
      } else {
        if(votacion[circunscripcion].candidatos[candidatoId] === undefined) {
          votacion[circunscripcion].candidatos[candidatoId] = {
            nombre,
            apellidoPaterno: row.getCell(11).toString().trim(),
            apellidoMaterno: row.getCell(12).toString().trim(),
            lista: row.getCell(6).toString().trim(),
            pacto: row.getCell(7).toString().trim(),
            partido: row.getCell(8).toString().trim(),
          };
        }
        if(votacion[circunscripcion].totales.votos[candidatoId] === undefined) {
          votacion[circunscripcion].totales.votos[candidatoId] = 0;
        }
        votacion[circunscripcion].totales.votos[candidatoId] += cantidad;
        if(votacion[circunscripcion].comunas[comuna].votos[candidatoId] === undefined) {
          votacion[circunscripcion].comunas[comuna].votos[candidatoId] = 0;
        }
        votacion[circunscripcion].comunas[comuna].votos[candidatoId] += cantidad;
      }
    }
  });

  console.log(votacion);

  workbook.worksheets[1].eachRow((row, index) => {
    if(index > 7) {
      const circunscripcion = row.getCell(3).toString().split(' ')[2];
      const comuna = row.getCell(5).toString().trim();
      const inscritos = +row.getCell(9).toString().trim();
      const totalVotos = +row.getCell(10).toString().trim();
      votacion[circunscripcion].totales.inscritos += inscritos;
      votacion[circunscripcion].totales.votos.total += totalVotos;
      votacion[circunscripcion].comunas[comuna].inscritos += inscritos;
      votacion[circunscripcion].comunas[comuna].votos.total += totalVotos;
    }
  });

  fs.writeFileSync(outFilePath, JSON.stringify(votacion), 'utf-8');
  return votacion;
}
