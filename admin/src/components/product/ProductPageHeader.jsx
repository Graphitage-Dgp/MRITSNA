import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const ProductPageHeader = ({ title, description, actionLabel, actionLink, actionIcon }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      {actionLink && actionLabel && (
        <Link 
          to={actionLink}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
        >
          {actionIcon && <Icon icon={actionIcon} width="18" />}
          <span>{actionLabel}</span>
        </Link>
      )}
    </div>
  );
};

export default ProductPageHeader;