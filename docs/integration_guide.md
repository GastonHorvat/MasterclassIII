# Guía de Refactorización: Reemplazo de MockData con Integración Real

Este manual detalla a nivel de código qué archivos (`src/`) deben modificarse, qué secciones deben eliminarse (como presintonías de usuario y selectores simulados), y cómo se reemplazan los estados locales de React por peticiones asíncronas a un servidor de producción.

---

## 1. Archivos a Modificar y Plan de Reemplazo

A continuación se presenta el mapa de cambios quirúrgicos requeridos en la base de código actual:

### Archivo 1: `src/mockData.ts` (Eliminación Completa)
*   **Qué hacer:** Eliminar por completo este archivo del repositorio (`rm src/mockData.ts`) para evitar fugas de memoria o que persistan importaciones muertas en el build bundle.

---

### Archivo 2: `src/components/LoginForm.tsx` (Limpieza de Presets)
*   **Estado actual:** Muestra botones rápidos para los perfiles ficticios y simula la autenticación usando un retraso de tiempo con `setTimeout`.
*   **Modificaciones requeridas:**
    1.  **Eliminar la constante `PRESETS`** y el selector visual `"Presintonías de Usuario (Demostración Rápida)"` de las líneas de renderizado.
    2.  **Eliminar el divisor visual** `"O credenciales manuales"`.
    3.  **Remover el campo de contraseña simulado** (el placeholder de asteriscos manuales) y requerir una contraseña de verdad en el flujo de envío de datos del formulario.
    4.  **Modificar el handler `handleSubmit`** para conectar a la API de Node.js/Express:

```typescript
// ❌ ELIMINAR EL SEGMENTO DE SIMULACIÓN OBSOLETO:
// setTimeout(() => { ... onLoginSuccess(computedSession) ... }, 700);

//  REEMPLAZAR CON ACCESO A ENDPOINT DE PRODUCCIÓN:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMsg('');
  setIsSubmitting(true);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Error en autenticación');
    }

    // result contiene la sesión con JWT seteado en Cookie segura HttpOnly
    onLoginSuccess(result.session);
  } catch (error: any) {
    setErrorMsg(error.message || 'Error al conectar con la central de autenticación.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### Archivo 3: `src/components/AdminDashboard.tsx` (Técnicos y Métricas Reales)
*   **Estado actual:** Importa `INITIAL_TECHNICIANS` y calcula métricas sobre la longitud del array de datos mockeados.
*   **Modificaciones requeridas:**
    1.  **Eliminar la importación de `INITIAL_TECHNICIANS`** y del objeto estático.
    2.  **Cargar la lista de técnicos dinámicamente:** Añadir un hook o prop `technicians` que contenga los usuarios de la base de datos que poseen el rol de `'soporte'`.
    3.  **Modificar el selector de re-asignación manual** para iterar sobre la lista cargada en tiempo real:

```tsx
// ❌ ANTES:
// {INITIAL_TECHNICIANS.map((tech) => ( <option value={tech}>{tech}</option> ))}

