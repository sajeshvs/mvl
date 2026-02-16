// ============================================================================
// V6 Data Loader Module
// Handles loading all data files and populating application state
// ============================================================================

import { state } from './state.js';

/**
 * Fetches all V6 data files in parallel and populates state.
 * Uses Promise.allSettled to handle individual failures gracefully.
 * @returns {Promise<void>}
 */
export async function loadAllData() {
    const dataFiles = [
        { url: 'data/dashboard.json',        key: 'dashboard',       useRecords: false },
        { url: 'data/quotations.json',        key: 'quotations',      useRecords: true  },
        { url: 'data/purchase_orders.json',   key: 'purchaseOrders',  useRecords: true  },
        { url: 'data/suppliers.json',         key: 'suppliers',       useRecords: true  },
        { url: 'data/employees.json',         key: 'employees',       useRecords: true  },
        { url: 'data/client_country_map.json', key: 'clientCountryMap', useRecords: false },
    ];

    const results = await Promise.allSettled(
        dataFiles.map(({ url }) =>
            fetch(url).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
                return res.json();
            })
        )
    );

    results.forEach((result, i) => {
        const { url, key, useRecords } = dataFiles[i];
        if (result.status === 'fulfilled') {
            state[key] = useRecords ? result.value.records : result.value;
            console.log(`[DataLoader] Loaded ${key} from ${url}`);
        } else {
            console.warn(`[DataLoader] Failed to load ${url}:`, result.reason);
        }
    });
}

/**
 * Fetches live FX rates from open.er-api.com.
 * On success: updates state.fxRates and dispatches 'fxRatesUpdated' event.
 * On failure: keeps default rates and logs a warning.
 * Also updates the FX rate display element in the header.
 */
export async function refreshFxRates() {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        state.fxRates = data.rates;
        console.log('[DataLoader] FX rates updated');
        document.dispatchEvent(new CustomEvent('fxRatesUpdated'));
    } catch (err) {
        console.warn('[DataLoader] Failed to refresh FX rates, keeping defaults:', err);
    }

    // Update header display
    const el = document.getElementById('fxRatesDisplay');
    if (el && state.fxRates) {
        const pairs = ['EUR', 'GBP', 'AED', 'SAR']
            .filter(c => state.fxRates[c])
            .map(c => `${c}: ${state.fxRates[c].toFixed(4)}`);
        el.textContent = pairs.join(' | ');
    }
}

/**
 * Returns statistics about the currently loaded data.
 * @returns {{ quotationCount: number, poCount: number, supplierCount: number, employeeCount: number, lastBuildDate: string|null, dataVersion: string|null }}
 */
export function getDataStats() {
    return {
        quotationCount: state.quotations ? state.quotations.length : 0,
        poCount:        state.purchaseOrders ? state.purchaseOrders.length : 0,
        supplierCount:  state.suppliers ? state.suppliers.length : 0,
        employeeCount:  state.employees ? state.employees.length : 0,
        lastBuildDate:  state.dashboard?.metadata?.last_build_date ?? null,
        dataVersion:    state.dashboard?.metadata?.data_version ?? null,
    };
}
