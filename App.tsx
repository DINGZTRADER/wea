
import React, { useEffect, useState } from 'react';
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
import { AIActionLog, Expense, Payment, Invoice, InvoiceStatus, InvoiceTemplateSettings, ExpenseCategory, Client, Project, Deliverable } from './types';
import { api, AuthUser, setCsrfToken } from './services/apiClient';

interface AppStatePayload {
  clients: Client[];
  projects: Project[];
  deliverables: Deliverable[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  categories: ExpenseCategory[];
  invoiceSettings: InvoiceTemplateSettings;
  aiLogs: AIActionLog[];
}

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Starting WEA Command System</p>
    </div>
  </div>
);

const AuthScreen: React.FC<{
  needsBootstrap: boolean;
  connectionError?: string;
  onAuthenticated: (user: AuthUser, csrfToken: string) => void;
}> = ({ needsBootstrap, connectionError, onAuthenticated }) => {
  const [email, setEmail] = useState('peter@wachaexperience.com');
  const [name, setName] = useState('Peter Wacha');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = needsBootstrap
        ? await api.bootstrap({ email, name, password })
        : await api.login({ email, password });
      onAuthenticated(result.user, result.csrfToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-8 bg-gray-900 text-white">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 mb-3">WEA Command System</p>
          <h1 className="text-2xl font-black">{needsBootstrap ? 'Create Owner Account' : 'Sign In'}</h1>
          <p className="text-sm text-gray-400 mt-2">
            {needsBootstrap ? 'Set up the first secure operator account.' : 'Access your operations workspace.'}
          </p>
        </div>

        <div className="p-8 space-y-4">
          {connectionError && (
            <div className="text-sm text-orange-700 bg-orange-50 border border-orange-100 rounded-xl p-3 leading-relaxed">
              {connectionError}
            </div>
          )}
          {needsBootstrap && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Name</label>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Password</label>
            <input
              required
              minLength={12}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Minimum 12 characters</p>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>}
          <button
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? 'Please wait...' : needsBootstrap ? 'Create Secure Workspace' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPath, setPath] = useState('dashboard');
  const [isBooting, setBooting] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [deliverables, setDeliverables] = useState<Deliverable[]>(INITIAL_DELIVERABLES);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [categories, setCategories] = useState<ExpenseCategory[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [aiLogs, setAiLogs] = useState<AIActionLog[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceTemplateSettings>(DEFAULT_INVOICE_SETTINGS);

  const hydrateState = async () => {
    const state = await api.appState<AppStatePayload>();
    setClients(state.clients);
    setProjects(state.projects);
    setDeliverables(state.deliverables);
    setInvoices(state.invoices);
    setPayments(state.payments);
    setExpenses(state.expenses);
    setCategories(state.categories);
    setInvoiceSettings(state.invoiceSettings);
    setAiLogs(state.aiLogs);
  };

  useEffect(() => {
    let active = true;
    api.session()
      .then(async (session) => {
        if (!active) return;
        setNeedsBootstrap(Boolean(session.needsBootstrap));
        if (session.authenticated && session.user && session.csrfToken) {
          setCsrfToken(session.csrfToken);
          setUser(session.user);
          await hydrateState();
        }
      })
      .catch((error) => {
        console.error('Session check failed:', error);
        setConnectionError('The frontend is running, but the secure API is not reachable. Start it with npm run dev:api, then refresh.');
      })
      .finally(() => active && setBooting(false));
    return () => {
      active = false;
    };
  }, []);

  const handleAuthenticated = async (nextUser: AuthUser, token: string) => {
    setCsrfToken(token);
    setUser(nextUser);
    setNeedsBootstrap(false);
    await hydrateState();
  };

  const handleNewLog = (log: AIActionLog) => {
    setAiLogs(prev => [log, ...prev]);
  };

  const handleAddCategory = async (category: ExpenseCategory) => {
    const saved = await api.addCategory({ name: category.name, color: category.color });
    setCategories(prev => [...prev, saved]);
  };

  const handleDeleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateCategory = async (category: ExpenseCategory) => {
    const saved = await api.updateCategory(category);
    setCategories(prev => prev.map(c => c.id === saved.id ? saved : c));
  };

  const handleAddExpense = async (expense: Expense) => {
    const saved = await api.addExpense({
      projectId: expense.projectId,
      invoiceId: expense.invoiceId,
      categoryId: expense.categoryId,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
    });
    setExpenses(prev => [saved, ...prev]);
  };

  const handleDeleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateInvoiceSettings = async (settings: InvoiceTemplateSettings) => {
    const saved = await api.updateInvoiceSettings(settings);
    setInvoiceSettings(saved);
  };

  const handleRecordPayment = async (payment: Payment) => {
    const saved = await api.recordPayment({
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      method: payment.method,
      date: payment.date,
      reference: payment.reference,
    });
    setPayments(prev => [...prev, saved.payment]);
    
    setInvoices(prevInvoices => prevInvoices.map(inv => {
      if (inv.id === saved.invoice.id) {
        return { ...inv, receivedAmount: saved.invoice.receivedAmount, status: saved.invoice.status as InvoiceStatus };
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

  if (isBooting) return <LoadingScreen />;
  if (!user) return <AuthScreen needsBootstrap={needsBootstrap} connectionError={connectionError} onAuthenticated={handleAuthenticated} />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentPath={currentPath} setPath={setPath} operatorEmail={user.email} />
      
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
