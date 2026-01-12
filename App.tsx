
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientManager from './components/ClientManager';
import ProjectTracker from './components/ProjectTracker';
import Invoicing from './components/Invoicing';
import AIConsole from './components/AIConsole';
import SupportChat from './components/SupportChat';
import ExpenseTracker from './components/ExpenseTracker';
import { 
  INITIAL_CLIENTS, 
  INITIAL_PROJECTS, 
  INITIAL_DELIVERABLES, 
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INVOICE_SETTINGS
} from './constants';
import { AIActionLog, Expense, Payment, Invoice, InvoiceStatus, InvoiceTemplateSettings, ExpenseCategory } from './types';

const App: React.FC = () => {
  const [currentPath, setPath] = useState('dashboard');
  const [clients] = useState(INITIAL_CLIENTS);
  const [projects] = useState(INITIAL_PROJECTS);
  const [deliverables] = useState(INITIAL_DELIVERABLES);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [categories, setCategories] = useState<ExpenseCategory[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [aiLogs, setAiLogs] = useState<AIActionLog[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceTemplateSettings>(DEFAULT_INVOICE_SETTINGS);

  const handleNewLog = (log: AIActionLog) => {
    setAiLogs(prev => [log, ...prev]);
  };

  const handleAddCategory = (category: ExpenseCategory) => {
    setCategories(prev => [...prev, category]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateCategory = (category: ExpenseCategory) => {
    setCategories(prev => prev.map(c => c.id === category.id ? category : c));
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateInvoiceSettings = (settings: InvoiceTemplateSettings) => {
    setInvoiceSettings(settings);
  };

  const handleRecordPayment = (payment: Payment) => {
    setPayments(prev => [...prev, payment]);
    
    // Update invoice received amount and status
    setInvoices(prevInvoices => prevInvoices.map(inv => {
      if (inv.id === payment.invoiceId) {
        const newReceived = inv.receivedAmount + payment.amount;
        let newStatus = inv.status;
        if (newReceived >= inv.amount) {
          newStatus = InvoiceStatus.PAID;
        } else if (newReceived > 0) {
          newStatus = InvoiceStatus.PARTIAL;
        }
        return { ...inv, receivedAmount: newReceived, status: newStatus };
      }
      return inv;
    }));
  };

  const renderContent = () => {
    switch (currentPath) {
      case 'dashboard':
        return <Dashboard clients={clients} projects={projects} invoices={invoices} aiLogs={aiLogs} />;
      case 'clients':
        return <ClientManager clients={clients} />;
      case 'projects':
        return <ProjectTracker projects={projects} deliverables={deliverables} />;
      case 'expenses':
        return (
          <ExpenseTracker 
            expenses={expenses} 
            projects={projects} 
            invoices={invoices}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdateCategory={handleUpdateCategory}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        );
      case 'invoices':
        return (
          <Invoicing 
            invoices={invoices} 
            payments={payments}
            clients={clients} 
            templateSettings={invoiceSettings}
            onUpdateTemplate={handleUpdateInvoiceSettings}
            onRecordPayment={handleRecordPayment}
          />
        );
      case 'ops':
        return (
          <AIConsole 
            clients={clients} 
            projects={projects} 
            deliverables={deliverables} 
            invoices={invoices} 
            aiLogs={aiLogs}
            onNewLog={handleNewLog}
          />
        );
      case 'support':
        return <SupportChat />;
      case 'settings':
        return (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-100">
            <h2 className="text-xl font-bold">System Settings</h2>
            <p className="text-gray-500">Configure thresholds, API keys, and notification channels.</p>
          </div>
        );
      default:
        return <Dashboard clients={clients} projects={projects} invoices={invoices} aiLogs={aiLogs} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentPath={currentPath} setPath={setPath} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {renderContent()}
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-gray-900 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-gray-700">
          <div className="relative">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
          </div>
          <span className="text-xs font-bold tracking-tight uppercase">WEA-Ops UGX OS</span>
        </div>
      </div>
    </div>
  );
};

export default App;