//  AHORA:
{technicians.map((tech) => (
  <option key={tech.id} value={tech.name}>
    {tech.name} (SLA Activos: {tech.activeTicketsCount})
  </option>
))}
```

---

### Archivo 4: `src/components/SoporteDashboard.tsx` (Control de Cola Real)
*   **Estado actual:** Deduce el nombre del técnico de soporte basado en la comparación hardcoded `session.username === 'Marta'`.
*   **Modificaciones requeridas:**
    1.  **Eliminar la deducción condicional estática** `displayId = session.username === 'Marta' ? ...`.
    2.  **Consumir el identificador único del perfil (`profiles.id`)** para todas las lógicas de emparejamiento, filtrado de incidencias y registros de auditorías en lugar de comparar strings por nombre de pila.
    3.  **Establecer validación en tiempo de ejecución de SLA:** Al presionar "Atender", ejecutar un dispatch `PATCH /api/tickets/:id/claim` enviando la autenticación implícita.

---

### Archivo 5: `src/App.tsx` (Desmontaje del Panel Simulador)
*   **Estado actual:** Posee el dropdown `"Forzar Rol"` en la cabecera que simula el cambio inmediato de interfaz cambiando de `'usuario'` a `'soporte'` o `'admin'` localmente.
*   **Modificaciones requeridas:**
    1.  **Eliminar el componente de dropdown "Forzar Rol"** (selector `<select id="forcedRole">` junto con su etiqueta y la variable de estado `userRole` mutada manualmente). El rol debe responder exclusivamente al guardado seguro en la sesión autenticada `session.role` decodificada del JWT del usuario.
    2.  **Eliminar banderas visuales de modo demostración:** Retirar el banner de alerta superior verde `"ENTORNO INTERACTIVO EN TIEMPO REAL (REACT STATE ENGINE)"` diseñado estrictamente para simulación.
    3.  **Actualizar sincronización asíncrona:** Eliminar las funciones de mutación locales `handleAddResponse`, `handleCreateTicket`, `handleClaimTicket` de la memoria del navegador de React y reemplazarlas por queries estructuradas vinculadas a la API del servidor (por ejemplo, con React Query / Axios):

```typescript
// Implementación recomendada con React Query para refresco dinámico automático:
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 1. QUERY DE LECTURA DE INCIDENCIAS
const { data: tickets, refetch } = useQuery({
  queryKey: ['tickets', session?.role],
  queryFn: async () => {
    const res = await fetch('/api/tickets');
    return res.json();
  },
  enabled: !!session,
});

// 2. MUTACIÓN PARA UNIR MENSAJES AL HILO DE SOPORTE (REAL-TIME SAFE)
const responseMutation = useMutation({
  mutationFn: async ({ ticketId, text }: { ticketId: string; text: string }) => {
    const res = await fetch(`/api/tickets/${ticketId}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return res.json();
  },
  onSuccess: () => {
    // Re-sincronizar caché de forma inmediata e invisible para los técnicos
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  }
});
```

---

## 2. ¿Queda Algo Más Por Documentar?

Con la creación de los tres manuales en la carpeta `/docs/`:
1.  **`login_and_database.md`** (Conceptos de Login, JWT y Estructura SQL inicial).
2.  **`database_architecture.md`** (Diseño lógico físico Postgres, Políticas de Row Level Security - RLS y Triggers automáticos de SLA).
3.  **`integration_guide.md`** (Hoja de ruta y guía paso a paso para refactorizar la base de código de React).

El modelado esencial para este Diplomado B2B queda **totalmente cubierto**. El diseño visual actual cumple con criterios de alta densidad con una interfaz robusta útil para demostraciones.

Sin embargo, para alcanzar estándares **Enterprise Grade**, se podría completar la documentación en el futuro con los siguientes anexos altamente recomendados:

1.  **Manual de Notificaciones por Eventos en Background (Alerting & Workers):**
    *   Diseñar una cola de mensajería (ej. con Redis + BullMQ u operaciones cron de base de datos) para notificar por email (SendGrid/Amazon SES) o MS Teams si un ticket prioritario está a punto de infringir su límite de tiempo de SLA (definido por el campo `sla_hours` de la compañía).

2.  **Manual de Integración CI/CD y despliegue (Dockerization):**
    *   Especificar el archivo `Dockerfile` multipaso para servir los assets estáticos de React mediante un contenedor de Nginx que simultáneamente rutee el tráfico `/api/*` hacia el servidor backend en NodeJS/Express.
    *   Documentar el pipeline de migraciones de la base de datos (por ejemplo, utilizando herramientas como Prisma, Knex o DB-Mate) para automatizar el aprovisionamiento de RLS y Triggers cada vez que se actualice la infraestructura en servidores Cloud.
