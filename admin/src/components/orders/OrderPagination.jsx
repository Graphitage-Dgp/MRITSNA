import React from "react";

const OrderPagination = ({ currentPage, totalPages, totalOrders, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between bg-white px-4 py-8 mt-4">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-gray-400 tracking-wider uppercase">
            Showing <span className="font-medium text-gray-900">{currentPage}</span> of{" "}
            <span className="font-medium text-gray-900">{totalPages}</span> 
            {" "}— {totalOrders} Orders
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex space-x-6" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="text-xs uppercase tracking-widest text-gray-500 hover:text-black transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              &larr; Prev
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="text-xs uppercase tracking-widest text-gray-500 hover:text-black transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next &rarr;
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default OrderPagination;