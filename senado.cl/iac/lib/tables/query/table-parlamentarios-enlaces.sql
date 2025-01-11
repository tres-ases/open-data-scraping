CREATE TABLE "senado_cl"."table-parlamentarios-enlaces"
WITH
(
  format='JSON',
  external_location='s3://open-data-cl-bucket/tables/table-parlamentarios-enlaces'
) AS
SELECT
    slug,
    CAST(info.id AS INT) AS id,
    --info.enlaces.facebookPagina AS enlaces_facebook_pagina
    info.enlaces.facebookCuenta AS facebook_cuenta,
    info.enlaces.twitter AS twitter,
    info.enlaces.webPersonal AS web_personal,
    info.enlaces.instagram AS instagram
    --info.enlaces.linkedin AS enlaces_linkedin
    -- info.enlaces.flickr AS enlaces_flickr
FROM "AthenaDynamoDb"."default"."senado-raw-parlamentarios"
--ORDER BY slug;
