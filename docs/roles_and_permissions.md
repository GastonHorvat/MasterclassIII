# Manual de Implementación: Esquema de Roles y Permisos (RBAC)

Este documento describe la especificación de diseño e implementación del modelo de **Control de Acceso Basado en Roles (RBAC)** para el sistema **Nexus Core B2B**. Detalla tanto la segmentación visual interactiva en el Frontend (React) como las capas de validación críticas en el Backend (API middleware) y la persistencia (Base de Datos).

---

## 1. Definición de Roles y Alcances (Matriz de Control)

El sistema soporta una matriz estricta de tres roles que delimitan la funcionalidad operativa disponible en el ecosistema corporativo:

| Característica / Capacidad | `usuario` (Cliente VIP) | `soporte` (Técnico de Red) | `admin` (Mesa de Control) |
| :--- | :---: | :---: | :---: |
| **Acceso a Dashboard General** | No (Acceso a Portal VIP) | Sí (Tablero Técnico) | Sí (Centro de Comando) |
| **Creación de Solicitudes (Tickets)** | Sí (Auto-servicio) | No | No |
| **Responder a sus Propios Tickets** | Sí | Sí (Solo asignados a él) | Sí (Cualquier ticket) |
| **Cambiar Estado a "Resuelto"** | No | Sí (Solo asignados a él) | Sí (Cualquier ticket) |
| **Reasignar Técnico Manualmente** | No | No | Sí (Si Round Robin está apagado) |
| **Activar Asignación "Round Robin"** | No | No | Sí |
| **Gestión/Alteración de Roles de Cuentas** | No | No | Sí (Pestaña "SLA Directorio") |

---

## 2. Implementación de Seguridad en el Frontend (React)

En nuestro frontend interactivo, el estado del rol del usuario reside centralizadamente en `App.tsx` bajo los estados reactivos:

```typescript
const [session, setSession] = useState<UserSession | null>(null);
const [userRole, setUserRole] = useState<UserRole>('usuario');
```

### A. Ruteo e Inyección Condicional
El componente raíz utiliza sentencias condicionales para renderizar el panel exacto sin exponer vistas no autorizadas a la memoria de renderizado activo:

```tsx
<div className="animate-fadeIn">
  {userRole === 'admin' ? (
    activeAdminTab === 'users' ? (
      <UserManagement /* ... */ />
    ) : (
      <AdminDashboard /* ... */ />
    )
  ) : userRole === 'soporte' ? (
    <SoporteDashboard /* ... */ />
  ) : (
    <UserPortal /* ... */ />
  )}
</div>
```

### B. Ocultamiento de Componentes Sensibles en Barra Lateral
Para resguardar el directorio de usuarios, la barra lateral filtra con una cláusula lógica que evalúa directamente el rol actual de la sesión:

```tsx
{userRole === 'admin' && (
  <button
    onClick={() => setActiveAdminTab('users')}
    className={`p-2 rounded-lg transition-all cursor-pointer ${
      activeAdminTab === 'users' ? 'bg-emerald-500/10' : 'text-slate-500'
    }`}
    title="Gestión de Usuarios y Roles"
  >
    <Users className="h-4 w-4" />
  </button>
)}
```

---

## 3. Implementación y Resguardo en el Servidor (Express Middleware)

> ⚠ **Regla de Oro de Seguridad:** Ninguna validación visual en React es 100% segura por sí sola. Dado que un usuario avanzado puede inyectar código o forzar estados de React vía DevTools, el backend de Express **debe validar la identidad y rol en cada petición entrante**.

### Middleware de Validación de Roles (`restrictTo`):

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'soporte' | 'usuario';
    company_id: string;
  };
}

// Middleware generador de restricciones de ruta
export const restrictTo = (...allowedRoles: ('admin' | 'soporte' | 'usuario')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // 1. Obtener token del encabezado de autorización o cookies
    const token = req.cookies.session_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
       return res.status(401).json({ 
         status: 'fail', 
         message: 'No está autorizado. Por favor inicie sesión.' 
       });
    }

    try {
      // 2. Verificar firma del token
      const decodedPayload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      req.user = decodedPayload;

      // 3. Evaluar rol permitido
      if (!allowedRoles.includes(decodedPayload.role)) {
        return res.status(403).json({
          status: 'fail',
          message: 'Permiso denegado. No cuenta con privilegios suficientes.'
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({ status: 'fail', message: 'Token inválido o expirado.' });
    }
  };
};
```

### Aplicación Práctica en Endpoints Operativos:

Aplica el middleware directamente en tus controladores de rutas para encapsular las políticas de acceso del API:

```typescript
import express from 'express';
import { restrictTo } from './middleware/auth';
import { reassignTicket, getAllUsers, toggleRoundRobin } from './controllers';

const router = express.Router();

// Endpoints reservados exclusivamente al Administrador
router.patch('/tickets/:id/reassign', restrictTo('admin'), reassignTicket);
router.get('/users', restrictTo('admin'), getAllUsers);
router.patch('/settings/round-robin', restrictTo('admin'), toggleRoundRobin);

// Endpoints operables por técnicos y administradores
router.patch('/tickets/:id/status', restrictTo('admin', 'soporte'), (req, res) => {
  // Lógica técnica para avanzar a finalizado/reabierto
});
```

---

## 4. Auditoría de Seguridad e Integridad de Datos

Para que el cambio de roles y reasignación cumpla con normas de cumplimiento corporativo (SOX, ISO 27001), se debe asegurar el principio de no repudio:

1. **Log del Historial de Asignaciones:** Cada vez que un Administrador cambie manualmente el rol de un usuario o reasigne un Ticket, el sistema debe registrar una entrada inmutable de auditoría en la tabla `ticket_responses` con rol `'admin'`.
2. **Encriptación de Contraseñas:** Asegurar que las credenciales pasen por la función criptográfica de un solo sentido (ej: `bcrypt` con 12 rondas de salting) durante el flujo de registro o simulación en base de datos.
3. **Control por Base de Datos (Constraint):** La tabla `tickets` posee una restricción referencial (`CHECK`) a nivel relacional que impide ingresar valores de asignación inválidos de usuarios que no tengan el rol correspondiente en la tabla `profiles`.
