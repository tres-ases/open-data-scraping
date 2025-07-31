# Documento de Requerimientos

## Introducción

La plataforma Open Data Motivation es un sistema de transparencia legislativa chilena diseñado principalmente para la ciudadanía general, que extrae y analiza información del Congreso Nacional y SERVEL para identificar y destacar comportamientos problemáticos de los legisladores. El objetivo principal es empoderar a los ciudadanos con información clara y accesible sobre el rendimiento de sus representantes, destacando especialmente incumplimientos, comportamientos reprochables y desviaciones del comportamiento estándar como inasistencias injustificadas, ausencias en votaciones, gastos excesivos de fondos públicos, entre otros. La plataforma ofrece acceso gratuito básico y un servicio premium de informes mensuales automatizados, integrando datos del Senado (senado.cl), Cámara de Diputados (camara.cl) y SERVEL (servel.cl).

## Requerimientos

### Requerimiento 1

**Historia de Usuario:** Como ciudadano interesado en la política chilena, quiero acceder a información integrada del Senado, Cámara de Diputados y SERVEL desde una sola plataforma, para no tener que navegar por múltiples sitios web gubernamentales con diferentes formatos.

#### Criterios de Aceptación

1. CUANDO el usuario acceda a la plataforma ENTONCES el sistema DEBERÁ mostrar datos actualizados del Senado, Cámara de Diputados y SERVEL en una interfaz unificada
2. CUANDO el sistema extraiga datos de senado.cl ENTONCES DEBERÁ obtener información de senadores, legislaturas, sesiones, votaciones, asistencia y gastos
3. CUANDO el sistema extraiga datos de camara.cl ENTONCES DEBERÁ obtener información equivalente de diputados, sesiones, votaciones, asistencia y gastos
4. CUANDO el sistema extraiga datos de servel.cl ENTONCES DEBERÁ obtener información de resultados electorales para vincular con cada legislador
5. SI alguna fuente está temporalmente no disponible ENTONCES el sistema DEBERÁ mostrar la última información disponible con timestamp de actualización

### Requerimiento 2

**Historia de Usuario:** Como periodista investigando temas específicos, quiero poder buscar y filtrar información por legislador, proyecto de ley, comisión, fecha y tipo de votación, para encontrar rápidamente la información relevante para mis reportajes.

#### Criterios de Aceptación

1. CUANDO el usuario busque por nombre de legislador ENTONCES el sistema DEBERÁ mostrar su perfil completo, historial de votaciones, asistencia y gastos
2. CUANDO el usuario busque por número o tema de proyecto de ley ENTONCES el sistema DEBERÁ mostrar el estado actual, historial de tramitación y votaciones asociadas
3. CUANDO el usuario filtre por período legislativo ENTONCES el sistema DEBERÁ mostrar solo la información correspondiente a las fechas seleccionadas
4. CUANDO el usuario filtre por tipo de votación ENTONCES el sistema DEBERÁ mostrar votaciones en general, particular, o por artículos según corresponda
5. SI el usuario busca por comisión ENTONCES el sistema DEBERÁ mostrar todos los proyectos tramitados y miembros de esa comisión

### Requerimiento 3

**Historia de Usuario:** Como investigador académico, quiero visualizar patrones de votación, asistencia y comportamiento legislativo mediante gráficos y mapas interactivos, para identificar tendencias y realizar análisis comparativos.

#### Criterios de Aceptación

1. CUANDO el usuario seleccione datos de votaciones ENTONCES el sistema DEBERÁ ofrecer visualizaciones de tendencias por partido, región y tiempo
2. CUANDO el usuario visualice datos de asistencia ENTONCES el sistema DEBERÁ mostrar gráficos comparativos entre legisladores y períodos
3. CUANDO el usuario analice gastos parlamentarios ENTONCES el sistema DEBERÁ generar gráficos de distribución y evolución temporal
4. SI el usuario selecciona datos electorales ENTONCES el sistema DEBERÁ mostrar mapas interactivos con resultados por región y comuna
5. CUANDO el usuario genere una visualización ENTONCES el sistema DEBERÁ permitir exportarla en formatos PNG, SVG y PDF

### Requerimiento 4

**Historia de Usuario:** Como ciudadano, quiero que el sistema identifique y destaque automáticamente comportamientos problemáticos de los legisladores, para poder evaluar objetivamente el desempeño de mis representantes.

#### Criterios de Aceptación

1. CUANDO el sistema analice la asistencia de un legislador ENTONCES DEBERÁ destacar casos de inasistencias injustificadas que superen el promedio nacional
2. CUANDO el sistema detecte que un legislador asiste a sesiones pero no participa en votaciones ENTONCES DEBERÁ generar una alerta de "asistencia pasiva"
3. SI los gastos de un legislador superan significativamente el promedio de su cámara ENTONCES el sistema DEBERÁ destacar este comportamiento con detalles específicos
4. CUANDO el sistema identifique inconsistencias entre promesas de campaña y votaciones ENTONCES DEBERÁ generar un reporte de "coherencia política"
5. CUANDO se detecten patrones de comportamiento atípicos ENTONCES el sistema DEBERÁ crear rankings comparativos entre legisladores

