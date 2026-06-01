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
  theme?: 'light' | 'dark';
  noOptionsMessage?: string;
  onAddNew?: () => void;
  addNewLabel?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  disabled = false,
  required = false,
  theme = 'light',
  noOptionsMessage = 'No matching results',
  onAddNew,
  addNewLabel = 'Request new item',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Find the label of the currently selected value
  const selectedOption = options.find(opt => opt.id === value);
  const isDark = theme === 'dark';

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
        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`relative w-full border rounded-lg transition-all duration-200 ${
          isDark
            ? isOpen
              ? 'border-sky-300/50 ring-2 ring-sky-400/20 shadow-md bg-slate-950/70'
              : 'border-white/10 hover:border-white/20 bg-slate-950/60'
            : isOpen
              ? 'border-secondary ring-2 ring-secondary/20 shadow-md bg-white'
              : 'border-gray-300 hover:border-gray-400 bg-white'
        } ${disabled ? (isDark ? 'bg-slate-900/70 cursor-not-allowed' : 'bg-gray-100 cursor-not-allowed') : ''}`}
      >
        <div className="relative flex items-center">
          <input
            type="text"
            className={`w-full px-4 py-2 text-sm rounded-lg focus:outline-none bg-transparent ${
              disabled ? 'cursor-not-allowed' : 'cursor-text'
            } ${isDark ? (!selectedOption && !searchTerm ? 'text-white/35' : 'text-white font-medium') : (!selectedOption && !searchTerm ? 'text-gray-400' : 'text-gray-900 font-medium')}`}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            value={searchTerm !== '' || !selectedOption ? searchTerm : selectedOption.label}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => !disabled && setIsOpen(true)}
            disabled={disabled}
          />
          <div className="absolute right-3 flex items-center gap-2">
            {value && !disabled && (
              <button
                type="button"
                className="text-white/50 hover:text-white focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect('');
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <div className="pointer-events-none">
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isDark ? 'text-white/45' : 'text-gray-400'} ${isOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-slate-950 border-white/10' : 'bg-white border-gray-200'}`}>
          {/* Options list */}
          <ul className={`max-h-60 overflow-y-auto py-1 text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.id}
                  className={`px-4 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                    value === option.id
                      ? isDark
                        ? 'bg-sky-400/10 text-sky-100 font-bold'
                        : 'bg-secondary/10 text-secondary font-bold'
                      : isDark
                        ? 'hover:bg-white/5'
                        : 'hover:bg-gray-50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.id);
                  }}
                >
                  <span>{option.label}</span>
                  {value === option.id && (
                    <svg className={`w-4 h-4 ${isDark ? 'text-sky-200' : 'text-secondary'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </li>
              ))
            ) : (
              <li className={`px-4 py-3 text-center italic ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                {noOptionsMessage}
              </li>
            )}
          </ul>
          {filteredOptions.length === 0 && onAddNew && (
            <div className={`px-4 py-3 border-t text-center ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <button
                type="button"
                className="text-sm font-semibold text-secondary hover:text-secondary/80"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNew();
                }}
              >
                {addNewLabel}
              </button>
            </div>
          )}
          
          {/* Clear Selection Option */}
          {value && (
            <div className={`p-1 border-t text-center ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <button
                type="button"
                className={`w-full py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${isDark ? 'text-white/45 hover:text-rose-300' : 'text-gray-400 hover:text-red-500'}`}
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
