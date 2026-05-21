# Arquitectura de Base de Datos y Políticas de Seguridad RLS

Este documento describe la especificación técnica de la base de datos recomendada para **Nexus Core B2B**. Está diseñado para implementarse sobre **PostgreSQL** o un servicio administrado BaaS como **Supabase/Firebase**, utilizando estrictamente **Seguridad de Nivel de Fila (Row Level Security - RLS)** para salvaguardar la confidencialidad inter-compañía (SLA Multi-Tenant).

---

## 1. Esquema de Base de Datos Físico (DDL)

A continuación se detallan las tablas necesarias, tipos de datos enumerados y restricciones referenciales para garantizar consistencia lógica integral.

```sql
-- Habilitar extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. TIPOS ENUMERADOS (DOMINIOS CONTROLADOS)
-- =========================================================================
CREATE TYPE user_role AS ENUM ('admin', 'soporte', 'usuario');
CREATE TYPE ticket_priority AS ENUM ('Alta', 'Media', 'Baja');
CREATE TYPE ticket_status AS ENUM ('Abierto', 'Resuelto');

-- =========================================================================
-- 2. TABLA: COMPAÑÍAS (VIP TENANTS)
-- =========================================================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255) NOT NULL, -- Ej: 'acmeproducts.com' para auto-asignación
    sla_hours INTEGER DEFAULT 24 NOT NULL, -- Tiempo límite acordado en el contrato comercial
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 3. TABLA: PERFILES DE USUARIO (Mapeados a Auth del Sistema ID)
-- =========================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- Mapea 1-a-1 con el ID interno del proveedor de autenticación (ej: auth.users)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'usuario'::user_role NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Offline'::text NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexaciones clave de performance
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =========================================================================
-- 4. TABLA: TICKETS DE SOPORTE CORRE-SLA
-- =========================================================================
CREATE TABLE tickets (
    id VARCHAR(50) PRIMARY KEY, -- ID Prefijado e incremental formateado por Backend (ej: TK-104)
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ticket_priority DEFAULT 'Media'::ticket_priority NOT NULL,
    status ticket_status DEFAULT 'Abierto'::ticket_status NOT NULL,
    client_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_to_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_company ON tickets(client_company_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_id);

-- =========================================================================
-- 5. TABLA: HISTORIAL DE RESPUESTAS & CONVERSACIONES
-- =========================================================================
CREATE TABLE ticket_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_responses_ticket ON ticket_responses(ticket_id);

-- =========================================================================
-- 6. TABLA: PARÁMETROS GLOBALES DEL SISTEMA (Ej: Round Robin)
-- =========================================================================
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inicializar configuración de Auto-Asignación
INSERT INTO system_settings (key, value) VALUES 
('round_robin', '{"active": false, "last_tech_index": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;
```

---

## 2. Row Level Security (RLS) - Políticas de Aislamiento Corporativo

Para un soporte multi-company donde diferentes organizaciones colocan logs de incidencias, no se puede depender únicamente de los filtros en React. Activamos **Postgres Row Level Security (RLS)** en el servidor de base de datos para restringir acceso según la identidad del solicitante.

### Activación de RLS en las Tablas Core:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

### Definición de Políticas de Seguridad por Tabla:

#### A. Tabla `profiles` (Perfiles de Cuenta)
*   **Lectura:** Los administradores y soporte ven todos. Los usuarios regulares solo pueden ver los perfiles de los miembros de su propia compañía y del personal de soporte interno.
*   **Escritura:** Solo el propietario o un Administrador del sistema.

```sql
-- Los usuarios ven miembros de su compañía, la mesa de ayuda o técnicos
CREATE POLICY select_profiles_policy ON profiles
    FOR SELECT
    USING (
        (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) IN ('admin', 'soporte')
        OR company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
    );

-- Modificar perfil (propietario o administrador)
CREATE POLICY update_profiles_policy ON profiles
    FOR UPDATE
    USING (
        id = auth.uid() 
        OR (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) = 'admin'
    );
```

