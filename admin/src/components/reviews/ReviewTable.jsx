import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

const ReviewTable = ({ summaryList, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="w-full bg-white p-12 flex flex-col items-center justify-center border border-black/5">
        <Icon icon="ph:spinner-gap-bold" className="animate-spin text-gray-300 mb-4" width="32" />
        <p className="text-[11px] text-gray-400 uppercase tracking-widest">Loading Records...</p>
      </div>
    );
  }

  if (!summaryList || summaryList.length === 0) {
    return (
      <div className="w-full bg-white p-16 flex flex-col items-center justify-center border border-black/5">
        <Icon icon="ph:chat-teardrop-light" className="text-gray-200 mb-4" width="48" />
        <p className="text-[11px] text-gray-500 uppercase tracking-widest">No reviews found in the system</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white border border-black/5">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-black/5 bg-[#f8f8f8]">
            <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-2/5">Product</th>
            <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Total Reviews</th>
            <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Pending Approval</th>
            <th className="p-5 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {summaryList.map((item) => (
            <tr 
              key={item.productId} 
              className="group hover:bg-[#f8f8f8]/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/admin/reviews/${item.productId}`)}
            >
              <td className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 border border-black/5 overflow-hidden flex-shrink-0">
                    {item.productImg ? (
                      <img 
                        src={`${item.productImg}?tr=w-100,h-100,q-80`} 
                        alt={item.productName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Icon icon="ph:image-light" width="20" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#1a1a1a] group-hover:text-black transition-colors">
                      {item.productName}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">ID: {item.productId.slice(-6)}</p>
                  </div>
                </div>
              </td>
              
              <td className="p-5 text-center">
                <span className="text-sm font-light text-gray-600">{item.totalReviews}</span>
              </td>
              
              <td className="p-5 text-center">
                {item.totalPending > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-orange-50 text-orange-600 text-[11px] font-bold rounded-full border border-orange-100">
                    {item.totalPending}
                  </span>
                ) : (
                  <span className="text-sm font-light text-gray-300">-</span>
                )}
              </td>
              
              <td className="p-5 text-right">
                <button className="text-[11px] font-bold uppercase tracking-widest text-[#796c52] hover:text-black transition-colors flex items-center justify-end gap-1.5 ml-auto">
                  Manage <Icon icon="ph:arrow-right" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewTable;