
import React, { useState, useEffect } from 'react';
import { AIActionLog, Client, Project, Deliverable, Invoice } from '../types';
import { getWEAOpsDecision } from '../services/geminiService';
import { 
  Play, 
  Pause, 
  RotateCw, 
  ShieldCheck, 
  Activity, 
  BrainCircuit, 
  History,
  AlertTriangle
} from 'lucide-react';

interface AIConsoleProps {
  clients: Client[];
  projects: Project[];
  deliverables: Deliverable[];
  invoices: Invoice[];
  aiLogs: AIActionLog[];
  onNewLog: (log: AIActionLog) => void;
}

const AIConsole: React.FC<AIConsoleProps> = ({ 
  clients, projects, deliverables, invoices, aiLogs, onNewLog 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const runDecisionCycle = async () => {
    if (isProcessing || isPaused) return;
    setIsProcessing(true);
    const log = await getWEAOpsDecision(clients, projects, deliverables, invoices);
    if (log.action) {
      onNewLog(log as AIActionLog);
    }
    setIsProcessing(false);
  };

  useEffect(() => {
    // Initial run
    if (aiLogs.length === 0) runDecisionCycle();

    const interval = setInterval(() => {
      runDecisionCycle();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WEA-Ops AI Console</h1>
          <p className="text-gray-500">Autonomous business reasoning and orchestration.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
              isPaused 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
            {isPaused ? 'Resume Ops' : 'Pause Ops'}
          </button>
          <button 
            onClick={runDecisionCycle}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RotateCw size={18} className={isProcessing ? 'animate-spin' : ''} />
            Force Re-cycle
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 text-white p-6 rounded-xl shadow-xl">
            <h3 className="flex items-center gap-2 text-sm font-bold text-blue-400 uppercase tracking-widest mb-6">
              <Activity size={18} />
              Core Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">System</span>
                <span className="text-green-400 font-medium">HEALTHY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Reasoning</span>
                <span className="text-white font-medium">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Version</span>
                <span className="text-white font-medium">v1.0.4-L</span>
              </div>
              <div className="pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Uptime Confidence</p>
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[98%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
              <ShieldCheck size={18} className="text-green-600" />
              Safety Guardrails
            </h3>
            <ul className="space-y-3 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1 shrink-0"></div>
                No payment signing authority
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1 shrink-0"></div>
                Human approval required for pricing
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1 shrink-0"></div>
                Auto-escalate negative sentiment
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <History size={18} className="text-blue-600" />
                Action Audit Log
              </h3>
              <span className="text-xs text-gray-500">{aiLogs.length} events logged</span>
            </div>
            
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {aiLogs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${log.escalated ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        {log.escalated ? <AlertTriangle size={20} /> : <BrainCircuit size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{log.action}</h4>
                        <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        log.escalated ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {log.escalated ? 'Escalated' : 'Autonomous'}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">Confidence: {(log.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="ml-12">
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                      <strong className="text-gray-900">Reasoning:</strong> {log.reasoning}
                    </p>
                  </div>
                </div>
              ))}
              {aiLogs.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <p>No activity recorded yet. Run a decision cycle to begin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConsole;
