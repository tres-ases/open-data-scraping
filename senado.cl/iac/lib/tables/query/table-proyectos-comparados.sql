CREATE TABLE "senado_cl"."table-proyectos-comparados"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-proyectos-comparados'
) AS
SELECT
    CAST(boletin AS INT) AS boletin_id,
    comparado.comparado AS comparado,
    comparado.link AS link
FROM "AthenaDynamoDb"."default"."senado-raw-proyectos"
CROSS JOIN UNNEST(info.comparados) AS t(comparado)
WHERE comparado.comparado IS NOT NULL
--ORDER BY boletin_id DESC