### Requerimiento 5

**Historia de Usuario:** Como ciudadano, quiero poder seguir fácilmente a mis representantes locales y recibir alertas cuando tengan comportamientos problemáticos, para estar informado sin necesidad de revisar constantemente la plataforma.

#### Criterios de Aceptación

1. CUANDO el usuario ingrese su región/comuna ENTONCES el sistema DEBERÁ mostrar automáticamente sus representantes en Senado y Cámara
2. CUANDO un representante seguido tenga una inasistencia injustificada ENTONCES el sistema DEBERÁ enviar una notificación al ciudadano
3. SI un representante seguido incurre en gastos excesivos ENTONCES el sistema DEBERÁ alertar con detalles específicos del gasto
4. CUANDO un representante vote de manera contraria a sus promesas de campaña ENTONCES el sistema DEBERÁ generar una alerta de inconsistencia
5. CUANDO el usuario acceda a su panel personal ENTONCES el sistema DEBERÁ mostrar un resumen simple y claro del comportamiento reciente de sus representantes

### Requerimiento 6

**Historia de Usuario:** Como desarrollador de aplicaciones cívicas, quiero acceder a los datos legislativos mediante una API REST, para crear herramientas complementarias y análisis especializados.

#### Criterios de Aceptación

1. CUANDO un desarrollador haga una petición a la API ENTONCES el sistema DEBERÁ devolver datos de legisladores, votaciones y proyectos en formato JSON estructurado
2. CUANDO se soliciten datos históricos de votaciones ENTONCES la API DEBERÁ permitir filtros por fecha, legislador, proyecto y tipo de votación
3. SI se solicitan datos de resultados electorales ENTONCES la API DEBERÁ incluir información vinculada de SERVEL con el legislador correspondiente
4. CUANDO se excedan los límites de uso ENTONCES el sistema DEBERÁ devolver códigos HTTP apropiados y información sobre cuotas disponibles
5. CUANDO se actualicen datos desde las fuentes ENTONCES la API DEBERÁ reflejar los cambios con latencia máxima de 1 hora

### Requerimiento 7

**Historia de Usuario:** Como ciudadano interesado en recibir análisis regulares, quiero poder suscribirme a un servicio premium que me envíe informes mensuales automatizados con los cambios y comportamientos destacados de los legisladores.

#### Criterios de Aceptación

1. CUANDO un usuario se suscriba al servicio premium ENTONCES el sistema DEBERÁ generar automáticamente un informe mensual personalizado
2. CUANDO se genere un informe mensual ENTONCES DEBERÁ incluir los comportamientos más problemáticos detectados, cambios significativos y comparaciones con períodos anteriores
3. SI ocurren eventos excepcionales durante el mes ENTONCES el sistema DEBERÁ destacarlos prominentemente en el informe
4. CUANDO se envíe un informe premium ENTONCES DEBERÁ incluir análisis más profundos y métricas avanzadas no disponibles en la versión gratuita
5. CUANDO un usuario cancele su suscripción ENTONCES el sistema DEBERÁ mantener acceso a informes históricos por 6 meses

### Requerimiento 8

**Historia de Usuario:** Como propietario del producto, quiero que la plataforma tenga una arquitectura serverless eficiente y escalable, para mantener tiempos de respuesta mínimos y costos controlados independientemente del tráfico.

#### Criterios de Aceptación

1. CUANDO se implemente la infraestructura ENTONCES DEBERÁ usar exclusivamente servicios serverless de AWS con TypeScript y AWS CDK
2. CUANDO se procesen datos ENTONCES el sistema DEBERÁ usar AWS Lambda para todas las operaciones de extracción, transformación y análisis
3. CUANDO se almacenen datos ENTONCES DEBERÁ usar S3 con estructura organizada por fuente (senado/, camara/, servel/) compatible con Amazon Athena
4. CUANDO se requiera base de datos ENTONCES el sistema DEBERÁ usar DynamoDB para consultas rápidas y datos estructurados
5. CUANDO aumente el tráfico ENTONCES la arquitectura DEBERÁ escalar automáticamente sin intervención manual y manteniendo costos proporcionales al uso

### Requerimiento 9

**Historia de Usuario:** Como administrador del sistema, quiero monitorear la extracción de datos desde senado.cl, camara.cl y servel.cl, para asegurar la integridad y actualización constante de la información legislativa.

#### Criterios de Aceptación

1. CUANDO falle la extracción desde cualquier fuente ENTONCES el sistema DEBERÁ registrar el error, intentar reconexión automática y notificar al administrador
2. CUANDO se detecten inconsistencias entre datos del Senado y Cámara ENTONCES el sistema DEBERÁ marcar los registros para revisión manual
3. SI cambia la estructura de algún sitio web fuente ENTONCES el sistema DEBERÁ alertar sobre la necesidad de actualizar los extractores específicos
4. CUANDO se ejecuten procesos de extracción ENTONCES el sistema DEBERÁ registrar métricas de éxito, tiempo de procesamiento y cantidad de registros actualizados
5. CUANDO se vinculen datos electorales con legisladores ENTONCES el sistema DEBERÁ validar la coherencia de la información entre SERVEL y las cámaras