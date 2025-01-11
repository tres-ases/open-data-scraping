CREATE TABLE "senado_cl"."table-proyectos-informes"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-proyectos-informes'
) AS
SELECT
    CAST(boletin AS INT) AS boletin_id,
    informe.etapa AS etapa,
    CAST(date_parse(informe.fecha, '%d/%m/%Y') AS DATE) AS fecha,
    informe.link AS link,
    informe.tramite AS tramite
FROM "AthenaDynamoDb"."default"."senado-raw-proyectos"
CROSS JOIN UNNEST(info.informes) AS t(informe)
WHERE informe.etapa IS NOT NULL
--ORDER BY boletin_id DESC
