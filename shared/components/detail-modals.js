/**
 * MVL Supply Intel Hub v3 - Detail Modals
 * PO Details, Supplier Profile, Quotation Details
 */

// Format helpers - use existing if available, otherwise define
const _modalFormatCurrency = (val) => {
    if (val === undefined || val === null) return '$0';
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(1) + 'K';
    return '$' + (typeof val === 'number' ? val.toFixed(2) : val);
};

const _modalFormatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const _modalGetStatusBadge = (status) => {
    const map = {
        'Won': 'success',
        'PO Issued': 'success',
        'Submitted': 'warning',
        'Pending': 'warning',
        'Lost': 'danger',
        'Cancelled': 'danger'
    };
    return `<span class="badge badge-${map[status] || 'neutral'}">${status}</span>`;
};

/**
 * Show PO Details Modal
 */
function showPODetails(po) {
    const modal = new Modal({
        title: `PO: ${po.poNumber || po.po_number || 'N/A'}`,
        size: 'large'
    });
    
    modal.create();
    
    const content = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">PO Number</div>
                <div class="detail-value">${po.poNumber || po.po_number || '--'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">PO Value (USD)</div>
                <div class="detail-value large info">${_modalFormatCurrency(po.valueUSD || po.value_usd)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Original Value</div>
                <div class="detail-value">${po.currency || 'USD'} ${(po.originalValue || po.value || 0).toLocaleString()}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">PO Type</div>
                <div class="detail-value">${_modalGetStatusBadge(po.poType || po.po_type || 'Base PO')}</div>
            </div>
        </div>

        <div class="detail-section">
            <h3 class="detail-section-title">📋 Order Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Entity</div>
                    <div class="detail-value">${po.entity || '--'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Supplier</div>
                    <div class="detail-value">
                        <a href="#" onclick="showSupplierProfile('${po.supplier || po.vendor}'); return false;" style="color:#004578;text-decoration:none;">
                            ${po.supplier || po.vendor || '--'}
                        </a>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">PO Date</div>
                    <div class="detail-value">${_modalFormatDate(po.poDate || po.date)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Year</div>
                    <div class="detail-value">${po.year || '--'}</div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3 class="detail-section-title">📦 Material Details</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Material Group</div>
                    <div class="detail-value">${po.materialGroup || po.material || '--'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${po.description || po.text || '--'}</div>
                </div>
            </div>
        </div>

        ${po.quotationRef ? `
        <div class="detail-section">
            <h3 class="detail-section-title">🔗 Related Quotation</h3>
            <div class="detail-item">
                <div class="detail-label">Quotation Reference</div>
                <div class="detail-value">
                    <a href="#" onclick="showQuotationDetails('${po.quotationRef}'); return false;" style="color:#004578;">
                        ${po.quotationRef}
                    </a>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="detail-section">
            <h3 class="detail-section-title">📈 Status Timeline</h3>
            <div class="timeline">
                <div class="timeline-item completed">
                    <div class="timeline-date">${_modalFormatDate(po.poDate || po.date)}</div>
                    <div class="timeline-content">PO Created</div>
                </div>
                <div class="timeline-item completed">
                    <div class="timeline-date">${_modalFormatDate(po.poDate || po.date)}</div>
                    <div class="timeline-content">PO Issued to Supplier</div>
                </div>
                <div class="timeline-item current">
                    <div class="timeline-date">Current</div>
                    <div class="timeline-content">Order Processing</div>
                </div>
            </div>
        </div>
    `;
    
    modal.setBody(content);
    
    // Footer with actions
    const footer = document.createElement('div');
    footer.className = 'modal-footer-buttons';
    footer.innerHTML = `
        <button class="btn btn-outline" onclick="exportPODetails('${po.poNumber || po.po_number}')">
            📥 Export
        </button>
        <button class="btn btn-outline" onclick="window.print()">
            🖨️ Print
        </button>
        <button class="btn btn-primary" onclick="viewInGlobalSpend('${po.poNumber || po.po_number}')">
            📊 View in Global Spend
        </button>
    `;
    modal.setFooter(footer);
    
    return modal;
}

/**
 * Show Supplier Profile Modal
 */
function showSupplierProfile(supplierName) {
    const modal = new Modal({
        title: `Supplier: ${supplierName}`,
        size: 'large'
    });
    
    modal.create();
    modal.showLoading();
    
    // Simulate loading data (in real app, would fetch from data)
    setTimeout(() => {
        // Find supplier data from available DATA
        let supplierData = null;
        let poData = [];
        let quoteData = [];
        
        // Try to get data from global DATA objects
        if (window.DATA) {
            if (DATA.suppliers) {
                supplierData = DATA.suppliers.find(s => s.name === supplierName || s.supplier === supplierName);
            }
            if (DATA.workbench) {
                quoteData = DATA.workbench.filter(w => w.supplier === supplierName);
            }
            if (DATA.pos) {
                poData = DATA.pos.filter(p => p.supplier === supplierName || p.vendor === supplierName);
            }
        }
        
        const totalPOs = poData.length;
        const totalQuotes = quoteData.length;
        const totalValue = poData.reduce((sum, p) => sum + (p.valueUSD || p.value_usd || 0), 0);
        const winRate = totalQuotes > 0 ? ((quoteData.filter(q => q.status === 'Won' || q.status === 'PO Issued').length / totalQuotes) * 100) : 0;
        
        const content = `
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Supplier Name</div>
                    <div class="detail-value">${supplierName}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Total PO Value</div>
                    <div class="detail-value large success">${_modalFormatCurrency(totalValue)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Purchase Orders</div>
                    <div class="detail-value">${totalPOs}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Win Rate</div>
                    <div class="detail-value ${winRate > 80 ? 'success' : winRate > 50 ? 'warning' : 'danger'}">${winRate.toFixed(1)}%</div>
                </div>
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">📋 Recent Quotations (${totalQuotes})</h3>
                ${quoteData.length > 0 ? `
                <table class="mini-table">
                    <thead>
                        <tr>
                            <th>Quotation #</th>
                            <th>Entity</th>
                            <th>Value (USD)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quoteData.slice(0, 5).map(q => `
                            <tr style="cursor:pointer;" onclick="showQuotationDetails('${q.quotationNumber}')">
                                <td>${q.quotationNumber || q.rfq || '--'}</td>
                                <td>${q.entity || '--'}</td>
                                <td>${_modalFormatCurrency(q.valueUSD || q.value)}</td>
                                <td>${_modalGetStatusBadge(q.status)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${quoteData.length > 5 ? `<p style="color:#605e5c;font-size:12px;margin-top:8px;">+ ${quoteData.length - 5} more quotations</p>` : ''}
                ` : '<p style="color:#605e5c;">No quotations found</p>'}
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">📦 Recent Purchase Orders (${totalPOs})</h3>
                ${poData.length > 0 ? `
                <table class="mini-table">
                    <thead>
                        <tr>
                            <th>PO Number</th>
                            <th>Entity</th>
                            <th>Value (USD)</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${poData.slice(0, 5).map(p => `
                            <tr style="cursor:pointer;" onclick="showPODetails(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                                <td>${p.poNumber || p.po_number || '--'}</td>
                                <td>${p.entity || '--'}</td>
                                <td>${_modalFormatCurrency(p.valueUSD || p.value_usd)}</td>
                                <td>${_modalFormatDate(p.poDate || p.date)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${poData.length > 5 ? `<p style="color:#605e5c;font-size:12px;margin-top:8px;">+ ${poData.length - 5} more POs</p>` : ''}
                ` : '<p style="color:#605e5c;">No purchase orders found</p>'}
            </div>
        `;
        
        modal.setBody(content);
    }, 300);
    
    return modal;
}

/**
 * Show Quotation Details Modal
 * @param {string|object} quotationData - Either a quotation number (string) or full quote object
 */
function showQuotationDetails(quotationData) {
    let quote = null;
    
    // Check if we received an object (full data) or string (quotation number)
    if (typeof quotationData === 'object' && quotationData !== null) {
        // We have the full data object
        quote = {
            quotationNumber: quotationData.QuotationNumber || quotationData.quotationNumber || quotationData.rfq || 'N/A',
            valueUSD: quotationData.QuotationValue || quotationData.valueUSD || quotationData.value || 0,
            status: quotationData.status || quotationData.StatusCategory || quotationData.Status || 'Unknown',
            quoteDate: quotationData.date || quotationData.CreatedDate || quotationData.quoteDate || null,
            entity: quotationData.entity || quotationData.Entity || '--',
            supplier: quotationData.supplier || quotationData.SupplierName || quotationData.Supplier || 'Unknown',
            material: quotationData.material || quotationData.MaterialGroup || quotationData.Material || '--',
            currency: quotationData.currency || quotationData.Currency || 'USD',
            description: quotationData.description || quotationData.Description || '',
            type: quotationData.type || quotationData.QuoteType || 'Standard',
            deliveryTerms: quotationData.deliveryTerms || quotationData.DeliveryTerms || 'TBD',
            paymentTerms: quotationData.paymentTerms || quotationData.PaymentTerms || 'Net 30',
            poNumber: quotationData.linkedPO || quotationData.PONumber || quotationData.poNumber || null
        };
    } else {
        // We have a quotation number, try to find in data
        const quotationNumber = quotationData;
        if (window.DATA && DATA.workbench) {
            quote = DATA.workbench.find(w => 
                w.quotationNumber === quotationNumber || 
                w.rfq === quotationNumber ||
                w.id === quotationNumber ||
                w.QuotationNumber === quotationNumber
            );
        }
        
        if (!quote) {
            Modal.alert('Not Found', `Could not find quotation ${quotationNumber}`);
            return;
        }
    }
    
    const modal = new Modal({
        title: `Quotation: ${quote.quotationNumber || quote.QuotationNumber || quote.rfq || 'N/A'}`,
        size: 'large'
    });
    
    modal.create();
    
    const content = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">Quotation Number</div>
                <div class="detail-value">${quote.quotationNumber || quote.rfq || '--'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Quote Value (USD)</div>
                <div class="detail-value large info">${_modalFormatCurrency(quote.valueUSD || quote.value)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">${_modalGetStatusBadge(quote.status)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Quote Date</div>
                <div class="detail-value">${_modalFormatDate(quote.quoteDate || quote.date)}</div>
            </div>
        </div>

        <div class="detail-section">
            <h3 class="detail-section-title">📋 Quote Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Entity</div>
                    <div class="detail-value">${quote.entity || '--'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Supplier</div>
                    <div class="detail-value">
                        <a href="#" onclick="showSupplierProfile('${quote.supplier}'); return false;" style="color:#004578;">
                            ${quote.supplier || '--'}
                        </a>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Material</div>
                    <div class="detail-value">${quote.material || quote.discipline || '--'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Currency</div>
                    <div class="detail-value">${quote.currency || 'USD'}</div>
                </div>
            </div>
        </div>

        ${quote.poNumber ? `
        <div class="detail-section">
            <h3 class="detail-section-title">🔗 Related PO</h3>
            <div class="detail-item">
                <div class="detail-label">PO Number</div>
                <div class="detail-value success">
                    <a href="#" onclick="viewInGlobalSpend('${quote.poNumber}'); return false;" style="color:#107C10;">
                        ${quote.poNumber} ✓
                    </a>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="detail-section">
            <h3 class="detail-section-title">📈 Status Timeline</h3>
            <div class="timeline">
                <div class="timeline-item completed">
                    <div class="timeline-date">${_modalFormatDate(quote.quoteDate || quote.date)}</div>
                    <div class="timeline-content">Quote Submitted</div>
                </div>
                ${quote.status === 'Won' || quote.status === 'PO Issued' ? `
                <div class="timeline-item completed">
                    <div class="timeline-date">--</div>
                    <div class="timeline-content">Quote Won</div>
                </div>
                ` : ''}
                ${quote.status === 'PO Issued' ? `
                <div class="timeline-item completed">
                    <div class="timeline-date">--</div>
                    <div class="timeline-content">PO Issued</div>
                </div>
                ` : ''}
                ${quote.status === 'Submitted' ? `
                <div class="timeline-item current">
                    <div class="timeline-date">Current</div>
                    <div class="timeline-content">Awaiting Decision</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.setBody(content);
    
    return modal;
}

/**
 * Navigate to Global Spend with PO filter
 */
function viewInGlobalSpend(poNumber) {
    window.location.href = `../global-spend-analysis/index.html?po=${encodeURIComponent(poNumber)}`;
}

/**
 * Export PO Details (placeholder)
 */
function exportPODetails(poNumber) {
    Modal.alert('Export', `Exporting PO ${poNumber} details...`);
}

// Make functions globally available
window.showPODetails = showPODetails;
window.showSupplierProfile = showSupplierProfile;
window.showQuotationDetails = showQuotationDetails;
window.viewInGlobalSpend = viewInGlobalSpend;
window.exportPODetails = exportPODetails;
