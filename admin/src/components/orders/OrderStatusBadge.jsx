import React from "react";

const OrderStatusBadge = ({ status }) => {
  const getStatusStyles = (status) => {
    switch (status) {
      case "Pending":
        return "bg-[#FDFBF7] text-[#8C6D46] border border-[#E8DCCB]";
      case "Confirmed":
        return "bg-[#F4F7F9] text-[#4A6984] border border-[#D1DFEB]";
      case "Processing":
        return "bg-[#F8F5FA] text-[#6B4E82] border border-[#E3D5ED]";
      case "Shipped":
        return "bg-[#F5F8F6] text-[#4E7A64] border border-[#D0E3D9]";
      case "Delivered":
        return "bg-[#F4F9F5] text-[#3D714C] border border-[#CDE5D5]";
      case "Cancelled":
      case "Returned":
        return "bg-[#FCF5F5] text-[#9E4646] border border-[#F0D6D6]";
      default:
        return "bg-gray-50 text-gray-500 border border-gray-200";
    }
  };

  return (
    <span
      className={`px-3 py-1 inline-flex text-[10px] uppercase tracking-wider font-medium rounded-sm ${getStatusStyles(
        status
      )}`}
    >
      {status}
    </span>
  );
};

export default OrderStatusBadge;