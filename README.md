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
  * ```/AnoMes```: listado de años disponibles y meses que se encuentran disponibles
    * ```/JsonStructured/data.json```
    * ```/JsonLines/data.jsonl```
  * ```/detalle```: información de la dieta parlamentaria separada por año y mes, los cuales son extraídos previamente
    * ```/JsonStructured/ano=#/mes=#/data.json```
    * ```/JsonLines/ano=#/mes=#/data.jsonl``` 

#### Gastos Operacionales

La información de Gastos Operacionales se almacenará en las siguientes carpetas:
* ```GastosOperacionales```
  * ```/JsonStructured/parlId=#/ano=#/mes=#/data.json```
  * ```/JsonLines/parlId=#/ano=#/mes=#/data.jsonl```

#### Personal Apoyo

#### SenadoresView

La información de los senadores y de los períodos en los que ha participado en las cámaras se puede obtener desde ```https://tramitacion.senado.cl/appsenado/index.php?mo=senadores&ac=periodos```

El detalle de nombre, región, partido, teléfono y correo se puede obtener desde ```https://tramitacion.senado.cl/appsenado/index.php?mo=senadores&ac=fichasenador&id=985```

* ```SenadoresView```
  * ```/Periodos```: listado completo de todos los SenadoresView, incluyendo detalle de los períodos 
    * ```/JsonStructured/data.json```
    * ```/JsonLines/data.jsonl```
  * ```/Detalle```
    * ```/Foto/parlId=#```: fotos con distinto tamaño en formato jpeg de cada senador
    * ```/JsonStructured/parlId=#/data.json```: información más detallada del senador

#### Votaciones

Las Votaciones se realizan dentro de una Sesión (en día en particular), se suelen realizar varias votaciones dentro de una misma Sesión. 

Las Sesiones están asociados a una Legislatura, que abarca un período de tiempo más amplio, y por ende, varias Sesiones.

Las Legislaturas y Sesiones se extraen desde la página ```https://tramitacion.senado.cl/appsenado/index.php?mo=sesionessala&ac=votacionSala&legiini=462```

El resumen de las votaciones se extrae desde ```https://tramitacion.senado.cl/appsenado/index.php?mo=sesionessala&ac=votacionSala&legiini=462```

La información de Gastos Operacionales se almacenará en las siguientes carpetas:
* ```Votaciones```
  * ```/Legislaturas```
    * ```/Lista```: listado simple de las Legislaturas
      * ```/JsonStructured/data.json```
      * ```/JsonLines/data.jsonl```
    * ```/Detalle/JsonStructured/legisId=#/data.json```: información en detalle de la Legislatura, incluyendo información de Sesiones
    * ```/Sesiones```: información de las Sesiones asociadas a una Legislatura en particular 
      * ```/JsonStructured/legisId=#/data.json```
      * ```/JsonLines/legisId=#/data.jsonl```
  * ```/Resumen```
    * ```/JsonStructured/legisId=#/sesionId=#/data.json```
    * ```/JsonLines/legisId=#/sesionId=#/data.jsonl```
