import { Ticket, MockUser } from './types';

export const INITIAL_TECHNICIANS = ['Carlos', 'Marta', 'Javier'];

export const INITIAL_USERS: MockUser[] = [
  {
    id: 'USR-01',
    name: 'Gastón Horvat',
    email: 'gastonhorvat@gmail.com',
    company: 'Acme Corp',
    role: 'usuario',
    status: 'Online',
  },
  {
    id: 'USR-02',
    name: 'Marta (Técnico)',
    email: 'marta.soporte@ticketb2b.com',
    company: 'Soporte Interno #02',
    role: 'soporte',
    status: 'Online',
  },
  {
    id: 'USR-03',
    name: 'Carlos (Técnico)',
    email: 'carlos.soporte@ticketb2b.com',
    company: 'Soporte Interno #01',
    role: 'soporte',
    status: 'Online',
  },
  {
    id: 'USR-04',
    name: 'Javier (Técnico)',
    email: 'javier.soporte@ticketb2b.com',
    company: 'Soporte Interno #03',
    role: 'soporte',
    status: 'Offline',
  },
  {
    id: 'USR-05',
    name: 'Administrador Principal',
    email: 'chief.admin@ticketb2b.com',
    company: 'Global IT Operations',
    role: 'admin',
    status: 'Online',
  },
  {
    id: 'USR-06',
    name: 'Client Globex',
    email: 'client.globex@gmail.com',
    company: 'Globex Inc',
    role: 'usuario',
    status: 'Offline',
  }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TK-89',
    title: 'Error de desbordamiento en API de Facturación',
    description: 'Nuestros servidores web reciben un código de respuesta HTTP 500 al realizar consultas masivas de liquidación a fin de mes. Afecta a más de 300 clientes concurrentes.',
    priority: 'Alta',
    status: 'Abierto',
    clientCompany: 'Acme Corp',
    assignedTo: 'Marta', // Soporte Técnico #02
    createdBy: 'gastonhorvat@gmail.com',
    createdAt: '2026-05-20T10:30:00Z',
    responses: [
      {
        id: 'R-1',
        author: 'Marta',
        role: 'soporte',
        text: 'He revisado los registros de depuración. Parece ser una colisión de clave primaria al generar transacciones duplicadas. Estamos trabajando en el parche.',
        createdAt: '2026-05-20T11:15:00Z'
      }
    ]
  },
  {
    id: 'TK-104',
    title: 'Desconexión intermitente de túnel VPN IPsec',
    description: 'El túnel VPN primario con la sucursal de Madrid pierde paquetes cada 15 minutos en promedio. Los ingenieros de red locales informaron que el gateway IKEv2 se reinicia por fallas de autenticación de fase 2.',
    priority: 'Alta',
    status: 'Abierto',
    clientCompany: 'Globex Inc',
    assignedTo: 'Carlos',
    createdBy: 'client.globex@gmail.com',
    createdAt: '2026-05-21T08:12:00Z',
    responses: []
  },
  {
    id: 'TK-47',
    title: 'Solicitud de provisión de sandbox de desarrollo regional',
    description: 'Solicito la creación de 3 instancias en la nube (AWS EC2 t3.medium) con almacenamiento EBS de 100GB y configuración de seguridad base para el equipo de desarrollo de LATAM.',
    priority: 'Media',
    status: 'Resuelto',
    clientCompany: 'Soylent Co',
    assignedTo: 'Javier',
    createdBy: 'dev.lead@soylent.com',
    createdAt: '2026-05-18T14:22:00Z',
    responses: [
      {
        id: 'R-2',
        author: 'Javier',
        role: 'soporte',
        text: 'La infraestructura de sandboxes ya fue creada y configurada de acuerdo con las políticas de seguridad del puerto 443. Se enviaron las llaves PEM vía canal seguro.',
        createdAt: '2026-05-19T09:40:00Z'
      }
    ]
  },
  {
    id: 'TK-12',
    title: 'Falla de sincronización en módulo LDAP corporativo',
    description: 'La sincronización diaria de usuarios no está capturando los nuevos ingresos del departamento de Operaciones. Los usuarios nuevos reciben error de "Usuario Inexistente" al autenticarse.',
    priority: 'Baja',
    status: 'Resuelto',
    clientCompany: 'Initech',
    assignedTo: 'Carlos',
    createdBy: 'gastonhorvat@gmail.com',
    createdAt: '2026-05-15T11:00:00Z',
    responses: [
      {
        id: 'R-3',
        author: 'Carlos',
        role: 'soporte',
        text: 'Se detectó que la ruta LDAP (OU=Operaciones) tenía una mayúscula mal escrita. Se corrigió el mapeo de Active Directory y se corrió la sincronización de forma manual. Todo en orden.',
        createdAt: '2026-05-15T13:30:00Z'
      }
    ]
  },
  {
    id: 'TK-142',
    title: 'Lentitud extrema en consultas analíticas de PostgreSQL',
    description: 'Un reporte específico de facturación histórica tarda más de 120 segundos en correr y a veces lanza un timeout de puerta de enlace. Necesitamos indexar adecuadamente las tablas de transacciones.',
    priority: 'Media',
    status: 'Abierto',
    clientCompany: 'Umbrella Corp',
    assignedTo: 'Sin Asignar',
    createdBy: 'analyst@umbrella.com',
    createdAt: '2026-05-21T12:04:00Z',
    responses: []
  }
];
