
import React, { useState } from 'react';
import { Expense, Project, Invoice, ExpenseCategory } from '../types';
import { Plus, Tag, Search, Filter, MoreHorizontal, PieChart, Banknote, X, Trash2, Calendar, FileText, AlertTriangle, Palette, Check } from 'lucide-react';

interface ExpenseTrackerProps {
  expenses: Expense[];
  projects: Project[];
  invoices: Invoice[];
  categories: ExpenseCategory[];
  onAddCategory: (category: ExpenseCategory) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory: (category: ExpenseCategory) => void;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ 
  expenses, 
  projects, 
  invoices,
  categories, 
  onAddCategory, 
  onDeleteCategory,
  onUpdateCategory,
  onAddExpense,
  onDeleteExpense
}) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  
  // New Category State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

  // New Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    categoryId: categories[0]?.id || '',
    projectId: projects[0]?.id || '',
    invoiceId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const formatUGX = (val: number) => `UGX ${val.toLocaleString()}`;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategoryId || e.categoryId === activeCategoryId;
    return matchesSearch && matchesCategory;
  });

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory({
        id: `cat-${Date.now()}`,
        name: newCategoryName.trim(),
        color: newCategoryColor
      });
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.categoryId) return;

    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      categoryId: expenseForm.categoryId,
      projectId: expenseForm.projectId,
      invoiceId: expenseForm.invoiceId || undefined,
      date: expenseForm.date
    };

    onAddExpense(newExpense);
    setShowExpenseModal(false);
    setExpenseForm({
      description: '',
      amount: '',
      categoryId: categories[0]?.id || '',
      projectId: projects[0]?.id || '',
      invoiceId: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const colorPalette = [
    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', 
    '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#f97316'
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Tracking</h1>
          <p className="text-gray-500">Monitoring operational costs and project profitability in UGX.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Tag size={18} />
            Categories
          </button>
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg"
          >
            <Plus size={20} />
            Log Expense
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
            <Banknote size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Outflow</p>
            <p className="text-xl font-bold text-gray-900">{formatUGX(totalExpenses)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Areas</p>
            <p className="text-xl font-bold text-gray-900">{categories.length} Categories</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-green-50 text-green-600 p-3 rounded-xl">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Flow</p>
            <p className="text-xl font-bold text-gray-900 truncate">
              {filteredExpenses.length > 0 ? formatUGX(filteredExpenses[0].amount) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by description..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <button 
            onClick={() => setActiveCategoryId(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategoryId === null 
                ? 'bg-gray-900 text-white border-gray-900' 
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                activeCategoryId === cat.id 
                  ? 'bg-white border-2 shadow-sm' 
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
              style={activeCategoryId === cat.id ? { borderColor: cat.color, color: cat.color } : {}}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Expense Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredExpenses.map((expense) => {
          const project = projects.find(p => p.id === expense.projectId);
          const invoice = invoices.find(i => i.id === expense.invoiceId);
          const category = categories.find(c => c.id === expense.categoryId);
          
          return (
            <div key={expense.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest"
                  style={{ 
                    backgroundColor: `${category?.color}15`, 
                    color: category?.color || '#6b7280' 
                  }}
                >
                  {category?.name || 'Uncategorized'}
                </span>
                <p className="text-[10px] text-gray-400 font-bold">{new Date(expense.date).toLocaleDateString()}</p>
              </div>

              <div className="p-5 flex-1 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{expense.description}</h4>
                  <p className="text-xs text-blue-600 font-medium mt-1">{project?.name || 'General OpEx'}</p>
                </div>

                {invoice && (
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                    <FileText size={12} />
                    Linked: {invoice.number}
                  </div>
                )}
                
                <p className="text-lg font-black text-gray-900">{formatUGX(expense.amount)}</p>
              </div>

              <div className="p-3 bg-gray-50 flex items-center justify-end gap-2">
                <button 
                  onClick={() => setExpenseToDelete(expense.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          );
        })}
        {filteredExpenses.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">No expenses found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <div>
                <h3 className="text-xl font-bold">Manage Expense Categories</h3>
                <p className="text-sm text-gray-400">Define custom classification for your spending.</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Add New Category */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Create New</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="text" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Travel, Office Supplies"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {colorPalette.slice(0, 5).map(c => (
                        <button 
                          key={c}
                          onClick={() => setNewCategoryColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${newCategoryColor === c ? 'border-gray-900' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button 
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                      className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Category List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Active Categories</h4>
                {categories.map((cat) => {
                  const inUse = expenses.some(e => e.categoryId === cat.id);
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                          <Tag size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{cat.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {expenses.filter(e => e.categoryId === cat.id).length} Entries
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 mr-2">
                          {colorPalette.slice(0, 3).map(c => (
                            <button 
                              key={c}
                              onClick={() => onUpdateCategory({ ...cat, color: c })}
                              className={`w-4 h-4 rounded-full border transition-all ${cat.color === c ? 'border-gray-900 scale-125' : 'border-transparent opacity-50'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <button 
                          disabled={inUse}
                          onClick={() => onDeleteCategory(cat.id)}
                          className={`p-2 rounded-lg transition-all ${inUse ? 'text-gray-100 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                          title={inUse ? "Cannot delete category in use" : "Delete category"}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleAddExpense} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <div>
                <h3 className="text-xl font-bold">Log Money Out</h3>
                <p className="text-sm text-gray-400">Record a project or operational cost.</p>
              </div>
              <button type="button" onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Description</label>
                  <input 
                    required
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    placeholder="e.g. AWS Subscription, API Credits"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Amount (UGX)</label>
                  <input 
                    required
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Date</label>
                  <input 
                    required
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Category</label>
                  <div className="relative">
                    <select 
                      value={expenseForm.categoryId}
                      onChange={(e) => setExpenseForm({...expenseForm, categoryId: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <div 
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none" 
                      style={{ backgroundColor: categories.find(c => c.id === expenseForm.categoryId)?.color }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Project</label>
                  <select 
                    value={expenseForm.projectId}
                    onChange={(e) => setExpenseForm({...expenseForm, projectId: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                  >
                    <option value="">General / None</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-gray-900">Remove Record?</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Are you sure? This entry will be permanently deleted from the business ledger and project cost reports.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                No, Keep it
              </button>
              <button 
                onClick={() => {
                  if (expenseToDelete) {
                    onDeleteExpense(expenseToDelete);
                    setExpenseToDelete(null);
                  }
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTracker;
