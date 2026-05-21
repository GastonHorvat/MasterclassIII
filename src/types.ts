export type UserRole = 'admin' | 'soporte' | 'usuario';

export interface UserSession {
  username: string;
  email: string;
  company: string;
  role: UserRole;
}

export interface TicketResponse {
  id: string;
  author: string;
  role: UserRole;
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'Alta' | 'Media' | 'Baja';
  status: 'Abierto' | 'Resuelto';
  clientCompany: string;
  assignedTo: string; // Name of technician, e.g. "Carlos", "Marta", "Javier" or "Sin Asignar"
  createdBy: string; // Email or name of client user
  createdAt: string;
  responses: TicketResponse[];
}
