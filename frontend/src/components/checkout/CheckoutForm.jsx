import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Country, State } from 'country-state-city';
import { Icon } from '@iconify/react';

// --- PREMIUM CUSTOM DROPDOWN COMPONENT ---
const CustomSelect = ({ options, value, onChange, placeholder, disabled, searchPlaceholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    // FIX 1: Ultimate Z-Index domination when open so no other element can steal the cursor
    <div className={`relative w-full ${isOpen ? 'z-[9999]' : 'z-10'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={wrapperRef}>
      
      {/* The Trigger Input */}
      <div
        className="w-full bg-transparent border-b border-black/20 pb-2 text-sm focus:outline-none flex justify-between items-center cursor-pointer transition-colors hover:border-black"
        onClick={(e) => {
          if (!disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={selectedOption ? 'text-black' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon icon="lucide:chevron-down" className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* The Dropdown Menu with Search */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/10 rounded-lg shadow-2xl flex flex-col"
          // FIX 2: The Scroll Trap - stops mouse wheel and touch swipes from moving the background page
          onWheel={(e) => e.stopPropagation()} 
          onTouchMove={(e) => e.stopPropagation()}
        >
          {options.length > 10 && (
            <div className="p-2 border-b border-black/5 shrink-0 bg-gray-50/50 rounded-t-lg">
              <div className="flex items-center gap-2 px-3 bg-white rounded-md border border-black/10">
                <Icon icon="lucide:search" className="text-gray-400 w-3 h-3 shrink-0" />
                <input
                  type="text"
                  className="w-full bg-transparent py-2 text-xs focus:outline-none"
                  placeholder={searchPlaceholder || "Search..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()} 
                />
              </div>
            </div>
          )}
          
          {/* FIX 3: Strict overflow constraints and overscroll-none for a premium scroll feel */}
          <ul className="max-h-[250px] overflow-y-auto overscroll-none bg-white rounded-b-lg relative pointer-events-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li
                  key={opt.value}
                  className={`px-4 py-3 text-xs cursor-pointer transition-colors hover:bg-gray-100 ${value === opt.value ? 'bg-gray-100 font-bold text-black' : 'text-gray-600'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {opt.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-4 text-xs text-gray-500 text-center italic">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};


// --- MAIN CHECKOUT FORM COMPONENT ---
const CheckoutForm = ({ formData, onChange, setFormData, isGuest }) => {
  const inputClass = "w-full bg-transparent border-b border-black/20 pb-2 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-400";
  const labelClass = "block text-[0.6rem] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2";

  // --- GEOGRAPHY ENGINE ---
  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => State.getStatesOfCountry(formData.countryCode), [formData.countryCode]);

  // Map to the { label, value } format required by our custom select
  const countryOptions = useMemo(() => countries.map(c => ({ label: c.name, value: c.isoCode })), [countries]);
  const stateOptions = useMemo(() => states.map(s => ({ label: s.name, value: s.isoCode })), [states]);

  // Handlers for the custom selects
  const handleCountryChange = (selectedCountryCode) => {
    const selectedCountry = countries.find(c => c.isoCode === selectedCountryCode);
    setFormData(prev => ({
      ...prev,
      countryCode: selectedCountryCode,
      country: selectedCountry ? selectedCountry.name : '',
      stateCode: '', // Wipe the old state code
      state: ''      // Wipe the old state name to prevent mismatches
    }));
  };

  const handleStateChange = (selectedStateCode) => {
    const selectedState = states.find(s => s.isoCode === selectedStateCode);
    setFormData(prev => ({
      ...prev,
      stateCode: selectedStateCode,
      state: selectedState ? selectedState.name : ''
    }));
  };

  return (
    <section>
      <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-gray-400 mb-8">
        Shipping Details
      </h2>

      <form className="space-y-8">
        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className={labelClass}>First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={onChange} className={inputClass} placeholder="John" />
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={onChange} className={inputClass} placeholder="Doe" />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={onChange} className={`${inputClass} ${!isGuest ? 'text-gray-400 cursor-not-allowed' : ''}`} placeholder="john@example.com" readOnly={!isGuest} />
          </div>
        </div>

        {/* Address Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          <div className="md:col-span-2">
            <label className={labelClass}>Country / Region</label>
            <CustomSelect 
              options={countryOptions}
              value={formData.countryCode}
              onChange={handleCountryChange}
              placeholder="Select a country"
              searchPlaceholder="Search countries..."
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Street Address</label>
            <input type="text" name="street" value={formData.street} onChange={onChange} className={inputClass} placeholder="Apartment, suite, unit, etc." />
          </div>
          
          <div>
            <label className={labelClass}>City</label>
            <input type="text" name="city" value={formData.city} onChange={onChange} className={inputClass} placeholder="Mumbai" />
          </div>
          
          <div>
            <label className={labelClass}>State / Province</label>
            {states && states.length > 0 ? (
              <CustomSelect 
                options={stateOptions}
                value={formData.stateCode}
                onChange={handleStateChange}
                placeholder="Select a state"
                searchPlaceholder="Search states..."
              />
            ) : (
              // This fallback text input ONLY triggers if a tiny country officially has no states in the database
              <input 
                type="text" 
                name="state" 
                value={formData.state} 
                onChange={onChange} 
                className={inputClass} 
                placeholder="State/Province" 
                disabled={!formData.countryCode} 
              />
            )}
          </div>
          
          <div>
            <label className={labelClass}>Postal Code</label>
            <input type="text" name="pinCode" value={formData.pinCode} onChange={onChange} className={inputClass} placeholder="400001" />
          </div>
          
          <div>
            <label className={labelClass}>Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={onChange} className={inputClass} placeholder="+91" />
          </div>
        </div>
      </form>
    </section>
  );
};

export default CheckoutForm;