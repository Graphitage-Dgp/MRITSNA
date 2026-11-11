import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminOrders, exportAdminOrders, clearOrderErrors } from "../../store/slices/orderSlice";
import OrderTable from "../../components/orders/OrderTable";
import OrderPagination from "../../components/orders/OrderPagination";
import CustomSelect from "../../components/orders/CustomSelect"; 
import toast from "react-hot-toast";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const downloadCSV = (data, filename) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), 
    ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName] ?? "")).join(",")) 
  ].join("\r\n");

  const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const Orders = () => {
  const dispatch = useDispatch();
  const headerRef = useRef(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [filters, setFilters] = useState({
    search: "",
    currency: "ALL",
    startDate: "",
    endDate: ""
  });

  const regionOptions = [
    { value: "ALL", label: "All Regions" },
    { value: "DOMESTIC", label: "Domestic (INR)" },
    { value: "INTERNATIONAL", label: "International Exports" },
    { value: "USD", label: "USD Only" },
    { value: "EUR", label: "EUR Only" }
  ];

  const { orders, pagination, loading, exportLoading, error, actionError } = useSelector((state) => state.adminOrders);

  useGSAP(() => {
    gsap.fromTo(
      ".animate-element",
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    );
  }, { scope: headerRef });

  useEffect(() => {
    dispatch(fetchAdminOrders({ 
      page: currentPage, 
      limit: itemsPerPage, 
      ...filters 
    }));
    return () => { dispatch(clearOrderErrors()); };
  }, [dispatch, currentPage, filters]);

  useEffect(() => {
    const activeError = error || actionError;
    if (activeError) {
      toast.error(activeError, {
        style: {
          background: '#1A1A1A', color: '#fff', fontSize: '13px', letterSpacing: '0.05em', borderRadius: '2px', padding: '12px 20px',
        },
        iconTheme: { primary: '#ff4b4b', secondary: '#fff' },
      });
      dispatch(clearOrderErrors());
    }
  }, [error, actionError, dispatch]);

  const handlePageChange = (newPage) => setCurrentPage(newPage);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); 
  };

  const clearFilters = () => {
    setFilters({ search: "", currency: "ALL", startDate: "", endDate: "" });
    setCurrentPage(1);
  };

  const executeExport = async (toastId, exportType) => {
    toast.dismiss(toastId);
    
    const loadingToastId = toast.loading(`Compiling ${exportType === 'profit' ? 'Profit' : 'All'} Data...`, {
       style: { background: '#1A1A1A', color: '#fff', fontSize: '12px', borderRadius: '2px' }
    });

    try {
      const result = await dispatch(exportAdminOrders({ exportType, ...filters })).unwrap();
      
      if (result.data && result.data.length > 0) {
        const finalExportData = [...result.data];

        const totalTax = finalExportData.reduce((sum, row) => sum + (Number(row["Total Tax Amount"]) || 0), 0);
        const totalProfit = finalExportData.reduce((sum, row) => sum + (Number(row["Profit (Base Revenue)"]) || 0), 0);
        const totalGrand = finalExportData.reduce((sum, row) => sum + (Number(row["Grand Total"]) || 0), 0);

        finalExportData.push({
          "Order Number": "GRAND TOTAL",
          "Date": "",
          "Customer Name": "",
          "Customer Email": "",
          "Payment Status": "",
          "Order Status": "",
          "Currency": "",
          "Grand Total": totalGrand,
          "Total Tax Amount": totalTax,
          "Profit (Base Revenue)": totalProfit,
          "Courier Partner": "",
          "Tracking Number": ""
        });

        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `Export_${exportType.toUpperCase()}_Orders_${timestamp}.csv`;
        
        downloadCSV(finalExportData, filename);
        toast.success(`Successfully exported ${result.count} records.`, { id: loadingToastId });
      } else {
        toast.error("No data found matching current filters.", { id: loadingToastId });
      }
    } catch (err) {
      toast.error("Export failed.", { id: loadingToastId });
    }
  };

  const handleBulkExportConfirm = () => {
    toast((t) => (
      <>
        {createPortal(
          <div 
            className={`fixed inset-0 z-[9998] bg-black/10 transition-all duration-300 ${
              t.visible ? "opacity-100 backdrop-blur-sm pointer-events-auto" : "opacity-0 backdrop-blur-none pointer-events-none"
            }`}
            onClick={() => toast.dismiss(t.id)}
          />,
          document.body
        )}
        
        <div className="relative z-[9999] flex flex-col gap-6 p-8 min-w-[340px] bg-white border border-gray-100 shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
          <div>
            <h3 className="text-[13px] font-semibold text-black tracking-widest uppercase mb-2">Export Order Data</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
              Choose export type. Current filters will apply.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            <button 
              onClick={() => executeExport(t.id, 'profit')} 
              className="w-full py-4 bg-[#F4F9F5] text-[#2E583A] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#E8F2EC] transition-colors flex items-center justify-center gap-3"
            >
               Export Profit Data
            </button>
            <button 
              onClick={() => executeExport(t.id, 'all')} 
              className="w-full py-4 bg-black text-white text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-gray-800 transition-colors flex items-center justify-center gap-3"
            >
               Export All Matches
            </button>
            <button 
              onClick={() => toast.dismiss(t.id)} 
              className="w-full py-3 text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] hover:text-black transition-colors mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </>
    ), {
      id: 'export-confirmation-modal',
      duration: Infinity, 
      style: { background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }
    });
  };

  return (
    <div className="w-full bg-[#f8f8f8] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6" ref={headerRef}>
        
        {/* Header Section Container */}
        <div className="animate-element bg-white p-8 md:p-10 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-[0.15em] uppercase mb-2 text-black">
              Orders Management
            </h1>
            <p className="mt-1 text-xs text-gray-400 tracking-widest uppercase font-medium">
              View, fulfill, and analyze your global logistics
            </p>
          </div>

          <div className="relative z-10">
            <button 
              onClick={handleBulkExportConfirm}
              disabled={exportLoading || loading}
              className="bg-black text-white px-8 py-3.5 hover:bg-gray-800 transition-colors duration-300 disabled:opacity-50 text-[10px] font-bold uppercase tracking-[0.15em]"
            >
              {exportLoading ? "Processing..." : "Export CSV"}
            </button>
          </div>
        </div>

        {/* Minimalist Metrics Container */}
        <div className="animate-element bg-white p-8 md:p-10 border border-gray-100 flex flex-wrap gap-16">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">Total Volume</p>
            <h3 className="text-4xl font-light text-black tracking-tight">{pagination?.totalOrders || 0}</h3>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#4E7A64] mb-2">Successful</p>
            <h3 className="text-4xl font-light text-[#2E583A] tracking-tight">{pagination?.successfulOrders || 0}</h3>
          </div>
        </div>

        {/* Minimalist Filter Bar Container */}
        <div className="animate-element bg-white p-8 md:p-10 border border-gray-100 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 items-end relative z-30">
          
          <div className="lg:col-span-2 relative z-10">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Search</label>
            <input 
              type="text" name="search" value={filters.search} onChange={handleFilterChange}
              placeholder="Order ID or Email Address..." 
              className="w-full bg-transparent text-sm border-b border-gray-200 py-2 text-black placeholder-gray-300 focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="relative z-50">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Region</label>
            <CustomSelect name="currency" options={regionOptions} value={filters.currency} onChange={handleFilterChange} />
          </div>

          <div className="relative z-10">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Start Date</label>
            <input 
              type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange}
              className="w-full bg-transparent text-sm border-b border-gray-200 py-2 text-black focus:outline-none focus:border-black transition-colors uppercase text-[11px] tracking-wider"
            />
          </div>

          <div className="flex gap-4 items-end relative z-10">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">End Date</label>
              <input 
                type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange}
                className="w-full bg-transparent text-sm border-b border-gray-200 py-2 text-black focus:outline-none focus:border-black transition-colors uppercase text-[11px] tracking-wider"
              />
            </div>
            
            {(filters.search || filters.currency !== "ALL" || filters.startDate || filters.endDate) && (
               <button onClick={clearFilters} className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-black transition-colors whitespace-nowrap">
                 Clear
               </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="animate-element bg-white p-4 md:p-8 border border-gray-100 relative z-10 min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-full py-20">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-t border-black rounded-full animate-spin"></div>
                <div className="absolute inset-1 border-r border-gray-300 rounded-full animate-spin reverse"></div>
              </div>
            </div>
          ) : (
            <>
              <OrderTable 
                orders={orders} 
                startIndex={(pagination.currentPage - 1) * itemsPerPage} 
              />
              
              <div className="mt-6">
                <OrderPagination 
                  currentPage={pagination.currentPage} 
                  totalPages={pagination.totalPages} 
                  totalOrders={pagination.totalOrders}
                  onPageChange={handlePageChange} 
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;