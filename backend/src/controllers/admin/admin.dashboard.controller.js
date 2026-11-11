import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import Visit from "../../models/visit.model.js";

// Helper function to format currency for the frontend UI
const formatCurrency = (amount) => {
  return `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;
};

// Helper function to format dates as "Today, 10:42 AM" or "Yesterday"
const formatRelativeDate = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diffInDays = Math.floor((now.setHours(0,0,0,0) - new Date(d).setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
  
  const timeString = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (diffInDays === 0) return `Today, ${timeString}`;
  if (diffInDays === 1) return `Yesterday`;
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Establish the "Micro" Date Range
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const start = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      start.setDate(start.getDate() - 30);
    }
    start.setHours(0, 0, 0, 0);

    // Establish the "Macro" Date Range
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const isSingleYear = startYear === endYear;
    
    let chartStart, chartEnd;
    if (isSingleYear) {
      chartStart = new Date(endYear, 0, 1);
      chartEnd = new Date(endYear, 11, 31, 23, 59, 59, 999);
    } else {
      chartStart = new Date(start);
      chartEnd = new Date(end);
    }

    // Execute all 5 queries concurrently
    const [kpiResults, chartResults, topProductsResults, recentOrdersResults, trafficResults] = await Promise.all([
      
      // QUERY A: Global KPIs
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { 
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            successfulOrders: {
              $sum: {
                $cond: [
                  { $in: ["$paymentStatus", ["Completed", "Partially Paid"]] },
                  1, 
                  0
                ]
              }
            },
            activeOrders: {
              $sum: {
                $cond: [
                  { $in: ["$orderStatus", ["Pending", "Confirmed", "Processing", "Shipped"]] },
                  1, 
                  0
                ]
              }
            },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $in: ["$paymentStatus", ["Completed", "Partially Paid"]] },
                  { $add: [{ $subtract: ["$subTotal", "$discountAmount"] }, "$shippingCost"] },
                  0
                ]
              }
            }
          }
        }
      ]),

      // Revenue Trajectory
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: chartStart, $lte: chartEnd },
            paymentStatus: { $in: ["Completed", "Partially Paid"] }
          } 
        },
        { 
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            revenue: { $sum: { $add: [{ $subtract: ["$subTotal", "$discountAmount"] }, "$shippingCost"] } }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),

      // Top Performing Pieces
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: start, $lte: end },
            paymentStatus: { $in: ["Completed", "Partially Paid"] }
          } 
        },
        { $unwind: "$items" },
        { 
          $group: {
            _id: "$items.product",
            name: { $first: "$items.title" },
            sold: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.itemTotal" },
            image: { $first: "$items.img" } 
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 4 },
        { 
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productData"
          }
        },
        { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
        { 
          $project: {
            name: 1,
            sold: 1,
            revenue: 1,
            image: 1, 
            category: { $ifNull: ["$productData.category", "Uncategorized"] }
          }
        }
      ]),

      // Latest Dispatches 
      Order.find({ 
        createdAt: { $gte: start, $lte: end },
        orderStatus: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] },
        paymentStatus: { $in: ['Completed', 'Partially Paid'] }
      })
      .sort({ createdAt: -1 })
      .limit(4)
      .select('_id orderNumber shippingAddress createdAt subTotal discountAmount shippingCost orderStatus'),

      // QUERY E: Real Traffic Analytics 
      Visit.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: "$channel", count: { $sum: 1 } } },
        { $sort: { count: -1 } } 
      ])
    ]);

    // Process KPI Data (Added fallback for successfulOrders)
    const kpiData = kpiResults[0] || { totalRevenue: 0, activeOrders: 0, totalOrders: 0, successfulOrders: 0 };
    
    // Sum up all exact visits found in the database
    const uniqueVisitors = trafficResults.reduce((acc, curr) => acc + curr.count, 0);
    
    // THE FIX: Accurate, un-capped math (Successful Transactions / Unique Visitors)
    let conversionRate = 0;
    if (uniqueVisitors > 0) {
      conversionRate = Number(((kpiData.successfulOrders / uniqueVisitors) * 100).toFixed(1));
    }

    // Process Chart Data
    const chartLabels = [];
    const chartDataValues = [];
    
    if (isSingleYear) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyRevenue = Array(12).fill(0);
      
      chartResults.forEach(item => {
        monthlyRevenue[item._id.month - 1] = item.revenue; 
      });
      
      chartLabels.push(...monthNames);
      chartDataValues.push(...monthlyRevenue);
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      chartResults.forEach(item => {
        chartLabels.push(`${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(-2)}`);
        chartDataValues.push(item.revenue);
      });
    }

    // Process Top Products Mapping
    const topProducts = topProductsResults.map(prod => ({
      name: prod.name,
      category: prod.category,
      sold: prod.sold,
      revenue: formatCurrency(prod.revenue),
      image: prod.image 
    }));

    // Process Recent Orders Mapping
    const recentOrders = recentOrdersResults.map(order => {
      const grandTotal = (order.subTotal || 0) - (order.discountAmount || 0) + (order.shippingCost || 0);
      return {
        _id: order._id, 
        id: order.orderNumber, 
        customer: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        date: formatRelativeDate(order.createdAt),
        amount: formatCurrency(grandTotal),
        status: order.orderStatus
      };
    });

    // Dynamic Traffic Channels Mapping 
    const opacities = ["bg-[var(--dark)]", "bg-[var(--dark)]/80", "bg-[var(--dark)]/60", "bg-[var(--dark)]/40", "bg-[var(--dark)]/20"];
    
    let trafficSources = trafficResults.map((source, index) => ({
      label: source._id,
      percentage: Math.round((source.count / uniqueVisitors) * 100),
      color: opacities[index] || "bg-[var(--dark)]/10"
    })).slice(0, 5); 
    
    if (trafficSources.length === 0) {
      trafficSources = [{ label: "No Traffic Data", percentage: 0, color: "bg-[var(--dark)]/10" }];
    }

    // Send Response
    return res.status(200).json({
      success: true,
      data: {
        kpis: [
          { label: "Total Revenue", value: kpiData.totalRevenue, prefix: "₹", icon: "lucide:indian-rupee" },
          { label: "Active Orders", value: kpiData.activeOrders, icon: "solar:box-minimalistic-linear" },
          { label: "Conversion Rate", value: conversionRate, suffix: "%", icon: "lucide:trending-up" },
          { label: "Unique Visitors", value: uniqueVisitors, icon: "solar:users-group-rounded-linear" }
        ],
        chart: {
          labels: chartLabels,
          datasets: [{ data: chartDataValues }]
        },
        topProducts,
        recentOrders,
        trafficSources
      }
    });

  } catch (error) {
    console.error("[Dashboard Stats Error]:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while compiling dashboard statistics."
    });
  }
};