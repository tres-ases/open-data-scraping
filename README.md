# open-data-scraping
Encargado de obtener la información desde múltiples orígenes de información

## Data
Toda la información descargada desde distintos orígenes y organizada para que pueda ser consultada usando Athena desde S3 o bien directamente.

### senado.cl
Corresponde a la información obtenida desde el sitio ```https://www.senado.cl/``` la cual es almacenada en el bucket ```open-data-senado-cl```

#### Dieta
La dieta es la remuneración mensual que percibe el Senador durante el periodo para el cual ha sido elegido y, de acuerdo al artículo 62 de la Constitución Política de la República, equivale a la de un Ministro de Estado.

Se extrae desde la página ```https://tramitacion.senado.cl/appsenado/index.php?mo=transparencia&ac=informeTransparencia&tipo=7```

La extracción se realiza en 2 etapas:
1. Descarga de la combinación de años y meses disponibles con la información de las dietas parlamentarias
2. Descarga del detalle de los montos de las dietas para cada uno de los parlamentarios

La información de la Dieta se almacenará en las siguientes carpetas:
* ```Dieta```
  * ```/AnoMes```
    * ```/JsonStructured/data.json```
    * ```/JsonLines/data.jsonl```
  * ```/detalle```
    * ```/JsonStructured/ano=#/mes=#/data.json```
    * ```/JsonLines/ano=#/mes=#/data.jsonl```

##### Año - Mes
Se recorre el listado de años disponibles y obtiene todos los meses que se encuentran disponibles para dicho año.

##### Detalle
Se recorre el listado de 
