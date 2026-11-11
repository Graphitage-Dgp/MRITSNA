import React, { useRef, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"; 
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// --- Import Child Components ---
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import KPIGrid from "../../components/dashboard/KPIGrid";
import RevenueChart from "../../components/dashboard/RevenueChart";
import TopProductsList from "../../components/dashboard/TopProductsList";
import RecentDispatches from "../../components/dashboard/RecentDispatches";
import AcquisitionChannels from "../../components/dashboard/AcquisitionChannels";
import UTMLinkGenerator from "../../components/dashboard/UTMLinkGenerator"; 

// --- Import Redux Thunks & Actions ---
import { fetchDashboardStats, clearDashboardData } from "../../store/slices/dashboardSlice";

const Dashboard = () => {
  const containerRef = useRef(null);
  const hasAnimatedLayout = useRef(false); 
  
  const dispatch = useDispatch();
  const { admin } = useSelector((state) => state.auth);

  // --- Pull Live Data from Redux ---
  const { 
    kpis, 
    chart, 
    topProducts, 
    recentOrders, 
    trafficSources, 
    isLoading 
  } = useSelector((state) => state.adminDashboard);

  // --- Date Range State with Session Storage Memory ---
  const [dateRange, setDateRange] = useState(() => {
    const savedDates = sessionStorage.getItem("dashboardDateRange");
    if (savedDates) {
      return JSON.parse(savedDates);
    }
    return {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    };
  });

  // Fetch data whenever dateRange changes
  useEffect(() => {
    sessionStorage.setItem("dashboardDateRange", JSON.stringify(dateRange));
    dispatch(fetchDashboardStats(dateRange)); 
  }, [dateRange, dispatch]);

  // Cleanup function to wipe Redux data when leaving the page
  useEffect(() => {
    return () => {
      dispatch(clearDashboardData());
    };
  }, [dispatch]);

  const handleDateChange = (type, value) => {
    if (!value) return; 
    setDateRange(prev => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: value
    }));
  };

  // --- Inject Brand Styling into Backend Chart Data ---
  const styledChartData = chart ? {
    labels: chart.labels,
    datasets: [
      {
        label: 'Revenue',
        data: chart.datasets[0].data,
        borderColor: '#7e7053',
        backgroundColor: 'rgba(126, 112, 83, 0.15)',
        borderWidth: 2,
        tension: 0.4, 
        fill: true,
        pointBackgroundColor: '#171410', 
        pointBorderColor: '#f8f8f8', 
        pointHoverRadius: 6,
        pointRadius: 0, 
        pointHitRadius: 20,
      }
    ]
  } : null;

  useGSAP(() => {
    if (!chart || kpis.length === 0) return;

    // --- STRUCTURAL LAYOUT (Runs ONLY ONCE per page visit) ---
    if (!hasAnimatedLayout.current) {
      // 1. Header
      gsap.fromTo(".dash-header", 
        { y: 30, autoAlpha: 0 }, 
        { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }
      );
      // 2. KPI Cards
      gsap.fromTo(".kpi-card", 
        { y: 30, autoAlpha: 0 }, 
        { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, delay: 0.1, ease: "power3.out" }
      );
      // 3. All Main Containers 
      gsap.fromTo([
        ".chart-container", 
        ".top-products-container", 
        ".orders-container", 
        ".traffic-container",
        ".link-generator-container" // <-- Back to the end of the animation sequence
      ], 
        { y: 30, autoAlpha: 0 }, 
        { y: 0, autoAlpha: 1, duration: 0.8, delay: 0.2, stagger: 0.1, ease: "power3.out" }
      );

      hasAnimatedLayout.current = true;
    }

    // --- DATA ANIMATIONS (Runs EVERY TIME data changes) ---
    
    // 1. The Row Refresh Animation
    gsap.fromTo([".top-product-row", ".table-row", ".traffic-row"], 
      { x: -15, autoAlpha: 0 }, 
      { x: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: "power3.out" }
    );
    
    // 2. Progress Bar Fill
    gsap.fromTo(".progress-bar-fill", 
      { width: "0%" }, 
      { width: (i, el) => el.dataset.width, duration: 1.5, ease: "power3.out" }
    );

    // 3. Number tickers
    gsap.utils.toArray(".kpi-value", containerRef.current).forEach((el, index) => {
      if (!kpis[index]) return; 

      const targetValue = kpis[index].value;
      const isDecimal = targetValue % 1 !== 0;
      const proxy = { val: 0 }; 
      
      gsap.to(proxy, { 
        val: targetValue, 
        duration: 2, 
        ease: "power3.out",
        delay: 0.1 + (index * 0.1),
        onUpdate: () => {
          el.innerText = isDecimal 
            ? proxy.val.toFixed(1)
            : Math.floor(proxy.val).toLocaleString('en-IN'); 
        }
      });
    });

  }, { scope: containerRef, dependencies: [chart, kpis] }); 

  // --- Safe Fallback Loading State ---
  if (!chart || kpis.length === 0) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[var(--dark)] border-t-transparent rounded-full animate-spin opacity-50"></div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
    >
      <DashboardHeader 
        admin={admin} 
        startDate={dateRange.startDate} 
        endDate={dateRange.endDate} 
        onDateChange={handleDateChange} 
      />

      <KPIGrid kpiData={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 xl:gap-12 pb-12">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-6 lg:gap-8 xl:gap-12">
          <RevenueChart chartData={styledChartData} />
          <TopProductsList topProducts={topProducts} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 flex flex-col gap-6 lg:gap-8 xl:gap-12">
          <RecentDispatches recentOrders={recentOrders} />
          <AcquisitionChannels trafficSources={trafficSources} />
          <UTMLinkGenerator /> {/* <-- Moved back here! */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;