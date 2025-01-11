CREATE TABLE "senado_cl"."table-sesiones"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-sesiones',
  partitioned_by = ARRAY['leg_id']
) AS
SELECT
    CAST(sesId AS INT) AS ses_id,
    CAST(info.cuenta AS INT) AS cuenta,
    CAST(info.numero AS INT) AS numero,
    CAST(date_parse(info.fecha, '%d/%m/%Y') AS DATE) AS fecha,
    info.horaInicio AS hora_inicio,
    info.horaTermino AS hora_termino,
    info.tipo,
    CAST(from_iso8601_timestamp(fechaModificacion) AS timestamp) AS fecha_modificacion,
    CAST(legId AS INT) AS leg_id
FROM "AthenaDynamoDb"."default"."senado-raw-sesiones"
--ORDER BY leg_id DESC, ses_id DESC
