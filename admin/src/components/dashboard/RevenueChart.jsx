import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const RevenueChart = ({ chartData }) => {
  // Keeping options here since they are strictly for UI formatting
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // This is crucial to allow Tailwind to control the height
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#171410',
        titleFont: { family: 'Inter', size: 11 },
        bodyFont: { family: 'Inter', size: 13, weight: 'bold' },
        padding: 12,
        cornerRadius: 6,
        displayColors: false, 
        callbacks: {
          label: function(context) {
            // Format with Indian Rupee system
            return '₹' + context.parsed.y.toLocaleString('en-IN');
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { font: { family: 'Inter', size: 10 }, color: '#171410', padding: 10 }
      },
      y: {
        grid: { color: 'rgba(23, 20, 16, 0.05)', drawBorder: false }, 
        ticks: { 
          font: { family: 'Inter', size: 10 }, 
          color: '#171410', 
          callback: (value) => '₹' + (value / 1000) + 'k', 
          padding: 10
        }
      }
    },
    interaction: { mode: 'index', intersect: false },
  };

  if (!chartData) return null;

  return (
    <div className="chart-container invisible">
      <div className="flex justify-between items-center mb-4 md:mb-6 px-1 lg:px-2">
        {/* Responsive header size */}
        <h2 className="head-font text-xl md:text-2xl txt-dark tracking-tight">Revenue Trajectory</h2>
      </div>
      
      {/* Fluid height scaling based on screen size, and responsive padding */}
      <div className="w-full h-[280px] sm:h-[320px] lg:h-[380px] 2xl:h-[450px] bg-white border border-[var(--dark)]/5 rounded-lg p-4 md:p-6 shadow-sm">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default RevenueChart;