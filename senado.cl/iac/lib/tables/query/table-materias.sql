CREATE TABLE "senado_cl"."table-materias"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-materias'
--  partitioned_by = ARRAY['boletin_id']
) AS
SELECT
    DISTINCT( materia ) AS materia
FROM "AthenaDynamoDb"."default"."senado-raw-proyectos"
CROSS JOIN UNNEST(info.materias) AS t(materia)
WHERE materia IS NOT NULL
--ORDER BY materia ASC
