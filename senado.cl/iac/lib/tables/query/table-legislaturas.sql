CREATE TABLE "senado_cl"."table-legislaturas"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-legislaturas'
--  partitioned_by = ARRAY['boletin_id']
) AS
SELECT
    CAST(legId AS INT) AS leg_id,
    CAST(info.numero AS INT) AS numero,
    CAST(date_parse(info.inicio, '%d/%m/%Y') AS DATE) AS fecha_inicio,
    CAST(date_parse(info.termino, '%d/%m/%Y') AS DATE) AS fecha_termino,
    CAST(from_iso8601_timestamp(fechaModificacion) AS timestamp) AS fecha_modificacion
FROM "AthenaDynamoDb"."default"."senado-raw-legislaturas"
ORDER BY leg_id;
