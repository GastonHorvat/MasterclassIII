# Manual de Arquitectura: Migración a Producción (Login, Roles y Base de Datos)

Este documento detalla el blueprint arquitectónico recomendado para realizar la transición del cascarón visual interactivo actual (**Nexus Core B2B** en React/Vite) hacia una implementación full-stack productiva o integrada de manera segura.

---

## 1. Estrategia de Autenticación y Administración de Sesiones

Para un entorno B2B, es crítico que la autenticación sea hermética y que la sesión contenga metadatos del cliente (ej. la compañía asociada) y el rol.

### Opción A (Recomendada): API Propio con Express + PostgreSQL (JWT)
1. **Flujo de Acceso:**
   - El cliente envía credenciales (`email` e `id_password`) en formato HTTPS POST a `/api/auth/login`.
   - El servidor de Node.js (Express) valida la contraseña (hasheada con Argon2 o bcrypt en DB).
   - Genera un **JSON Web Token (JWT)** con un payload seguro que contiene:
     ```json
     {
       "uid": "usr-819a-9182",
       "email": "gastonhorvat@gmail.com",
       "role": "usuario",
       "company": "Acme Corp"
     }
     ```
   - El JWT se firma con una llave secreta del servidor (`JWT_SECRET` en variables de entorno) y se envía de vuelta al cliente de React utilizando cookies seguras con atributo `HttpOnly`, `Secure` y `SameSite=Strict`. Esto previene ataques XSS/CSRF en el navegador.

2. **Propagación en React:**
   - Al montar la App en `useEffect`, se efectúa un "Silent Handshake" (ej: `GET /api/auth/me`) para verificar si la cookie de sesión es válida.
   - Si es auténtica, se llena el estado global en App (`session`) y se inicia la interfaz acorde al rol decodificado por el servidor.

---

## 2. Estructura Recomendada de Base de Datos (Esquema Relacional)

Se recomienda utilizar un base de datos PostgreSQL, la cual mapea perfectamente las relaciones jerárquicas B2B (Compañías → Usuarios → Tickets → Respuestas).

```
   ┌──────────────────┐
   │    COMPAÑIAS     │
   ├──────────────────┤
   │ id (PK, UUID)    │
   │ nombre (varchar) │
   │ plan_sla (varchar)│
   └────────┬─────────┘
            │ 1
            │
            │ N
   ┌────────▼─────────┐             ┌──────────────────┐
   │     USUARIOS     │             │     TECNICOS     │
   ├──────────────────┤             ├──────────────────┤
   │ id (PK, UUID)    │             │ id (PK, UUID)    │
   │ nombre (varchar) │             │ nombre (varchar) │
   │ email (Unique)   │             │ email (Unique)   │
   │ password_hash    │             │ disponible (bool)│
   │ rol (enum)       ├────────┐    └────────┬─────────┘
   │ compañia_id (FK) │        │ 1           │ 1
   └──────────────────┘        │             │
                               │             │ N (Asignado)
                               │ N (Creador) │
                        ┌──────▼─────────────▼─────┐
                        │         TICKET           │
                        ├──────────────────────────┤
                        │ id (PK, VARCHAR)         │
                        │ titulo (varchar)         │
                        │ descripcion (text)       │
                        │ prioridad (enum)         │
                        │ estado (enum Open/Res)   │
                        │ creado_por_id (FK)       │
                        │ asignado_tecnico_id (FK) │
                        │ creado_en (timestamp)    │
                        └──────────┬───────────────┘
                                   │ 1
                                   │
                                   │ N
                        ┌──────────▼───────────────┐
                        │   HISTORIAL_RESPUESTAS   │
                        ├──────────────────────────┤
                        │ id (PK, UUID)            │
                        │ ticket_id (FK)           │
                        │ autor_nombre (varchar)   │
                        │ autor_rol (enum)         │
                        │ texto_respuesta (text)   │
                        │ escrito_en (timestamp)   │
                        └──────────────────────────┘
```

### Sentencias SQL sugeridas de inicialización:

