CREATE TABLE "senado_cl"."table-parlamentarios-regiones"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-parlamentarios-regiones'
) AS
SELECT DISTINCT
    CAST(info.region.id AS INT) AS region_id,
    info.region.nombre AS region_nombre
FROM "AthenaDynamoDb"."default"."senado-raw-parlamentarios"
--ORDER BY region_id;
