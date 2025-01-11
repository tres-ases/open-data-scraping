CREATE TABLE "senado_cl"."table-partidos"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-partidos'
) AS
SELECT DISTINCT
    CAST(info.partido.id AS INT) AS partido_id,
    info.partido.nombre AS partido_nombre
FROM "AthenaDynamoDb"."default"."senado-raw-parlamentarios"
ORDER BY partido_id;
