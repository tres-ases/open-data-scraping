CREATE TABLE "senado_cl"."table-proyectos-autores"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-proyectos-autores'
) AS
SELECT
    CAST(boletin AS INT) AS boletin_id,
    autor.parlamentario AS parlamentario_nombre
FROM "AthenaDynamoDb"."default"."senado-raw-proyectos"
CROSS JOIN UNNEST(info.autores) AS t(autor)
WHERE autor.parlamentario IS NOT NULL
--ORDER BY boletin_id DESC, parlamentario_nombre ASC
