CREATE TABLE "senado_cl"."table-proyectos"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/senado.cl/tables/table-proyectos'
) AS

SELECT
    CAST(boletin AS INT) AS boletin_id,
    info.descripcion.boletin AS boletin,
    info.descripcion.camaraOrigen AS camara_origen,
    info.descripcion.diarioOficial AS diario_oficial,
    info.descripcion.estado,
    info.descripcion.etapa,
    info.descripcion.subEtapa AS subetapa,
    info.descripcion.fechaIngreso AS fecha_ingreso,
    info.descripcion.iniciativa,
    info.descripcion.leyNumero AS ley_numero,
    info.descripcion.linkMensajeMocion AS link_mensaje_mocion,
    info.descripcion.urgenciaActual AS urgencia_actual,
    info.descripcion.titulo,
    fechaModificacion AS fecha_modificacion
FROM "AthenaDynamoDb"."default"."senado-raw-proyectos"
