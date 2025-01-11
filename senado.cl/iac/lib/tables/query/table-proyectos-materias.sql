CREATE TABLE "senado_cl"."table-proyectos-materias"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-proyectos-materias'
) AS
SELECT
    CAST(boletin AS INT) AS boletin_id,
    materia
FROM "AthenaDynamoDb"."default"."senado-raw-proyectos"
CROSS JOIN UNNEST(info.materias) AS t(materia)
WHERE materia IS NOT NULL
--ORDER BY boletin_id DESC
