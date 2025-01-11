CREATE TABLE "senado_cl"."table-parlamentarios"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-parlamentarios'
) AS
SELECT
    --par_slug,
    slug,
    CAST(info.id AS INT) AS id,
    info.nombreCompleto,
    info.nombre,
    info.apellidoPaterno,
    info.apellidoMaterno,
    info.email,
    info.fono,
    CAST(info.sexo.valor AS INT) AS sexo_valor,
    info.sexo.etiquetaAbreviatura AS sexo_etiqueta_abreviatura,
    info.sexo.etiqueta AS sexo_etiqueta,
    -- info.enlaces.facebookPagina AS enlaces_facebook_pagina,
    -- info.enlaces.facebookCuenta AS enlaces_facebook_cuenta,
    -- info.enlaces.twitter AS enlaces_twitter,
    -- info.enlaces.webPersonal AS enlaces_web_personal,
    -- info.enlaces.instagram AS enlaces_instagram,
    -- info.enlaces.linkedin AS enlaces_linkedin,
    -- info.enlaces.flickr AS enlaces_flickr,
    info.camara,
    CAST(info.circunscripcionId AS INT) AS circunscripcion_id,
    CAST(info.region.id AS INT) AS region_id,
    info.region.nombre AS region_nombre,
    CAST(info.comite.id AS INT) AS comite_id,
    info.comite.abreviatura AS comite_abreviatura,
    info.comite.nombre AS comite_nombre,
    CAST(info.partido.id AS INT) AS partido_id,
    info.partido.nombre AS partido_nombre,
    info.imagenes."DEFAULT" AS imagen_DEFAULT,
    info.imagenes."120" AS imagen_120,
    info.imagenes."450" AS imagen_450,
    info.imagenes."600" AS imagen_600,
    CAST(from_iso8601_timestamp(fechaModificacion) AS timestamp) AS fecha_modificacion
FROM "AthenaDynamoDb"."default"."senado-raw-parlamentarios"
--ORDER BY slug;
