
import React from 'react';
import { Client, Project, Invoice, AIActionLog, ClientStatus } from '../types';
import { 
  Users, 
  Briefcase, 
  AlertCircle, 
  Clock,
  BrainCircuit,
  Wallet,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  aiLogs: AIActionLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, projects, invoices, aiLogs }) => {
  const totalBilled = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalReceived = invoices.reduce((sum, i) => sum + i.receivedAmount, 0);
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const riskClients = clients.filter(c => c.status === ClientStatus.RISK).length;

  const formatUGX = (val: number) => `UGX ${val.toLocaleString()}`;

  const recentActions = aiLogs.slice(0, 8);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Command Dashboard</h1>
          <p className="text-gray-500">Business overview and WEA-Ops priority feed.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          WEA-Ops Active
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Clients', val: clients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Projects', val: activeProjects, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Received', val: formatUGX(totalReceived), icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Risk Flags', val: riskClients, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simplified Summary Feed */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Financial Summary</h3>
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Billed</p>
              <p className="text-2xl font-bold text-gray-900">{formatUGX(totalBilled)}</p>
            </div>
            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
              <p className="text-xs font-bold text-green-600 uppercase mb-1">Total Received</p>
              <p className="text-2xl font-bold text-green-700">{formatUGX(totalReceived)}</p>
            </div>
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
              <p className="text-xs font-bold text-orange-600 uppercase mb-1">Total Outstanding</p>
              <p className="text-2xl font-bold text-orange-700">{formatUGX(totalBilled - totalReceived)}</p>
            </div>
            <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
              View Billing Details <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* AI Priority Feed */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BrainCircuit className="text-blue-600" size={20} />
            WEA-Ops Priority Stream
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {recentActions.map((log) => (
              <div key={log.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-all">
                {log.escalated && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-gray-900">{log.action}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-widest ${log.escalated ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {log.escalated ? 'URGENT' : 'OPTIMIZED'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{log.reasoning}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span>•</span>
                  <span>Confidence: {(log.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {recentActions.length === 0 && (
              <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                <BrainCircuit size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">WEA-Ops is currently initializing reasoning engines...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
