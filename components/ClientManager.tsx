
import React from 'react';
import { Client, ClientStatus } from '../types';
import { MoreHorizontal, Plus, Search, Mail, Phone, ExternalLink, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

interface ClientManagerProps {
  clients: Client[];
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients }) => {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Directory</h1>
          <p className="text-gray-500">Managing relationships and satisfaction metrics.</p>
        </div>
        <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg">
          <Plus size={20} />
          New Client
        </button>
      </header>

      <div className="relative group max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search clients by name, email or ID..." 
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                  {client.status === ClientStatus.HEALTHY ? (
                    <ShieldCheck className="text-green-500" size={24} />
                  ) : client.status === ClientStatus.WATCH ? (
                    <ShieldQuestion className="text-yellow-500" size={24} />
                  ) : (
                    <ShieldAlert className="text-red-500" size={24} />
                  )}
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                  {client.name}
                  <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-gray-400 font-medium">ID: {client.id.toUpperCase()}</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={16} className="text-gray-400" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <span>{client.phone}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sentiment</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          client.sentiment > 0.8 ? 'bg-green-500' : client.sentiment > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${client.sentiment * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-700">{(client.sentiment * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Joined</p>
                  <p className="text-xs font-bold text-gray-700">{new Date(client.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400">No clients found in the directory.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientManager;
