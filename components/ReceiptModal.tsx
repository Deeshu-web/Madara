
import React, { useRef } from 'react';
import { formatCurrency } from '../utils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    member: any;
    committeeYear: number;
    month: string;
    amount: number;
    interest: number;
    date: string;
    method?: string;
    pending?: number;
    arrears?: number;
  };
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const downloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await (window as any).html2canvas(receiptRef.current, {
        scale: 4,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `JMD_Receipt_${data.member.name}_${data.month.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("Error generating image. Please try again.");
    }
  };

  const shareOnWhatsapp = async () => {
    await downloadReceipt();
    const text = encodeURIComponent(`*JAI MATA DI*\n\nDigital Receipt ✅\n\n*Member:* ${data.member.name}\n*Month:* ${data.month}\n*Amount Paid:* ${formatCurrency(data.amount)}\n*Mode:* ${data.method || 'Cash'}\n${data.pending && data.pending > 0 ? `*Next Pending:* ${formatCurrency(data.pending)}` : '*Status:* CLEAR'}\n\n_Keep this for your records._`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] shadow-[0_32px_120px_rgba(0,0,0,0.4)] w-full max-w-4xl overflow-hidden flex flex-col border border-white/20">
        
        <div ref={receiptRef} className="bg-white p-0 overflow-hidden relative border-8 border-white min-w-[800px]">
          <div className="bg-indigo-900 h-3 w-full"></div>
          
          <div className="p-12 relative">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none overflow-hidden">
               <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
                 <i className="fas fa-om text-[30rem]"></i>
               </div>
               <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
                 <i className="fas fa-om text-[20rem]"></i>
               </div>
            </div>

            <div className="flex justify-between items-center mb-10 relative z-10 border-b border-slate-100 pb-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white text-indigo-950 rounded-full flex items-center justify-center shadow-2xl border-4 border-indigo-50">
                  <i className="fas fa-om text-4xl"></i>
                </div>
                <div className="text-left">
                  <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none uppercase">JAI MATA DI</h1>
                  <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase mt-2">Committee Management Trust</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl inline-block shadow-lg">
                  <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mb-1">Receipt ID</p>
                  <p className="text-sm font-black tracking-widest leading-none">#{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-10 relative z-10 items-stretch">
              
              <div className="col-span-2 space-y-6 flex flex-col">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Member Details</p>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-1">{data.member.name}</h3>
                    <p className="text-xs font-bold text-indigo-600">ID Number: #{data.member.id}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Batch {data.committeeYear}</p>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-center gap-4">
                   <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-sm text-xl">
                      {data.method === 'Cash' ? <i className="fas fa-money-bill-wave"></i> : data.method === 'Online' ? <i className="fas fa-mobile-screen-button"></i> : <i className="fas fa-building-columns"></i>}
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Paid Via</p>
                      <p className="text-base font-black text-slate-800 uppercase">{data.method || 'Cash'}</p>
                   </div>
                </div>
              </div>

              <div className="col-span-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Payment Breakdown</p>
                <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40 font-bold uppercase tracking-widest">Bill Period</span>
                      <span className="font-black text-indigo-300">{data.month}</span>
                    </div>
                    {data.arrears && data.arrears > 0 ? (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40 font-bold uppercase tracking-widest">Previous Dues (Arrears)</span>
                        <span className="font-black text-rose-400">+{formatCurrency(data.arrears)}</span>
                      </div>
                    ) : null}
                    {data.interest > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40 font-bold uppercase tracking-widest">Late Interest Charge</span>
                        <span className="font-black text-amber-400">+{formatCurrency(data.interest)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3">
                      <span className="text-white/40 font-bold uppercase tracking-widest">Remaining Pending (Baki)</span>
                      <span className={`font-black ${data.pending && data.pending > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {data.pending && data.pending > 0 ? formatCurrency(data.pending) : 'CLEAR'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 italic">Current Amount Received</p>
                      <p className="text-5xl font-black tracking-tighter">{formatCurrency(data.amount)}</p>
                    </div>
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                      <i className="fas fa-stamp text-emerald-400 text-3xl"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-slate-100 flex justify-between items-end relative z-10">
              <div className="max-w-xs">
                <p className="text-[9px] font-bold text-slate-300 uppercase leading-relaxed tracking-widest">
                  Verified Digital Document • JAI MATA DI<br/>
                  Transaction Date: {data.date}<br/>
                  This record is permanent and non-modifiable.
                </p>
              </div>

              <div className="flex flex-col items-end relative min-w-[200px]">
                <div className="relative mb-4">
                   <div className="absolute -top-16 -left-20 w-36 h-36 flex items-center justify-center opacity-90 pointer-events-none transform -rotate-6">
                      <div className="border-4 border-indigo-600/40 rounded-full w-full h-full flex flex-col items-center justify-center p-2 text-center">
                         <div className="border-2 border-indigo-600/30 rounded-full w-full h-full flex flex-col items-center justify-center">
                            <p className="text-[9px] font-black text-indigo-600/60 uppercase leading-none tracking-tighter">Authorized</p>
                            <p className="text-sm font-black text-indigo-700 leading-tight uppercase tracking-widest my-1">Bhola Yadav</p>
                            <p className="text-[7px] font-black text-indigo-600/50 uppercase tracking-widest">JMD Control</p>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="w-48 h-[1px] bg-slate-200"></div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 pr-4">Authorized Seal</p>
              </div>
            </div>
          </div>
          <div className="bg-indigo-900 h-3 w-full"></div>
        </div>

        <div className="p-8 bg-slate-950 flex flex-col md:flex-row gap-4">
          <button 
            onClick={shareOnWhatsapp}
            className="flex-1 py-5 bg-emerald-600 text-white text-xs font-black rounded-[1.5rem] flex items-center justify-center gap-4 shadow-xl hover:bg-emerald-500 transition-all uppercase tracking-widest"
          >
            <i className="fab fa-whatsapp text-2xl"></i> SHARE RECEIPT
          </button>
          <div className="flex gap-4 flex-1">
            <button 
              onClick={downloadReceipt}
              className="flex-[2] py-5 bg-white/10 text-white text-[11px] font-black rounded-[1.5rem] flex items-center justify-center gap-4 hover:bg-white/20 transition-all uppercase tracking-widest border border-white/5"
            >
              <i className="fas fa-download text-xl"></i> DOWNLOAD IMAGE
            </button>
            <button onClick={onClose} className="flex-1 py-5 text-white/30 text-[11px] font-black uppercase tracking-widest hover:text-white transition-colors border border-white/5 rounded-[1.5rem]">CLOSE</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
