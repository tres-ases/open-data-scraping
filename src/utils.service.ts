import * as fs from 'fs';
import * as path from "path";

export async function saveJson(data: any, filePath: string): Promise<void> {
  const jsonData = JSON.stringify(data, null, 2); // Espacio para mejor legibilidad
  try {
    const dirPath = path.dirname(filePath);

    await fs.promises.mkdir(dirPath, { recursive: true });
    await fs.promises.writeFile(filePath, jsonData);

    console.log(`Estructura JSON guardada en: ${filePath}`);
  } catch (error) {
    console.error(`Error al guardar el JSON: ${error}`);
  }
}

export async function readJson<T>(filePath: string): Promise<T> {
  try {
    const jsonData = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error(`Error al leer el JSON: ${error}`);
    throw error;
  }
}

export function existsFile(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error al verificar si existe el archivo: ${error}`);
    throw error;
  }
}
