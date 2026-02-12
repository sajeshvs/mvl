import * as React from 'react';
import styles from './FilterBar.module.scss';

export interface IFilterOption {
    key: string;
    text: string;
}

export interface IFilterConfig {
    id: string;
    label: string;
    options: IFilterOption[];
    value: string;
    placeholder?: string;
}

export interface IActiveFilter {
    id: string;
    label: string;
    value: string;
}

export interface IFilterBarProps {
    filters: IFilterConfig[];
    activeFilters?: IActiveFilter[];
    searchValue?: string;
    searchPlaceholder?: string;
    onFilterChange: (filterId: string, value: string) => void;
    onSearchChange?: (value: string) => void;
    onClearFilter?: (filterId: string) => void;
    onResetAll?: () => void;
}

const FilterBar: React.FC<IFilterBarProps> = ({
    filters,
    activeFilters = [],
    searchValue = '',
    searchPlaceholder = 'Search...',
    onFilterChange,
    onSearchChange,
    onClearFilter,
    onResetAll
}) => {
    return (
        <div className={styles.filtersBar}>
            {/* Filter Dropdowns */}
            {filters.map((filter) => (
                <div key={filter.id} className={styles.filterGroup}>
                    <label htmlFor={`filter-${filter.id}`}>{filter.label}</label>
                    <select
                        id={`filter-${filter.id}`}
                        value={filter.value}
                        onChange={(e) => onFilterChange(filter.id, e.target.value)}
                    >
                        <option value="">{filter.placeholder || `All ${filter.label}`}</option>
                        {filter.options.map((option) => (
                            <option key={option.key} value={option.key}>
                                {option.text}
                            </option>
                        ))}
                    </select>
                </div>
            ))}

            {/* Search Box */}
            {onSearchChange && (
                <div className={styles.filterGroup}>
                    <label htmlFor="filter-search">Search</label>
                    <div className={styles.searchBox}>
                        <input
                            id="filter-search"
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                        />
                    </div>
                </div>
            )}

            {/* Active Filters Tags */}
            {activeFilters.length > 0 && (
                <div className={styles.activeFilters}>
                    {activeFilters.map((filter) => (
                        <span key={filter.id} className={styles.filterTag}>
                            {filter.label}: {filter.value}
                            {onClearFilter && (
                                <button
                                    onClick={() => onClearFilter(filter.id)}
                                    aria-label={`Remove ${filter.label} filter`}
                                >
                                    ×
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            )}

            {/* Reset Button */}
            {onResetAll && activeFilters.length > 0 && (
                <button className={styles.resetButton} onClick={onResetAll}>
                    Reset All
                </button>
            )}
        </div>
    );
};

export default FilterBar;
