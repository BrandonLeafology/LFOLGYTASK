import React, { useState, useRef, useEffect } from 'react';
import { Category, Status, Priority, CATEGORIES, STATUSES, PRIORITIES, ExtendedStatus, VIEW_FILTERS, TYPE_FILTERS } from '../types';
import { FilterIcon, ChevronDownIcon } from './Icons';

type SortKey = 'createdAt' | 'priority';
type SortDirection = 'asc' | 'desc';
type ActiveFilters = {
    categories: Category[];
    statuses: ExtendedStatus[];
    priorities: Priority[];
};
type SortConfig = {
    key: SortKey;
    direction: SortDirection;
};

interface FilterSortControlsProps {
    activeFilters: ActiveFilters;
    onFilterChange: (filters: ActiveFilters) => void;
    sortConfig: SortConfig;
    onSortChange: (config: SortConfig) => void;
}

const useOutsideClick = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
};

export const FilterSortControls: React.FC<FilterSortControlsProps> = ({
    activeFilters,
    onFilterChange,
    sortConfig,
    onSortChange,
}) => {
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);

    useOutsideClick(filterRef, () => setShowFilterMenu(false));
    useOutsideClick(sortRef, () => setShowSortMenu(false));

    const handleFilterToggle = <T extends Category | ExtendedStatus | Priority>(type: keyof ActiveFilters, value: T) => {
        const currentValues = activeFilters[type] as T[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(item => item !== value)
            : [...currentValues, value];
        
        onFilterChange({
            ...activeFilters,
            [type]: newValues,
        });
    };
    
    const clearFilters = () => {
        onFilterChange({ categories: [], statuses: [], priorities: [] });
    }
    
    const handleSortSelect = (key: SortKey, direction: SortDirection) => {
        onSortChange({ key, direction });
        setShowSortMenu(false);
    }
    
    const sortOptions: {label: string, key: SortKey, direction: SortDirection}[] = [
        { label: 'Date: Newest', key: 'createdAt', direction: 'desc' },
        { label: 'Date: Oldest', key: 'createdAt', direction: 'asc' },
        { label: 'Priority: High-Low', key: 'priority', direction: 'desc' },
        { label: 'Priority: Low-High', key: 'priority', direction: 'asc' },
    ];
    
    const currentSortLabel = sortOptions.find(opt => opt.key === sortConfig.key && opt.direction === sortConfig.direction)?.label || 'Sort by';
    const activeFilterCount = activeFilters.categories.length + activeFilters.statuses.length + activeFilters.priorities.length;

    return (
        <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Filter Button & Dropdown */}
            <div className="relative" ref={filterRef}>
                <button
                    onClick={() => setShowFilterMenu(s => !s)}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg border shadow-sm transition-colors ${activeFilterCount > 0 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    <FilterIcon className="w-4 h-4" />
                    <span>Filter</span>
                    {activeFilterCount > 0 && <span className="bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                </button>
                {showFilterMenu && (
                    <div className="absolute z-20 right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                        <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
                            {/* Priorities */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Priority</h4>
                                <div className="space-y-1">
                                    {PRIORITIES.map(p => (
                                        <label key={p} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" checked={activeFilters.priorities.includes(p)} onChange={() => handleFilterToggle('priorities', p)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            <span className="capitalize">{p}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                             <hr/>
                            {/* Dates */}
                             <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Date</h4>
                                <div className="space-y-1">
                                    {VIEW_FILTERS.map(f => (
                                        <label key={f} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" checked={activeFilters.statuses.includes(f)} onChange={() => handleFilterToggle('statuses', f)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            <span className="capitalize">{f}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <hr/>
                            {/* Statuses */}
                             <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Status</h4>
                                <div className="space-y-1">
                                    {STATUSES.map(s => (
                                        <label key={s} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" checked={activeFilters.statuses.includes(s)} onChange={() => handleFilterToggle('statuses', s)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            <span className="capitalize">{s}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <hr/>
                            {/* Types */}
                             <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Type</h4>
                                <div className="space-y-1">
                                    {TYPE_FILTERS.map(f => (
                                        <label key={f} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" checked={activeFilters.statuses.includes(f)} onChange={() => handleFilterToggle('statuses', f)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            <span className="capitalize">{f}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <hr/>
                            {/* Categories */}
                             <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Category</h4>
                                <div className="space-y-1">
                                    {CATEGORIES.map(c => (
                                        <label key={c} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" checked={activeFilters.categories.includes(c)} onChange={() => handleFilterToggle('categories', c)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            <span>{c}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-2 bg-gray-50 border-t">
                            <button onClick={clearFilters} className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-800 py-1">Clear Filters</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sort Button & Dropdown */}
            <div className="relative" ref={sortRef}>
                <button
                    onClick={() => setShowSortMenu(s => !s)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
                >
                    <span>{currentSortLabel}</span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                </button>
                 {showSortMenu && (
                    <div className="absolute z-20 right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden py-1">
                        {sortOptions.map(opt => (
                             <button 
                                key={opt.label}
                                onClick={() => handleSortSelect(opt.key, opt.direction)} 
                                className={`w-full text-left px-3 py-1.5 text-sm font-medium ${sortConfig.key === opt.key && sortConfig.direction === opt.direction ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                 )}
            </div>
        </div>
    );
}