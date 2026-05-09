import React, { useState, useEffect, useRef } from 'react';

interface Option {
  id: string;
  label: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Find the label of the currently selected value
  const selectedOption = options.find(opt => opt.id === value);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(''); // Clear search when closing
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`relative w-full bg-white border rounded-lg transition-all duration-200 ${
          isOpen ? 'border-secondary ring-2 ring-secondary/20 shadow-md' : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <div className="relative flex items-center">
          <input
            type="text"
            className={`w-full px-4 py-2 text-sm rounded-lg focus:outline-none bg-transparent ${
              disabled ? 'cursor-not-allowed' : 'cursor-text'
            } ${!selectedOption && !searchTerm ? 'text-gray-400' : 'text-gray-900 font-medium'}`}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            value={searchTerm !== '' || !selectedOption ? searchTerm : selectedOption.label}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => !disabled && setIsOpen(true)}
            disabled={disabled}
          />
          <div 
            className="absolute right-3 flex items-center pointer-events-none"
          >
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2">
          {/* Options list */}
          <ul className="max-h-60 overflow-y-auto py-1 text-sm text-gray-700">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.id}
                  className={`px-4 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                    value === option.id ? 'bg-secondary/10 text-secondary font-bold' : 'hover:bg-gray-50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.id);
                  }}
                >
                  <span>{option.label}</span>
                  {value === option.id && (
                    <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-center text-gray-500 italic">
                No matching results
              </li>
            )}
          </ul>
          
          {/* Clear Selection Option */}
          {value && (
            <div className="p-1 border-t border-gray-100 text-center">
              <button
                type="button"
                className="w-full py-1.5 text-[11px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect('');
                }}
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