#### B. Tabla `tickets` (La frontera crítica de privacidad)
*   **Lectura:** 
    *   Usuarios con rol `usuario`: Solo ven los tickets donde `client_company_id` coincide con su propia compañía.
    *   Usuarios con rol `soporte` o `admin`: Tienen acceso de lectura completo de la base de datos corporativa.
*   **Creación:** Cualquier usuario (`usuario`) puede crear tickets para su propia empresa.
*   **Modificación:**
    *   Usuarios con rol `usuario`: Solo pueden actualizar la descripción o solicitar el cierre mientras esté abierto. No pueden cambiar el técnico asignado.
    *   Técnicos (`soporte`): Pueden actualizar estados y asignaciones (conducir SLA).
    *   Administradores (`admin`): Permisos totales.

```sql
-- 1. POLÍTICA DE SELECCIÓN (READ)
CREATE POLICY select_tickets_policy ON tickets
    FOR SELECT
    USING (
        (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) IN ('admin', 'soporte')
        OR client_company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
    );

-- 2. POLÍTICA DE INSERCIÓN (CREATE)
CREATE POLICY insert_tickets_policy ON tickets
    FOR INSERT
    WITH CHECK (
        (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) IN ('admin', 'soporte')
        OR (
            -- El usuario cliente solo puede crear para su propia compañía
            client_company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
            AND created_by_id = auth.uid()
        )
    );

-- 3. POLÍTICA DE EDICIÓN Y AVANCE DE SLA
CREATE POLICY update_tickets_policy ON tickets
    FOR UPDATE
    USING (
        -- Si es admin o de soporte
        (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) IN ('admin', 'soporte')
        -- Si es el creador del ticket y pertenece a la compañía dueña
        OR (
            created_by_id = auth.uid() 
            AND client_company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
        )
    )
    WITH CHECK (
        -- Evita que el usuario cambie el ticket a otra empresa de forma maliciosa
        (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) IN ('admin', 'soporte')
        OR client_company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
    );
```

#### C. Tabla `ticket_responses` (Historial de Conversación)
Garantiza que nadie pueda inyectar mensajes ni chatear en incidencias de otras compañías del ecosistema B2B.

```sql
-- Leer respuestas de tickets legales únicamente
CREATE POLICY select_responses_policy ON ticket_responses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tickets t 
            WHERE t.id = ticket_responses.ticket_id
        )
    );

-- Forzar que solo los participantes de la conversación o técnicos agreguen un comentario
CREATE POLICY insert_responses_policy ON ticket_responses
    FOR INSERT
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_responses.ticket_id
            AND (
                (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) IN ('admin', 'soporte')
                OR t.client_company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
            )
        )
    );
```

---

## 3. Disparadores Automáticos (Triggers & Server Procedures)

Para robustecer la base relacional, implementamos automatizaciones para el cálculo de tiempos o formateo de campos que el frontend de React consume.

### Trigger 1: Cálculo Automático de Resolución de SLA
Rellena la fecha `resolved_at` de forma inteligente de manera que el SLA determine con exactitud cuánto demoró el equipo de ingenieros en resolver la petición.

```sql
CREATE OR REPLACE FUNCTION handle_ticket_resolution_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Resuelto' AND OLD.status != 'Resuelto' THEN
        NEW.resolved_at = now();
    ELSIF NEW.status = 'Abierto' THEN
        NEW.resolved_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_resolution
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION handle_ticket_resolution_time();
```

### Trigger 2: Incremento y Formateo Automático de IDs (Ej: TK-01, TK-02...)
Genera claves legibles para humanos y ordenados secuencialmente, liberando al cliente de generar colisiones de IDs concurrentes.

```sql
CREATE SEQUENCE IF NOT EXISTS ticket_id_seq;

CREATE OR REPLACE FUNCTION generate_next_ticket_id()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SELECT nextval('ticket_id_seq') INTO next_num;
        NEW.id := 'TK-' || lpad(next_num::text, 2, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_ticket_id
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION generate_next_ticket_id();
```