```sql
-- Declaración de Enumeradores de Control Corporativo
CREATE TYPE user_role AS ENUM ('admin', 'soporte', 'usuario');
CREATE TYPE ticket_priority AS ENUM ('Alta', 'Media', 'Baja');
CREATE TYPE ticket_status AS ENUM ('Abierto', 'Resuelto');

-- 1. Compañías Cliente
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    sla_tier VARCHAR(50) DEFAULT 'Premium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Directorio de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'usuario',
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Offline',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla General de Incidencias (Tickets)
CREATE TABLE tickets (
    id VARCHAR(50) PRIMARY KEY, -- Ej: 'TK-101'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ticket_priority NOT NULL DEFAULT 'Media',
    status ticket_status NOT NULL DEFAULT 'Abierto',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Hilo de conversación y logs de sistema
CREATE TABLE ticket_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_role user_role NOT NULL,
    response_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Hoja de Ruta de Modificaciones Frontend a Backend

Para integrar el frontend actual de React con esta infraestructura real, sigue estos 5 pasos ordenadamente:

### Paso 1: Instalar un cliente HTTP y sincronizador de caché
- Reemplazar el manejo primitivo de `useState` en `App.tsx` por **React Query `@tanstack/react-query`** o librerías de fetches optimizadas.
- Instalar `axios` o un envoltorio de `fetch` que incluya interceptores automáticos para inyectar Cookies/JWT (`credentials: 'include'`).

### Paso 2: Crear el enrutador Express en `/server.ts`
- Modificar el archivo `server.ts` de la aplicación para añadir un middleware de parsing de JSON y rutas API protegidas:
  ```ts
  import express from 'express';
  import jwt from 'jsonwebtoken';
  
  const app = express();
  app.use(express.json());

  // Middleware para resguardar endpoints y validar roles
  const requireAdmin = (req: any, res: any, next: any) => {
    const token = req.cookies.session_token;
    // ... lógica para descifrar JWT y rechazar si !token o sub.role !== 'admin'
    next();
  };
  ```

### Paso 3: Conectar el Frontend al Endpoint `/api/tickets`
- **Antes (Estás usando estados locales e inicializadores falsos):**
  ```ts
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  ```
- **Después (Conexión asíncrona robusta):**
  ```typescript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

  // Carga de tickets en tiempo real
  const { data: tickets, isLoading } = useQuery(['tickets'], async () => {
    const res = await fetch('/api/tickets');
    return res.json();
  });
  ```

### Paso 4: Cambiar el Interruptor "Round Robin" a Base de Datos
- Actualmente `isRoundRobinActive` reside únicamente en la memoria de la pestaña del navegador del Administrador actual.
- Al productivizar, el toggle del Admin debe gatillar una mutación HTTP (`PATCH /api/systems/settings` actualizando un boolean `round_robin_active` en la tabla de configuraciones globales de la base de datos). 
- El backend procesará de forma segura en el servidor la cola secuencial evitando colisiones de despacho cuando haya múltiples administradores activos concurrentemente.

### Paso 5: Implementación de WebSockets (Opcional - Altamente Productivo)
- Para que los Técnicos en `SoporteDashboard` y los clientes en `UserPortal` vean las respuestas técnicas instantáneamente sin refrescar, se debe añadir **Socket.io** en el servidor de Express.
- Cada vez que se emita un `handleAddResponse` HTTP, el backend transmite por sockets un evento `TICKET_UPDATE` a los navegadores del hilo respectivo.

---

## 4. Control de Roles y Seguridad (RBAC) en el Backend

El frontend actual es un cascarón visual estricto que responde de forma interactiva a `userRole`. Sin embargo, esto es manipulable a nivel de cliente usando herramientas de desarrollo (DevTools).
**Por ende, la validación de rol DEBE duplicarse e imperar en las APIs del servidor:**

- **Permisos de `usuario` (Cliente):**
  - Puede ejecutar `GET /api/tickets` pero el servidor auto-filtrará con `WHERE created_by_id = :my_uid` para evitar fugas de información inter-compañía (SLA Leak).
  - Puede ejecutar `POST /api/tickets` y `POST /api/tickets/:id/responses`.
- **Permisos de `soporte` (Técnico):**
  - Puede ejecutar `GET /api/tickets` generales de la cola y ver detalles técnicos.
  - No puede alterar el switch de Round Robin ni resetear las cuentas de otros técnicos.
- **Permisos de `admin` (Mesa de Control):**
  - Tiene pase de lectura total indiscriminada.
  - Accede a `PATCH /api/users/:id/role` para el panel de simulación de roles corporativos.
