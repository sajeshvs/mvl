/**
 * MVL Supply Intel Hub - Modal Component System
 * Reusable modal dialogs for detail views
 */

class Modal {
    constructor(options = {}) {
        this.id = options.id || 'modal-' + Date.now();
        this.title = options.title || 'Details';
        this.size = options.size || 'medium'; // small, medium, large, fullscreen
        this.onClose = options.onClose || null;
        this.element = null;
        this.overlay = null;
    }

    create() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Create modal
        this.element = document.createElement('div');
        this.element.className = `modal modal-${this.size}`;
        this.element.id = this.id;
        this.element.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${this.title}</h2>
                <button class="modal-close" aria-label="Close">×</button>
            </div>
            <div class="modal-body"></div>
            <div class="modal-footer"></div>
        `;

        // Close button handler
        this.element.querySelector('.modal-close').addEventListener('click', () => this.close());

        // Keyboard handler
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        this.overlay.appendChild(this.element);
        document.body.appendChild(this.overlay);

        // Trigger animation
        requestAnimationFrame(() => {
            this.overlay.classList.add('active');
            this.element.classList.add('active');
        });

        return this;
    }

    handleKeydown(e) {
        if (e.key === 'Escape') this.close();
    }

    setTitle(title) {
        this.element.querySelector('.modal-title').textContent = title;
        return this;
    }

    setBody(content) {
        const body = this.element.querySelector('.modal-body');
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.innerHTML = '';
            body.appendChild(content);
        }
        return this;
    }

    setFooter(content) {
        const footer = this.element.querySelector('.modal-footer');
        if (typeof content === 'string') {
            footer.innerHTML = content;
        } else {
            footer.innerHTML = '';
            footer.appendChild(content);
        }
        footer.style.display = content ? 'flex' : 'none';
        return this;
    }

    addTab(tabs) {
        // tabs = [{id, label, content}]
        const tabsHtml = `
            <div class="modal-tabs">
                ${tabs.map((t, i) => `
                    <button class="modal-tab ${i === 0 ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>
                `).join('')}
            </div>
            <div class="modal-tab-content">
                ${tabs.map((t, i) => `
                    <div class="modal-tab-pane ${i === 0 ? 'active' : ''}" id="tab-${t.id}">${t.content}</div>
                `).join('')}
            </div>
        `;

        this.setBody(tabsHtml);

        // Tab click handlers
        this.element.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.element.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
                this.element.querySelectorAll('.modal-tab-pane').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                this.element.querySelector(`#tab-${tabId}`).classList.add('active');
            });
        });

        return this;
    }

    showLoading() {
        this.setBody(`
            <div class="modal-loading">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `);
        return this;
    }

    close() {
        this.overlay.classList.remove('active');
        this.element.classList.remove('active');
        
        setTimeout(() => {
            document.removeEventListener('keydown', this.handleKeydown);
            this.overlay.remove();
            if (this.onClose) this.onClose();
        }, 300);
    }
}

// Static method for quick modals
Modal.confirm = (message, onConfirm, onCancel) => {
    const modal = new Modal({ title: 'Confirm', size: 'small' });
    modal.create();
    modal.setBody(`<p>${message}</p>`);
    
    const footer = document.createElement('div');
    footer.className = 'modal-footer-buttons';
    footer.innerHTML = `
        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        <button class="btn btn-primary" data-action="confirm">Confirm</button>
    `;
    
    footer.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        modal.close();
        if (onCancel) onCancel();
    });
    
    footer.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        modal.close();
        if (onConfirm) onConfirm();
    });
    
    modal.setFooter(footer);
    return modal;
};

Modal.alert = (title, message) => {
    const modal = new Modal({ title, size: 'small' });
    modal.create();
    modal.setBody(`<p>${message}</p>`);
    
    const footer = document.createElement('div');
    footer.innerHTML = `<button class="btn btn-primary">OK</button>`;
    footer.querySelector('button').addEventListener('click', () => modal.close());
    
    modal.setFooter(footer);
    return modal;
};

// Export for use
window.Modal = Modal;
