CREATE TABLE "senado_cl"."table-proyectos-oficios"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-proyectos-oficios'
) AS
SELECT
    CAST(boletin AS INT) AS boletin_id,
    oficio.camara AS camara,
    oficio.etapa AS etapa,
    CAST(date_parse(oficio.fecha, '%d/%m/%Y') AS DATE) AS fecha,
    oficio.link AS link,
    oficio.tipo AS tipo,
    oficio.tramite AS tramite
FROM "AthenaDynamoDb"."default"."senado-raw-proyectos"
CROSS JOIN UNNEST(info.oficios) AS t(oficio)
WHERE oficio.camara IS NOT NULL
--ORDER BY boletin_id DESC
