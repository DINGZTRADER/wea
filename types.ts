
export enum ClientStatus {
  HEALTHY = 'Healthy',
  WATCH = 'Watch',
  RISK = 'Risk'
}

export enum ProjectStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  COMPLETED = 'Completed'
}

export enum DeliverableStatus {
  PLANNED = 'Planned',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DELIVERED = 'Delivered'
}

export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  PARTIAL = 'Partial',
  OVERDUE = 'Overdue'
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  sentiment: number; // 0 to 1
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
}

export interface Deliverable {
  id: string;
  projectId: string;
  name: string;
  deadline: string;
  status: DeliverableStatus;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

export interface Expense {
  id: string;
  projectId: string;
  invoiceId?: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
}

export interface InvoiceTemplateSettings {
  logo?: string; // base64 string
  primaryColor: string;
  footerText: string;
  showPaymentInstructions: boolean;
}

export interface Invoice {
  id: string;
  clientId: string;
  number: string;
  amount: number;
  receivedAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  templateSettings?: InvoiceTemplateSettings;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  date: string;
  reference?: string;
}

export interface AIActionLog {
  id: string;
  timestamp: string;
  action: string;
  reasoning: string;
  confidence: number;
  escalated: boolean;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
