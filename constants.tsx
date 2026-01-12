
import React from 'react';
import { Client, ClientStatus, Project, ProjectStatus, Deliverable, DeliverableStatus, Invoice, InvoiceStatus, Expense, Payment, InvoiceTemplateSettings, ExpenseCategory } from './types';

export const COMPANY_INFO = {
  name: "WachaExperience-AI (U) Ltd",
  initials: "WEA",
  contacts: ["0774 178 738", "0704 650 600"],
  emails: ["wachaexperience@gmail.com", "peter@wachaexperience.com"],
  website: "www.wachaexperience.com",
};

export const DEFAULT_INVOICE_SETTINGS: InvoiceTemplateSettings = {
  primaryColor: '#2563eb', // blue-600
  footerText: "Thank you for partnering with WachaExperience-AI (U) Ltd. Payment is due within 15 days.",
  showPaymentInstructions: true,
};

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-1', name: 'Software/APIs', color: '#3b82f6' },
  { id: 'cat-2', name: 'Hosting', color: '#10b981' },
  { id: 'cat-3', name: 'Design assets', color: '#8b5cf6' },
  { id: 'cat-4', name: 'Subcontractors', color: '#f59e0b' },
  { id: 'cat-5', name: 'Miscellaneous', color: '#6b7280' }
];

export const WEALogo: React.FC<{ className?: string }> = ({ className = "h-8 w-auto" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="12" fill="#111827" />
    <path d="M20 35L35 65L50 35L65 65L80 35" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30 75H70" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// Initial Mock Data (Converted to UGX)
export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'TechFlow Solutions',
    email: 'info@techflow.io',
    phone: '+256 700 000 001',
    status: ClientStatus.HEALTHY,
    sentiment: 0.9,
    createdAt: '2024-01-10',
  },
  {
    id: 'c2',
    name: 'GreenEarth Agri',
    email: 'contact@greenearth.ug',
    phone: '+256 700 000 002',
    status: ClientStatus.WATCH,
    sentiment: 0.6,
    createdAt: '2024-02-15',
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    clientId: 'c1',
    name: 'E-commerce AI Integration',
    description: 'Implementing a recommendation engine and customer support bot.',
    status: ProjectStatus.ACTIVE,
    startDate: '2024-03-01',
    endDate: '2024-05-15',
  },
  {
    id: 'p2',
    clientId: 'c2',
    name: 'AgriTech Data Dashboard',
    description: 'Visualizing crop yields and soil health data from sensors.',
    status: ProjectStatus.ACTIVE,
    startDate: '2024-03-20',
    endDate: '2024-06-30',
  }
];

export const INITIAL_DELIVERABLES: Deliverable[] = [
  { id: 'd1', projectId: 'p1', name: 'AI Model Training', deadline: '2024-04-10', status: DeliverableStatus.IN_PROGRESS },
  { id: 'd2', projectId: 'p1', name: 'UI Mockups', deadline: '2024-03-25', status: DeliverableStatus.DELIVERED },
  { id: 'd3', projectId: 'p2', name: 'Sensor API Integration', deadline: '2024-04-20', status: DeliverableStatus.PLANNED },
];

export const INITIAL_INVOICES: Invoice[] = [
  { id: 'i1', clientId: 'c1', number: 'INV-2024-001', amount: 9500000, receivedAmount: 9500000, status: InvoiceStatus.PAID, dueDate: '2024-03-15', createdAt: '2024-03-01' },
  { id: 'i2', clientId: 'c1', number: 'INV-2024-002', amount: 5600000, receivedAmount: 2000000, status: InvoiceStatus.PARTIAL, dueDate: '2024-04-15', createdAt: '2024-03-25' },
];

export const INITIAL_PAYMENTS: Payment[] = [
  { id: 'pay1', invoiceId: 'i1', amount: 9500000, method: 'Bank Transfer', date: '2024-03-10', reference: 'TECHFLOW-FULL' },
  { id: 'pay2', invoiceId: 'i2', amount: 2000000, method: 'Mobile Money', date: '2024-03-28', reference: 'TECHFLOW-PART1' },
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'e1', projectId: 'p1', invoiceId: 'i1', categoryId: 'cat-1', amount: 1700000, description: 'OpenAI API Usage - March', date: '2024-03-15' },
  { id: 'e2', projectId: 'p1', invoiceId: 'i1', categoryId: 'cat-2', amount: 300000, description: 'Vercel Pro Subscription', date: '2024-03-01' },
  { id: 'e3', projectId: 'p2', categoryId: 'cat-4', amount: 4500000, description: 'Sensor Hardware Specialist', date: '2024-03-22' },
];
