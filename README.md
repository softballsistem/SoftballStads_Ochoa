SoftballStads_Ochoa


todo se puso mal, NO PUEDE SER sad adad sad
SOY LA CABRA que pasooooo dudalo

APUEEEEEEEES DUDALOOOOOOOOOOOO 

HZ ON TOP NOJODASS

Sistema de Solicitudes de cambio de roles

Nueva Tabla
role_change_requests
id (uuid, primary key)
requester_id (uuid, referencia a user_profiles)
target_user_id (uuid, referencia a user_profiles)
current_role (text)
requested_role (text)
reason (text)
status (text: pending, approved, rejected)
reviewed_by (uuid, referencia a user_profiles)
reviewed_at (timestamp)
created_at (timestamp)
Seguridad
Enable RLS en role_change_requests
Políticas para desarrolladores y administradores

config completa de base de datos 
Tablas Principales
teams - Equipos de softball
players - Jugadores
games - Juegos/Partidos
player_stats - Estadísticas de jugadores por juego
user_profiles - Perfiles de usuarios
role_change_requests - Solicitudes de cambio de rol
Seguridad
RLS habilitado en todas las tablas
Políticas específicas por rol
Función de actualización de timestamps
Índices
Optimización de consultas
Búsquedas eficientes
Datos de Prueba
Equipos de ejemplo
Jugadores de muestra
Juegos programados


agg soporte para logos de equipos 
Modificaciones a la tabla teams
Agregar columna logo_url para almacenar la URL del logo
Configuración de Storage
Crear bucket para logos de equipos
Configurar políticas de acceso
Índices y optimizaciones
Índice en logo_url para búsquedas rápidas
