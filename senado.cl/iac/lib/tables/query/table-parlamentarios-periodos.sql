CREATE TABLE "senado_cl"."table-parlamentarios-periodos"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-parlamentarios-periodos'
) AS
SELECT
    slug,
    CAST(periodo.id AS INT) AS id,
    periodo.camara,
    periodo.desde,
    periodo.hasta,
    CAST(periodo.vigente AS BOOLEAN) AS vigente
FROM "AthenaDynamoDb"."default"."senado-raw-parlamentarios"
CROSS JOIN UNNEST(info.periodos) AS t(periodo)
--ORDER BY slug, desde DESC;
