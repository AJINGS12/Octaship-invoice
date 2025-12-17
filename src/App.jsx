import React, { useState, useEffect } from 'react';
import octaLogo from './assets/octaship official logo.png'
import { 
  Printer, Package, FileText, Plus, Trash2, 
  Ship, Anchor, RotateCcw, Settings, Save
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('invoice'); 
  const [isEditing, setIsEditing] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  // --- 1. DATA LOADER HELPERS ---
  const loadState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  // --- 2. INITIAL STATE (Loads from Browser Memory or uses Defaults) ---
  const [companyInfo, setCompanyInfo] = useState(() => loadState('octa_company', {
    name: 'Octaship Logistics',
    address: '5000 Hwy 7, Markham, ON L3R 4M9',
    city: 'Port Logistics City',
    state: 'ST',
    zip: '90210',
    country: 'Canada',
    phone: '+1(437 268-6660)',
    email: 'support@octaship.com',
    website: 'www.octaship.com'
  }));

  const [invoiceDetails, setInvoiceDetails] = useState(() => loadState('octa_inv_details', {
    number: 'INV-2025-001',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'USD',
    taxRate: 7.0,
  }));

  // Start logistics empty so staff fill before printing/sending
  const [logisticsDetails, setLogisticsDetails] = useState(() => loadState('octa_logistics', {
    origin: '',
    destination: '',
    vessel: '',
    bolNumber: '',
    incoterms: '',
    containerNo: ''
  }));

  // Start billTo and shipTo empty so staff can enter customer details
  const [billTo, setBillTo] = useState(() => loadState('octa_billto', {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    contact: ''
  }));

  const [shipTo, setShipTo] = useState(() => loadState('octa_shipto', {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    contact: ''
  }));

  // Start with an empty items array; user will add lines via the UI
  const [items, setItems] = useState(() => loadState('octa_items', []));

  // --- 3. AUTO-SAVER ---
  useEffect(() => {
    localStorage.setItem('octa_company', JSON.stringify(companyInfo));
    localStorage.setItem('octa_inv_details', JSON.stringify(invoiceDetails));
    localStorage.setItem('octa_logistics', JSON.stringify(logisticsDetails));
    localStorage.setItem('octa_billto', JSON.stringify(billTo));
    localStorage.setItem('octa_shipto', JSON.stringify(shipTo));
    localStorage.setItem('octa_items', JSON.stringify(items));
    
    setSaveStatus('Saved locally');
    const timer = setTimeout(() => setSaveStatus(''), 2000);
    return () => clearTimeout(timer);
  }, [companyInfo, invoiceDetails, logisticsDetails, billTo, shipTo, items]);

  // --- 4. CALCULATIONS ---
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * (invoiceDetails.taxRate / 100);
  const totalAmount = subtotal + taxAmount;
  const totalWeight = items.reduce((acc, item) => acc + (item.quantity * item.weight), 0);
  const totalItems = items.reduce((acc, item) => acc + Number(item.quantity), 0);
  const totalVolume = items.reduce((acc, item) => {
    const volPerItem = (item.dimL * item.dimW * item.dimH) / 1000000;
    return acc + (volPerItem * item.quantity);
  }, 0);

  // number of table columns depends on activeTab and whether edit column is present
  const tableColCount = isEditing ? (activeTab === 'invoice' ? 6 : 7) : (activeTab === 'invoice' ? 5 : 6);

  // --- 5. ACTIONS ---
  const handlePrint = () => window.print();
  
  const addItem = () => {
    setItems([...items, {
      id: Date.now(), description: 'New Item', sku: '', quantity: 1, unitPrice: 0, weight: 0, unit: 'pcs', dimL: 0, dimW: 0, dimH: 0
    }]);
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const deleteItem = (id) => setItems(items.filter(item => item.id !== id));

  const handleReset = () => {
    if(confirm('Are you sure? This will clear all data and restore defaults.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Clear only customer/logistics/items (preserve companyInfo and invoiceDetails)
  const handleClearForm = () => {
    if (!confirm('Clear customer, logistics and items? This will NOT remove company info or invoice metadata.')) return;
    setBillTo({ name: '', address: '', city: '', state: '', zip: '', country: '', contact: '' });
    setShipTo({ name: '', address: '', city: '', state: '', zip: '', country: '', contact: '' });
    setLogisticsDetails({ origin: '', destination: '', vessel: '', bolNumber: '', incoterms: '', containerNo: '' });
    setItems([]);
    // remove related saved keys so cleared values persist
    try {
      localStorage.removeItem('octa_billto');
      localStorage.removeItem('octa_shipto');
      localStorage.removeItem('octa_logistics');
      localStorage.removeItem('octa_items');
    } catch(e) {}
    setSaveStatus('Form cleared');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 print:bg-white pb-20">
      {/* --- NAVBAR --- */}
      <nav className="bg-slate-900 text-white p-4 shadow-md print:hidden sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 px-3">
          {/* Brand: keep left, allow full-width stacking on small screens and tighter text size */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-start">
            {/* Use the imported asset (octaLogo) instead of absolute path so bundler can resolve the file */}
            <img src={octaLogo} alt="Octaship logo" className="w-7 h-7 object-contain" />

            <div><h1 className="text-lg md:text-xl font-bold tracking-tight">Octaship<span className="text-blue-400 font-light"> Invoice</span></h1></div>
          </div>
          
          {/* Tabs: center on small screens, inline on md+ */}
          <div className="flex bg-slate-800 rounded-lg p-1 w-full md:w-auto justify-center md:justify-start">
            <button onClick={() => setActiveTab('invoice')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'invoice' ? 'bg-blue-600' : 'text-slate-300 hover:text-white'}`}>
              <FileText className="w-4 h-4" /> Invoice
            </button>
            <button onClick={() => setActiveTab('packing-list')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'packing-list' ? 'bg-blue-600' : 'text-slate-300 hover:text-white'}`}>
              <Package className="w-4 h-4" /> Packing List
            </button>
          </div>

          {/* Actions: stack/wrap on small screens and align to right */}
          <div className="flex items-center gap-3 flex-wrap justify-end w-full md:w-auto">
             {saveStatus && <span className="text-xs text-emerald-400 flex items-center gap-1"><Save className="w-3 h-3" /> {saveStatus}</span>}
             <button onClick={handleReset} className="p-2 text-slate-400 hover:text-red-400" title="Reset Data"><RotateCcw className="w-5 h-5" /></button>
             <button onClick={handleClearForm} className="p-2 text-slate-400 hover:text-yellow-400" title="Clear Form"><Trash2 className="w-5 h-5" /></button>
             <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"><Settings className="w-4 h-4" /> <span className="hidden sm:inline">{isEditing ? 'Preview' : 'Edit'}</span></button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-lg font-medium"><Printer className="w-4 h-4" /> <span className="hidden sm:inline">Print</span></button>
          </div>
        </div>
      </nav>

      {/* --- MAIN DOCUMENT --- */}
      <main className="p-4 md:p-8 print:p-0">
  <div className="max-w-5xl mx-auto bg-white shadow-2xl print:shadow-none relative print:w-full invoice-container">
          
          {/* HEADER */}
          <div className="p-8 md:p-12 border-b-4 border-blue-900">
            <div className="flex flex-col md:flex-row justify-between items-start">
              <div className="w-full md:w-1/2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded overflow-hidden flex items-center justify-center">
                    <img src={octaLogo} alt="Octaship logo" className="w-10 h-10 object-contain" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-widest">Octaship</h1>
                </div>
                {isEditing ? (
                  <div className="space-y-1">
                    <input className="block w-full border-b border-gray-300 focus:border-blue-500 outline-none text-sm" value={companyInfo.address} onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})} placeholder="Address" />
          <div className="flex flex-col sm:flex-row gap-2">
            <input className="w-full sm:w-1/2 border-b border-gray-300 focus:border-blue-500 outline-none text-sm" value={companyInfo.city} onChange={(e) => setCompanyInfo({...companyInfo, city: e.target.value})} placeholder="City" />
            <input className="w-full sm:w-1/4 border-b border-gray-300 focus:border-blue-500 outline-none text-sm" value={companyInfo.state} onChange={(e) => setCompanyInfo({...companyInfo, state: e.target.value})} placeholder="State" />
            <input className="w-full sm:w-1/4 border-b border-gray-300 focus:border-blue-500 outline-none text-sm" value={companyInfo.zip} onChange={(e) => setCompanyInfo({...companyInfo, zip: e.target.value})} placeholder="Zip" />
          </div>
                    <input className="block w-full border-b border-gray-300 focus:border-blue-500 outline-none text-sm" value={companyInfo.country} onChange={(e) => setCompanyInfo({...companyInfo, country: e.target.value})} placeholder="Country" />
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 space-y-0.5">
                    <p>{companyInfo.address}</p>
                    <p>{companyInfo.city}, {companyInfo.state} {companyInfo.zip}</p>
                    <p>{companyInfo.country}</p>
                  </div>
                )}
              </div>
              <div className="text-right w-full md:w-auto mt-4 md:mt-0">
                <h2 className="text-4xl font-light text-slate-300 uppercase">{activeTab === 'invoice' ? 'Commercial Invoice' : 'Packing List'}</h2>
        <div className="mt-4 text-sm flex flex-col items-end gap-2">
          <div className="flex flex-col sm:flex-row items-end gap-2 w-full sm:w-auto">
            <span className="text-gray-500 font-semibold">Ref #:</span>
            {isEditing ? <input className="text-right border-b w-full sm:w-32 outline-none p-2" value={invoiceDetails.number} onChange={(e) => setInvoiceDetails({...invoiceDetails, number: e.target.value})} /> : <span className="font-mono">{invoiceDetails.number}</span>}
          </div>
          <div className="flex flex-col sm:flex-row items-end gap-2 w-full sm:w-auto">
            <span className="text-gray-500 font-semibold">Date:</span>
            {isEditing ? <input type="date" className="text-right border-b w-full sm:w-32 outline-none p-2" value={invoiceDetails.date} onChange={(e) => setInvoiceDetails({...invoiceDetails, date: e.target.value})} /> : <span>{invoiceDetails.date}</span>}
          </div>
        </div>
              </div>
            </div>
          </div>

          {/* LOGISTICS STRIP */}
          <div className="bg-slate-50 px-8 py-4 border-b border-gray-200 text-xs text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
             {Object.entries(logisticsDetails).map(([key, val]) => (
                <div key={key}>
                    <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">{key}</label>
                    {isEditing ? 
                      <input className="bg-transparent border-b w-full" value={val} onChange={(e) => setLogisticsDetails({...logisticsDetails, [key]: e.target.value})} /> 
                      : <span className="font-medium text-slate-800 text-sm">{val}</span>
                    }
                </div>
             ))}
          </div>

          {/* ADDRESS BLOCKS */}
          <div className="p-8 md:p-12 grid grid-cols-2 gap-12">
            {[billTo, shipTo].map((addr, idx) => (
               <div key={idx}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">{idx === 0 ? 'Bill To' : 'Ship To'}</h3>
                  <div className="text-sm">
                    {isEditing ? (
                      <div className="space-y-2">
                <input className="w-full border p-2 rounded font-bold text-sm" value={addr.name} onChange={(e) => idx === 0 ? setBillTo({...billTo, name: e.target.value}) : setShipTo({...shipTo, name: e.target.value})} placeholder="Company Name" />
                <textarea className="w-full border p-2 rounded h-20 text-sm" value={addr.address} onChange={(e) => idx === 0 ? setBillTo({...billTo, address: e.target.value}) : setShipTo({...shipTo, address: e.target.value})} placeholder="Address" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <input className="w-full sm:w-auto flex-1 border p-2" value={addr.city} onChange={(e) => idx === 0 ? setBillTo({...billTo, city: e.target.value}) : setShipTo({...shipTo, city: e.target.value})} placeholder="City" />
                  <input className="w-28 border p-2" value={addr.state} onChange={(e) => idx === 0 ? setBillTo({...billTo, state: e.target.value}) : setShipTo({...shipTo, state: e.target.value})} placeholder="State" />
                </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-bold text-slate-900 text-lg">{addr.name}</p>
                        <p className="text-gray-600 mt-1 whitespace-pre-line">{addr.address}</p>
                        <p className="text-gray-600">{addr.city}, {addr.state} {addr.zip}</p>
                      </>
                    )}
                  </div>
               </div>
            ))}
          </div>

          {/* TABLE */}
          <div className="px-8 md:px-12">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-800">
                  <th className="py-3 font-bold uppercase w-12">#</th>
                  <th className="py-3 font-bold uppercase">Description</th>
                  <th className="py-3 font-bold uppercase text-center">Qty</th>
                  {activeTab === 'packing-list' && (
                     <>
                        <th className="py-3 font-bold uppercase text-right">Unit Kg</th>
                        <th className="py-3 font-bold uppercase text-right">Dims (cm)</th>
                        <th className="py-3 font-bold uppercase text-right">Total Kg</th>
                     </>
                  )}
                  {activeTab === 'invoice' && (
                     <>
                        <th className="py-3 font-bold uppercase text-right">Price</th>
                        <th className="py-3 font-bold uppercase text-right">Total</th>
                     </>
                  )}
                  {isEditing && <th className="py-3 w-8 print:hidden"></th>}
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm md:text-base">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={tableColCount} className="py-8 text-center text-gray-500">
                      No items yet — tap "Add Item" to create your first line. Use the Add Item button below (mobile: full-width).
                    </td>
                  </tr>
                )}

                {items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 print:hover:bg-transparent">
                    <td className="py-4 font-mono text-gray-400">{index + 1}</td>
                    <td className="py-4">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input className="w-full p-2 text-sm md:text-sm font-bold border rounded outline-none" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="Description" />
                          <input className="w-full p-2 text-xs md:text-sm font-mono text-gray-500 border rounded outline-none" value={item.sku} placeholder="SKU" onChange={(e) => updateItem(item.id, 'sku', e.target.value)} />
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-slate-800">{item.description}</p>
                          <p className="font-mono text-xs text-gray-500">{item.sku}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      {isEditing ? <input type="number" className="w-20 md:w-16 p-2 text-center border rounded" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} /> : <span className="font-medium">{item.quantity}</span>}
                    </td>

                    {/* DYNAMIC COLUMNS */}
                    {activeTab === 'packing-list' ? (
                       <>
                         <td className="py-4 text-right">{isEditing ? <input type="number" className="w-20 md:w-16 p-2 text-right border rounded" value={item.weight} onChange={(e) => updateItem(item.id, 'weight', Number(e.target.value))} /> : item.weight}</td>
                         <td className="py-4 text-right font-mono text-xs">
                           {isEditing ? 
                             <div className="flex flex-col items-end gap-1">
                                <input className="w-14 md:w-8 p-2 border text-right" value={item.dimL} onChange={(e) => updateItem(item.id, 'dimL', Number(e.target.value))} />
                                <input className="w-14 md:w-8 p-2 border text-right" value={item.dimW} onChange={(e) => updateItem(item.id, 'dimW', Number(e.target.value))} />
                                <input className="w-14 md:w-8 p-2 border text-right" value={item.dimH} onChange={(e) => updateItem(item.id, 'dimH', Number(e.target.value))} />
                             </div>
                             : `${item.dimL}x${item.dimW}x${item.dimH}`
                           }
                         </td>
                         <td className="py-4 text-right font-bold text-slate-800">{(item.weight * item.quantity).toFixed(2)}</td>
                       </>
                    ) : (
                       <>
                         <td className="py-4 text-right">{isEditing ? <input type="number" className="w-24 md:w-20 p-2 text-right border rounded" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))} /> : <span>${item.unitPrice.toFixed(2)}</span>}</td>
                         <td className="py-4 text-right font-bold text-slate-800">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                       </>
                    )}

                    {isEditing && (
                      <td className="py-4 text-center print:hidden">
                        <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {isEditing && (
              <button onClick={addItem} className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium print:hidden w-full md:w-auto justify-center md:justify-start px-3 py-2">
                <Plus className="w-4 h-4" /> <span className="ml-1">Add Item</span>
              </button>
            )}
          </div>

          {/* FOOTER TOTALS */}
          <div className="px-8 md:px-12 mt-8 pb-12 flex justify-end">
            <div className="w-full md:w-1/2 lg:w-1/3">
              {activeTab === 'packing-list' ? (
                <div className="bg-slate-50 p-6 rounded-lg space-y-2 text-sm">
                   <div className="flex justify-between"><span>Total Pkgs:</span><span className="font-bold">{items.length}</span></div>
                   <div className="flex justify-between"><span>Total Units:</span><span className="font-bold">{totalItems}</span></div>
                   <div className="flex justify-between"><span>Volume:</span><span className="font-bold">{totalVolume.toFixed(3)} m³</span></div>
                   <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-bold text-slate-800"><span>Gross Wgt:</span><span>{totalWeight.toFixed(2)} kg</span></div>
                </div>
              ) : (
                <div className="space-y-2 text-right">
                   <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                   <div className="flex justify-between text-sm text-gray-600"><span>Tax ({invoiceDetails.taxRate}%)</span><span>${taxAmount.toFixed(2)}</span></div>
                   <div className="flex justify-between text-xl font-bold text-slate-900 pt-4 border-t-2 border-slate-900 mt-2"><span>Total</span><span>${totalAmount.toFixed(2)}</span></div>
                </div>
              )}
            </div>
          </div>
          
          {/* DOCUMENT FOOTER */}
          <div className="absolute bottom-0 w-full px-12 py-8 border-t border-gray-100 bg-gray-50 print:bg-white text-center text-xs text-gray-400 invoice-footer">
             <div className="flex justify-center gap-8 mb-4">
                 <span>Incoterms: {logisticsDetails.incoterms}</span>
                 <span>Container: {logisticsDetails.containerNo}</span>
             </div>
             <p>Thank you for choosing Octaship Logistics. All business undertaken subject to our Standard Trading Conditions.</p>
             <p className="mt-1">No Signature Required unless specified.</p>
          </div>

        </div>
      </main>
    </div>
  );
}