
import React, { useState, useRef } from 'react';
import { Invoice, InvoiceStatus, Client, Payment, InvoiceTemplateSettings } from '../types';
import { Download, Wallet, Plus, X, Calendar, DollarSign, CreditCard, MoreHorizontal, Settings, Image as ImageIcon, Check, Printer, Eye } from 'lucide-react';
import { COMPANY_INFO, WEALogo } from '../constants';

interface InvoicingProps {
  invoices: Invoice[];
  payments: Payment[];
  clients: Client[];
  templateSettings: InvoiceTemplateSettings;
  onUpdateTemplate: (settings: InvoiceTemplateSettings) => void;
  onRecordPayment: (payment: Payment) => void;
}

const Invoicing: React.FC<InvoicingProps> = ({ invoices, payments, clients, templateSettings, onUpdateTemplate, onRecordPayment }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPreviewInvoice, setShowPreviewInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Bank Transfer',
    date: new Date().toISOString().split('T')[0],
    reference: ''
  });

  const [localSettings, setLocalSettings] = useState<InvoiceTemplateSettings>(templateSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatUGX = (val: number) => `UGX ${val.toLocaleString()}`;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !paymentForm.amount) return;

    const newPayment: Payment = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceId: selectedInvoiceId,
      amount: parseFloat(paymentForm.amount),
      method: paymentForm.method,
      date: paymentForm.date,
      reference: paymentForm.reference
    };

    onRecordPayment(newPayment);
    setShowPaymentModal(false);
    setSelectedInvoiceId('');
    setPaymentForm({
      amount: '',
      method: 'Bank Transfer',
      date: new Date().toISOString().split('T')[0],
      reference: ''
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    onUpdateTemplate(localSettings);
    setShowSettingsModal(false);
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID: return 'bg-green-100 text-green-700';
      case InvoiceStatus.PARTIAL: return 'bg-blue-100 text-blue-700';
      case InvoiceStatus.SENT: return 'bg-yellow-100 text-yellow-700';
      case InvoiceStatus.OVERDUE: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const colorPresets = [
    { name: 'Classic Blue', hex: '#2563eb' },
    { name: 'Tech Gray', hex: '#1f2937' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Purple AI', hex: '#7c3aed' },
    { name: 'Solar Orange', hex: '#f97316' },
    { name: 'Corporate Indigo', hex: '#4f46e5' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-500">Managing cash flow and client ledgers in UGX.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Settings size={18} />
            Template Settings
          </button>
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Wallet size={18} />
            Record Payment
          </button>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg">
            <Plus size={20} />
            New Invoice
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {invoices.map((inv) => {
          const client = clients.find(c => c.id === inv.clientId);
          const balance = inv.amount - inv.receivedAmount;
          return (
            <div key={inv.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
              <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900">{inv.number}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(inv.status)}`}>
                  {inv.status}
                </span>
              </div>
              
              <div className="p-5 flex-1 space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Client</p>
                  <p className="text-sm font-bold text-gray-800">{client?.name || 'Unknown Client'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total</p>
                    <p className="text-sm font-bold text-gray-900">{formatUGX(inv.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Balance</p>
                    <p className={`text-sm font-bold ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>{formatUGX(balance)}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 flex items-center justify-between gap-1">
                <button 
                  onClick={() => {
                    setSelectedInvoiceId(inv.id);
                    setShowPaymentModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <CreditCard size={14} /> PAY
                </button>
                <button 
                  onClick={() => setShowPreviewInvoice(inv)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Eye size={14} /> VIEW
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <div>
                <h3 className="text-xl font-bold">Invoice Personalization</h3>
                <p className="text-sm text-gray-400">Branding and template configuration.</p>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3 tracking-wide">Brand Logo</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                    {localSettings.logo ? (
                      <img src={localSettings.logo} alt="Branding" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="text-gray-300" size={32} />
                    )}
                  </div>
                  <div className="space-y-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                      <Plus size={16} /> Change Logo
                    </button>
                    <p className="text-[10px] text-gray-400 max-w-[200px]">SVG, PNG or JPG (recommended 400x400px). Transparent background preferred.</p>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </div>
                </div>
              </div>

              {/* Color Scheme */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3 tracking-wide">Theme Primary Color</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {colorPresets.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setLocalSettings({ ...localSettings, primaryColor: color.hex })}
                      className="relative w-full aspect-square rounded-xl transition-transform hover:scale-105"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {localSettings.primaryColor === color.hex && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/20 rounded-xl">
                          <Check size={20} className="text-white drop-shadow-sm" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <input 
                    type="color" 
                    value={localSettings.primaryColor}
                    onChange={(e) => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
                    className="w-8 h-8 rounded border-0 cursor-pointer p-0"
                  />
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{localSettings.primaryColor}</span>
                </div>
              </div>

              {/* Footer Text */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">Footer Note / Disclaimer</label>
                <textarea 
                  value={localSettings.footerText}
                  onChange={(e) => setLocalSettings({ ...localSettings, footerText: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 resize-none"
                  placeholder="e.g. Terms and conditions, payment details..."
                />
              </div>

              {/* Settings */}
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="showPayment"
                  checked={localSettings.showPaymentInstructions}
                  onChange={(e) => setLocalSettings({ ...localSettings, showPaymentInstructions: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showPayment" className="text-sm text-gray-700 font-medium">Include standard payment instructions in footer</label>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showPreviewInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-start justify-center overflow-y-auto p-4 py-12">
          <div className="bg-white rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Toolbar */}
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center print:hidden">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold uppercase tracking-widest text-blue-400">Document Preview</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-all"
                >
                  <Printer size={18} /> Print
                </button>
                <button 
                  onClick={() => setShowPreviewInvoice(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-12 min-h-[1000px] flex flex-col text-gray-800 print:p-8">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 pb-8 mb-12" style={{ borderColor: templateSettings.primaryColor }}>
                <div className="space-y-4">
                  {templateSettings.logo ? (
                    <img src={templateSettings.logo} alt="Logo" className="h-16 w-auto object-contain" />
                  ) : (
                    <WEALogo className="h-12 w-12" />
                  )}
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{COMPANY_INFO.name}</h2>
                    <p className="text-sm text-gray-500 font-medium">Official Digital Partner</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-5xl font-black mb-2 opacity-10" style={{ color: templateSettings.primaryColor }}>INVOICE</h1>
                  <p className="font-bold text-gray-900">{showPreviewInvoice.number}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(showPreviewInvoice.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm font-bold mt-2" style={{ color: templateSettings.primaryColor }}>Due: {new Date(showPreviewInvoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">BILLED FROM</h4>
                  <div className="text-sm space-y-1">
                    <p className="font-bold text-gray-900">Finance Department</p>
                    <p>{COMPANY_INFO.emails[0]}</p>
                    <p>{COMPANY_INFO.contacts[0]}</p>
                    <p>{COMPANY_INFO.website}</p>
                    <p>Kampala, Uganda</p>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">BILLED TO</h4>
                  {(() => {
                    const client = clients.find(c => c.id === showPreviewInvoice.clientId);
                    return client ? (
                      <div className="text-sm space-y-1">
                        <p className="font-bold text-gray-900">{client.name}</p>
                        <p>{client.email}</p>
                        <p>{client.phone}</p>
                        <p>ID: {client.id.toUpperCase()}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Items Table (Mocked for current data structure) */}
              <div className="flex-1 mb-12">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]" style={{ borderColor: templateSettings.primaryColor }}>
                      <th className="py-4">Service Description</th>
                      <th className="py-4 text-center">Qty</th>
                      <th className="py-4 text-right">Unit Price</th>
                      <th className="py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="text-sm">
                      <td className="py-6 pr-6">
                        <p className="font-bold text-gray-900">Project Professional Services</p>
                        <p className="text-xs text-gray-500 mt-1">Full delivery as per project milestones and agreement.</p>
                      </td>
                      <td className="py-6 text-center">1</td>
                      <td className="py-6 text-right font-medium">{formatUGX(showPreviewInvoice.amount)}</td>
                      <td className="py-6 text-right font-bold text-gray-900">{formatUGX(showPreviewInvoice.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="w-64 ml-auto space-y-4 mb-12 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-900">{formatUGX(showPreviewInvoice.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax (Exempt)</span>
                  <span className="font-bold text-gray-900">UGX 0</span>
                </div>
                <div className="flex justify-between items-center py-4 border-t border-b-2" style={{ borderBottomColor: templateSettings.primaryColor }}>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900">Grand Total</span>
                  <span className="text-xl font-black text-gray-900">{formatUGX(showPreviewInvoice.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount Received</span>
                  <span className="font-bold text-green-600">{formatUGX(showPreviewInvoice.receivedAmount)}</span>
                </div>
                <div className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
                  <span className="text-orange-600 font-bold">Balance Due</span>
                  <span className="font-black text-orange-600">{formatUGX(showPreviewInvoice.amount - showPreviewInvoice.receivedAmount)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto border-t pt-8">
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">NOTES</h4>
                    <p className="text-xs text-gray-600 leading-relaxed italic">
                      {templateSettings.footerText}
                    </p>
                  </div>
                  {templateSettings.showPaymentInstructions && (
                    <div className="text-right">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">PAYMENT INFO</h4>
                      <div className="text-[10px] text-gray-500 space-y-1">
                        <p><span className="font-bold text-gray-700">MTN/Airtel:</span> {COMPANY_INFO.contacts[0]}</p>
                        <p><span className="font-bold text-gray-700">Bank:</span> Stanbic Bank Uganda</p>
                        <p><span className="font-bold text-gray-700">Account:</span> WachaExperience-AI (U) Ltd</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Generated by WEA-Ops Autonomous Ledger System</p>
                  <p className="text-[10px] text-gray-400">Page 1 of 1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleRecordPayment} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <div>
                <h3 className="text-xl font-bold">Post Payment</h3>
                <p className="text-sm text-gray-400">Record incoming client funds in UGX.</p>
              </div>
              <button type="button" onClick={() => {
                setShowPaymentModal(false);
                setSelectedInvoiceId('');
              }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Select Invoice</label>
                <select 
                  required
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="">-- Choose Invoice --</option>
                  {invoices.filter(i => i.status !== InvoiceStatus.PAID).map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.number} (Balance: {formatUGX(inv.amount - inv.receivedAmount)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Amount (UGX)</label>
                  <input 
                    required
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Date</label>
                  <input 
                    required
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Payment Method</label>
                <select 
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option>Bank Transfer</option>
                  <option>Mobile Money</option>
                  <option>Cash</option>
                  <option>Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Reference / Note</label>
                <input 
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                  placeholder="e.g. Transaction ID, Check #"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoiceId('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Invoicing;
