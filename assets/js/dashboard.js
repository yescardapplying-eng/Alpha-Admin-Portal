/**
 * ============================================================================
 * ADMIN DASHBOARD CONTROLLER
 * Handles: 100-per-page Pagination, Date Filtering, Search, Detail Modal & Delete
 * ============================================================================
 */

(function () {
  'use strict';

  // Application State
  const state = {
    currentPage: 1,
    limit: 100, // Explicitly 100 per page as requested
    totalPages: 1,
    totalItems: 0,
    search: '',
    date: '',
    dateFrom: '',
    dateTo: '',
    status: 'all',
    sort: 'DESC',
    activeLeadToDelete: null,
    searchDebounceTimer: null,
    viewMode: window.innerWidth <= 768 ? 'cards' : 'table',
    userSelectedView: false
  };

  // DOM Elements
  let dom = {};

  function init() {
    cacheDom();
    bindEvents();
    loadStats();
    loadLeads();
  }

  function cacheDom() {
    dom = {
      // Stats elements
      statTotal: document.getElementById('statTotal'),
      statCompleted: document.getElementById('statCompleted'),
      statPartial: document.getElementById('statPartial'),
      statToday: document.getElementById('statToday'),

      // Filter elements
      filterSearch: document.getElementById('filterSearch'),
      filterDate: document.getElementById('filterDate'),
      filterDateFrom: document.getElementById('filterDateFrom'),
      filterDateTo: document.getElementById('filterDateTo'),
      filterStatus: document.getElementById('filterStatus'),
      filterSort: document.getElementById('filterSort'),
      btnResetFilters: document.getElementById('btnResetFilters'),
      btnExportCsv: document.getElementById('btnExportCsv'),
      btnToggleRange: document.getElementById('btnToggleRange'),
      rangeContainer: document.getElementById('rangeContainer'),
      singleDateContainer: document.getElementById('singleDateContainer'),

      // Table & Pagination
      tableResponsiveWrap: document.getElementById('tableResponsiveWrap'),
      leadsTableBody: document.getElementById('leadsTableBody'),
      mobileLeadsContainer: document.getElementById('mobileLeadsContainer'),
      btnViewCards: document.getElementById('btnViewCards'),
      btnViewTable: document.getElementById('btnViewTable'),
      tableCountBadge: document.getElementById('tableCountBadge'),
      paginationMeta: document.getElementById('paginationMeta'),
      btnPrevPage: document.getElementById('btnPrevPage'),
      btnNextPage: document.getElementById('btnNextPage'),
      currentPageIndicator: document.getElementById('currentPageIndicator'),
      pageSizeSelect: document.getElementById('pageSizeSelect'),

      // Detail Modal
      detailModal: document.getElementById('detailModal'),
      btnDetailClose: document.getElementById('btnDetailClose'),
      btnDetailCloseFooter: document.getElementById('btnDetailCloseFooter'),
      detailProfileGrid: document.getElementById('detailProfileGrid'),
      detailTimelineList: document.getElementById('detailTimelineList'),
      detailLeadRef: document.getElementById('detailLeadRef'),

      // Delete Modal
      deleteModal: document.getElementById('deleteModal'),
      btnDeleteCancel: document.getElementById('btnDeleteCancel'),
      btnDeleteClose: document.getElementById('btnDeleteClose'),
      btnDeleteConfirm: document.getElementById('btnDeleteConfirm'),
      deleteLeadRefSpan: document.getElementById('deleteLeadRefSpan'),

      // Logout & Toast
      btnLogout: document.getElementById('btnLogout'),
      toast: document.getElementById('toast'),
      toastMessage: document.getElementById('toastMessage')
    };
  }

  function bindEvents() {
    // Search with 350ms debounce
    if (dom.filterSearch) {
      dom.filterSearch.addEventListener('input', function () {
        clearTimeout(state.searchDebounceTimer);
        state.searchDebounceTimer = setTimeout(function () {
          state.search = dom.filterSearch.value.trim();
          state.currentPage = 1;
          loadLeads();
        }, 350);
      });
    }

    // Exact Date filter
    if (dom.filterDate) {
      dom.filterDate.addEventListener('change', function () {
        state.date = dom.filterDate.value;
        state.dateFrom = '';
        state.dateTo = '';
        state.currentPage = 1;
        loadLeads();
      });
    }

    // Date Range filters
    if (dom.filterDateFrom) {
      dom.filterDateFrom.addEventListener('change', function () {
        state.dateFrom = dom.filterDateFrom.value;
        state.date = '';
        state.currentPage = 1;
        loadLeads();
      });
    }

    if (dom.filterDateTo) {
      dom.filterDateTo.addEventListener('change', function () {
        state.dateTo = dom.filterDateTo.value;
        state.date = '';
        state.currentPage = 1;
        loadLeads();
      });
    }

    // Toggle single date vs range
    if (dom.btnToggleRange) {
      dom.btnToggleRange.addEventListener('click', function () {
        const isRangeVisible = dom.rangeContainer.style.display !== 'none';
        if (isRangeVisible) {
          dom.rangeContainer.style.display = 'none';
          dom.singleDateContainer.style.display = 'flex';
          dom.btnToggleRange.textContent = 'Use Date Range';
          state.dateFrom = '';
          state.dateTo = '';
        } else {
          dom.rangeContainer.style.display = 'flex';
          dom.singleDateContainer.style.display = 'none';
          dom.btnToggleRange.textContent = 'Use Single Date';
          state.date = '';
        }
        state.currentPage = 1;
        loadLeads();
      });
    }

    // Status filter
    if (dom.filterStatus) {
      dom.filterStatus.addEventListener('change', function () {
        state.status = dom.filterStatus.value;
        state.currentPage = 1;
        loadLeads();
      });
    }

    // Sort order
    if (dom.filterSort) {
      dom.filterSort.addEventListener('change', function () {
        state.sort = dom.filterSort.value;
        state.currentPage = 1;
        loadLeads();
      });
    }

    // Page size dropdown
    if (dom.pageSizeSelect) {
      dom.pageSizeSelect.addEventListener('change', function () {
        state.limit = parseInt(dom.pageSizeSelect.value, 10) || 100;
        state.currentPage = 1;
        loadLeads();
      });
    }

    // Reset Filters
    if (dom.btnResetFilters) {
      dom.btnResetFilters.addEventListener('click', function () {
        state.search = '';
        state.date = '';
        state.dateFrom = '';
        state.dateTo = '';
        state.status = 'all';
        state.sort = 'DESC';
        state.currentPage = 1;

        if (dom.filterSearch) dom.filterSearch.value = '';
        if (dom.filterDate) dom.filterDate.value = '';
        if (dom.filterDateFrom) dom.filterDateFrom.value = '';
        if (dom.filterDateTo) dom.filterDateTo.value = '';
        if (dom.filterStatus) dom.filterStatus.value = 'all';
        if (dom.filterSort) dom.filterSort.value = 'DESC';

        loadLeads();
      });
    }

    // Pagination buttons
    if (dom.btnPrevPage) {
      dom.btnPrevPage.addEventListener('click', function () {
        if (state.currentPage > 1) {
          state.currentPage -= 1;
          loadLeads();
        }
      });
    }

    if (dom.btnNextPage) {
      dom.btnNextPage.addEventListener('click', function () {
        if (state.currentPage < state.totalPages) {
          state.currentPage += 1;
          loadLeads();
        }
      });
    }

    // Export to CSV
    if (dom.btnExportCsv) {
      dom.btnExportCsv.addEventListener('click', function () {
        const params = new URLSearchParams({
          date: state.date,
          date_from: state.dateFrom,
          date_to: state.dateTo,
          status: state.status,
          search: state.search
        });
        window.location.href = `/api/export-csv?${params.toString()}`;
      });
    }

    // Logout
    if (dom.btnLogout) {
      dom.btnLogout.addEventListener('click', async function () {
        try {
          await fetch('/api/logout', { method: 'POST' });
        } catch (e) {}
        window.location.href = '/login.html';
      });
    }

    // Detail Modal Close
    if (dom.btnDetailClose) dom.btnDetailClose.addEventListener('click', closeDetailModal);
    if (dom.btnDetailCloseFooter) dom.btnDetailCloseFooter.addEventListener('click', closeDetailModal);
    if (dom.detailModal) {
      dom.detailModal.addEventListener('click', function (e) {
        if (e.target === dom.detailModal) closeDetailModal();
      });
    }

    // Delete Modal Close & Confirm
    if (dom.btnDeleteCancel) dom.btnDeleteCancel.addEventListener('click', closeDeleteModal);
    if (dom.btnDeleteClose) dom.btnDeleteClose.addEventListener('click', closeDeleteModal);
    if (dom.deleteModal) {
      dom.deleteModal.addEventListener('click', function (e) {
        if (e.target === dom.deleteModal) closeDeleteModal();
      });
    }
    if (dom.btnDeleteConfirm) {
      dom.btnDeleteConfirm.addEventListener('click', executeDeleteLead);
    }

    // View Mode Switcher (Cards vs Table)
    if (dom.btnViewCards) {
      dom.btnViewCards.addEventListener('click', function () {
        state.userSelectedView = true;
        setViewMode('cards');
      });
    }

    if (dom.btnViewTable) {
      dom.btnViewTable.addEventListener('click', function () {
        state.userSelectedView = true;
        setViewMode('table');
      });
    }

    // Auto-adjust view on screen resize if user hasn't explicitly chosen
    let resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (!state.userSelectedView) {
          state.viewMode = window.innerWidth <= 768 ? 'cards' : 'table';
        }
        updateViewModeDisplay();
      }, 150);
    });

    // Escape closes modals
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeDetailModal();
        closeDeleteModal();
      }
    });
  }

  /**
   * Switch between Mobile Cards View and Full Data Table View
   */
  function setViewMode(mode) {
    state.viewMode = mode;
    updateViewModeDisplay();
  }

  function updateViewModeDisplay() {
    if (!dom.tableResponsiveWrap || !dom.mobileLeadsContainer) return;

    if (state.viewMode === 'cards') {
      dom.tableResponsiveWrap.style.display = 'none';
      dom.mobileLeadsContainer.style.display = 'flex';
      if (dom.btnViewCards) {
        dom.btnViewCards.classList.add('active');
        dom.btnViewCards.setAttribute('aria-pressed', 'true');
      }
      if (dom.btnViewTable) {
        dom.btnViewTable.classList.remove('active');
        dom.btnViewTable.setAttribute('aria-pressed', 'false');
      }
    } else {
      dom.tableResponsiveWrap.style.display = 'block';
      dom.mobileLeadsContainer.style.display = 'none';
      if (dom.btnViewTable) {
        dom.btnViewTable.classList.add('active');
        dom.btnViewTable.setAttribute('aria-pressed', 'true');
      }
      if (dom.btnViewCards) {
        dom.btnViewCards.classList.remove('active');
        dom.btnViewCards.setAttribute('aria-pressed', 'false');
      }
    }
  }

  /**
   * Load dashboard stats
   */
  async function loadStats() {
    try {
      const res = await fetch('/api/leads?limit=1');
      const data = await res.json();
      if (data.success && data.summary) {
        if (dom.statTotal) dom.statTotal.textContent = data.summary.total_all.toLocaleString();
        if (dom.statCompleted) dom.statCompleted.textContent = data.summary.total_completed.toLocaleString();
        if (dom.statPartial) dom.statPartial.textContent = data.summary.total_partial.toLocaleString();
        if (dom.statToday) dom.statToday.textContent = data.summary.total_today.toLocaleString();
      }
    } catch (e) {
      console.warn('Failed to load stats', e);
    }
  }

  /**
   * Fetch leads with filters and 100/page pagination
   */
  async function loadLeads() {
    if (dom.leadsTableBody) {
      dom.leadsTableBody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <div style="display: inline-flex; align-items: center; gap: 8px;">
              <span>Loading leads...</span>
            </div>
          </td>
        </tr>
      `;
    }

    if (dom.mobileLeadsContainer) {
      dom.mobileLeadsContainer.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; color: var(--text-muted); font-size: 0.88rem;">
          Loading leads...
        </div>
      `;
    }

    const query = new URLSearchParams({
      page: state.currentPage,
      limit: state.limit,
      date: state.date,
      date_from: state.dateFrom,
      date_to: state.dateTo,
      status: state.status,
      search: state.search,
      sort: state.sort
    });

    try {
      const response = await fetch(`/api/leads?${query.toString()}`);
      
      // If unauthorized, redirect to login
      if (response.status === 401) {
        window.location.href = '/login.html';
        return;
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Error loading leads');
      }

      state.totalItems = data.pagination.total_items;
      state.totalPages = data.pagination.total_pages;

      renderTable(data.items);
      updatePaginationControls(data.pagination);

      if (dom.tableCountBadge) {
        dom.tableCountBadge.textContent = `${state.totalItems} leads found`;
      }

    } catch (err) {
      if (dom.leadsTableBody) {
        dom.leadsTableBody.innerHTML = `
          <tr>
            <td colspan="11" style="text-align: center; padding: 40px; color: #f87171;">
              Failed to load leads: ${escapeHtml(err.message)}
            </td>
          </tr>
        `;
      }
      if (dom.mobileLeadsContainer) {
        dom.mobileLeadsContainer.innerHTML = `
          <div style="text-align: center; padding: 36px 16px; color: #f87171; font-size: 0.88rem;">
            Failed to load leads: ${escapeHtml(err.message)}
          </div>
        `;
      }
    }
  }

  /**
   * Render leads into HTML table
   */
  function renderTable(items) {
    if (!dom.leadsTableBody) return;

    if (!items || items.length === 0) {
      const emptyHtml = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3>No leads found</h3>
          <p>Try adjusting your date filter or search criteria.</p>
        </div>
      `;
      dom.leadsTableBody.innerHTML = `<tr><td colspan="11">${emptyHtml}</td></tr>`;
      if (dom.mobileLeadsContainer) {
        dom.mobileLeadsContainer.innerHTML = emptyHtml;
      }
      updateViewModeDisplay();
      return;
    }

    let rowsHtml = '';
    let cardsHtml = '';
    const startIndex = (state.currentPage - 1) * state.limit;

    items.forEach(function (lead, idx) {
      const rowNum = startIndex + idx + 1;
      const dateFormatted = formatDate(lead.created_at);
      const isCompleted = lead.status === 'completed';
      const statusBadge = isCompleted 
        ? '<span class="badge badge-completed">Completed</span>'
        : '<span class="badge badge-partial">Partial (Step ' + escapeHtml(lead.current_step) + ')</span>';

      // 1. Desktop & Tablet Table Row
      rowsHtml += `
        <tr data-lead-id="${lead.id}">
          <td style="color: var(--text-dim); font-size: 0.78rem;">#${rowNum}</td>
          <td style="white-space: nowrap; font-size: 0.82rem; color: var(--text-muted);">${dateFormatted}</td>
          <td><span class="lead-ref">${escapeHtml(lead.lead_reference)}</span></td>
          <td><span class="lead-name">${escapeHtml(lead.full_name || '—')}</span></td>
          <td>
            ${lead.mobile_number ? `<a href="tel:${escapeHtml(lead.mobile_number)}" class="phone-link">+91 ${escapeHtml(lead.mobile_number)}</a>` : '—'}
          </td>
          <td>
            ${lead.whatsapp_number ? `<a href="https://wa.me/91${escapeHtml(lead.whatsapp_number)}" target="_blank" rel="noopener" class="phone-link" style="color: #6ee7b7;">+91 ${escapeHtml(lead.whatsapp_number)}</a>` : '—'}
          </td>
          <td>${escapeHtml(lead.state || '—')}</td>
          <td><span style="font-weight: 500;">${escapeHtml(lead.trading_segment || '—')}</span></td>
          <td>${escapeHtml(lead.trading_capital || '—')}</td>
          <td>${statusBadge}</td>
          <td style="white-space: nowrap;">
            <div style="display: inline-flex; gap: 6px;">
              <button type="button" class="btn-icon-action view" title="View Lead Details & Click History" data-action="view" data-id="${lead.id}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button type="button" class="btn-icon-action delete" title="Delete Lead" data-action="delete" data-id="${lead.id}" data-ref="${escapeHtml(lead.lead_reference)}" data-name="${escapeHtml(lead.full_name || 'Unnamed Lead')}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;

      // 2. Mobile & Touch Responsive Card
      cardsHtml += `
        <div class="mobile-lead-card" data-lead-id="${lead.id}">
          <div class="mobile-card-header">
            <div class="mobile-card-ref-wrap">
              <span class="mobile-card-num">#${rowNum}</span>
              <span class="lead-ref">${escapeHtml(lead.lead_reference)}</span>
            </div>
            ${statusBadge}
          </div>

          <div class="mobile-card-title-row">
            <span class="mobile-card-name">${escapeHtml(lead.full_name || '—')}</span>
            <span class="mobile-card-date">${dateFormatted}</span>
          </div>

          <div class="mobile-contact-chips">
            ${lead.mobile_number ? `
              <a href="tel:${escapeHtml(lead.mobile_number)}" class="mobile-contact-chip tel" title="Call primary mobile">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>+91 ${escapeHtml(lead.mobile_number)}</span>
              </a>
            ` : ''}
            ${lead.whatsapp_number ? `
              <a href="https://wa.me/91${escapeHtml(lead.whatsapp_number)}" target="_blank" rel="noopener" class="mobile-contact-chip wa" title="Chat on WhatsApp">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span>WhatsApp</span>
              </a>
            ` : ''}
          </div>

          <div class="mobile-card-details-grid">
            <div class="mobile-detail-item">
              <span class="mobile-detail-label">Segment</span>
              <span class="mobile-detail-val">${escapeHtml(lead.trading_segment || '—')}</span>
            </div>
            <div class="mobile-detail-item">
              <span class="mobile-detail-label">Capital</span>
              <span class="mobile-detail-val">${escapeHtml(lead.trading_capital || '—')}</span>
            </div>
            <div class="mobile-detail-item">
              <span class="mobile-detail-label">State</span>
              <span class="mobile-detail-val">${escapeHtml(lead.state || '—')}</span>
            </div>
          </div>

          <div class="mobile-card-actions">
            <button type="button" class="mobile-action-btn-view" data-action="view" data-id="${lead.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>View Dossier & Timeline</span>
            </button>
            <button type="button" class="mobile-action-btn-delete" title="Delete Lead" data-action="delete" data-id="${lead.id}" data-ref="${escapeHtml(lead.lead_reference)}" data-name="${escapeHtml(lead.full_name || 'Unnamed Lead')}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    });

    dom.leadsTableBody.innerHTML = rowsHtml;
    if (dom.mobileLeadsContainer) {
      dom.mobileLeadsContainer.innerHTML = cardsHtml;
    }

    // Attach row action listeners for Table
    const viewButtons = dom.leadsTableBody.querySelectorAll('[data-action="view"]');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const leadId = this.getAttribute('data-id');
        openDetailModal(leadId);
      });
    });

    const deleteButtons = dom.leadsTableBody.querySelectorAll('[data-action="delete"]');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const leadId = this.getAttribute('data-id');
        const leadRef = this.getAttribute('data-ref');
        const leadName = this.getAttribute('data-name');
        openDeleteModal(leadId, leadRef, leadName);
      });
    });

    // Attach action listeners for Mobile Cards
    if (dom.mobileLeadsContainer) {
      const mobileViewButtons = dom.mobileLeadsContainer.querySelectorAll('[data-action="view"]');
      mobileViewButtons.forEach(btn => {
        btn.addEventListener('click', function () {
          const leadId = this.getAttribute('data-id');
          openDetailModal(leadId);
        });
      });

      const mobileDeleteButtons = dom.mobileLeadsContainer.querySelectorAll('[data-action="delete"]');
      mobileDeleteButtons.forEach(btn => {
        btn.addEventListener('click', function () {
          const leadId = this.getAttribute('data-id');
          const leadRef = this.getAttribute('data-ref');
          const leadName = this.getAttribute('data-name');
          openDeleteModal(leadId, leadRef, leadName);
        });
      });
    }

    updateViewModeDisplay();
  }

  /**
   * Update pagination indicators
   */
  function updatePaginationControls(pagination) {
    if (dom.btnPrevPage) dom.btnPrevPage.disabled = !pagination.has_prev;
    if (dom.btnNextPage) dom.btnNextPage.disabled = !pagination.has_next;

    if (dom.currentPageIndicator) {
      dom.currentPageIndicator.textContent = `Page ${pagination.current_page} of ${pagination.total_pages}`;
    }

    if (dom.paginationMeta) {
      const start = (pagination.current_page - 1) * pagination.per_page + 1;
      const end = Math.min(pagination.current_page * pagination.per_page, pagination.total_items);
      dom.paginationMeta.textContent = pagination.total_items > 0
        ? `Showing ${start}–${end} of ${pagination.total_items.toLocaleString()} leads (${pagination.per_page}/page)`
        : 'No leads available';
    }
  }

  /**
   * Detail Modal — Display lead profile & exact Question & Answer click timeline
   */
  async function openDetailModal(leadId) {
    if (!dom.detailModal) return;

    dom.detailLeadRef.textContent = 'Loading...';
    dom.detailProfileGrid.innerHTML = '<div style="color: var(--text-muted);">Fetching details...</div>';
    dom.detailTimelineList.innerHTML = '';
    dom.detailModal.classList.add('open');

    try {
      const res = await fetch(`/api/lead-detail?id=${leadId}`);
      const data = await res.json();

      if (!data.success || !data.lead) {
        throw new Error(data.message || 'Failed to load details');
      }

      const lead = data.lead;
      const interactions = data.interactions || [];

      dom.detailLeadRef.textContent = lead.lead_reference;

      dom.detailProfileGrid.innerHTML = `
        <div>
          <div class="profile-field-label">Full Name</div>
          <div class="profile-field-value">${escapeHtml(lead.full_name || '—')}</div>
        </div>
        <div>
          <div class="profile-field-label">Status</div>
          <div class="profile-field-value">
            ${lead.status === 'completed' 
              ? '<span class="badge badge-completed">Completed</span>' 
              : '<span class="badge badge-partial">Partial (Step ' + escapeHtml(lead.current_step) + ')</span>'}
          </div>
        </div>
        <div>
          <div class="profile-field-label">Primary Mobile</div>
          <div class="profile-field-value">${lead.mobile_number ? '+91 ' + escapeHtml(lead.mobile_number) : '—'}</div>
        </div>
        <div>
          <div class="profile-field-label">WhatsApp Number</div>
          <div class="profile-field-value">${lead.whatsapp_number ? '+91 ' + escapeHtml(lead.whatsapp_number) : '—'}</div>
        </div>
        <div>
          <div class="profile-field-label">Trading Segment</div>
          <div class="profile-field-value">${escapeHtml(lead.trading_segment || '—')}</div>
        </div>
        <div>
          <div class="profile-field-label">Trading Capital</div>
          <div class="profile-field-value">${escapeHtml(lead.trading_capital || '—')}</div>
        </div>
        <div>
          <div class="profile-field-label">Biggest Challenge</div>
          <div class="profile-field-value">${escapeHtml(lead.challenge || '—')}</div>
        </div>
        <div>
          <div class="profile-field-label">Residence State</div>
          <div class="profile-field-value">${escapeHtml(lead.state || '—')}</div>
        </div>
        <div>
          <div class="profile-field-label">Marketing Source</div>
          <div class="profile-field-value">${escapeHtml(lead.utm_source || 'Direct / Organic')}</div>
        </div>
        <div>
          <div class="profile-field-label">Created Timestamp</div>
          <div class="profile-field-value">${formatDate(lead.created_at)}</div>
        </div>
      `;

      if (interactions.length === 0) {
        dom.detailTimelineList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.82rem;">No click audit records found for this session.</div>';
      } else {
        let timelineHtml = '';
        interactions.forEach(function (int, i) {
          const actionBadge = int.action_type === 'option_click'
            ? '<span style="color: #38bdf8; font-weight: 600;">[Option Selected]</span>'
            : (int.action_type === 'continue_click' ? '<span style="color: #f59e0b; font-weight: 600;">[Continue Clicked]</span>' : '<span style="color: #10b981; font-weight: 600;">[Submitted]</span>');

          timelineHtml += `
            <div class="timeline-item">
              <div class="timeline-header">
                <span class="timeline-step">Step ${escapeHtml(int.step_number)} &bull; ${actionBadge}</span>
                <span class="timeline-time">${formatDate(int.created_at)}</span>
              </div>
              <div class="timeline-question">Q: ${escapeHtml(int.question)}</div>
              <div class="timeline-answer">A: ${escapeHtml(int.selected_answer)}</div>
            </div>
          `;
        });
        dom.detailTimelineList.innerHTML = timelineHtml;
      }

    } catch (err) {
      dom.detailProfileGrid.innerHTML = `<div style="color: #f87171;">Error: ${escapeHtml(err.message)}</div>`;
    }
  }

  function closeDetailModal() {
    if (dom.detailModal) dom.detailModal.classList.remove('open');
  }

  /**
   * Delete Modal — Confirmation dialog for deleting individual lead
   */
  function openDeleteModal(leadId, leadRef, leadName) {
    state.activeLeadToDelete = leadId;
    if (dom.deleteLeadRefSpan) {
      dom.deleteLeadRefSpan.textContent = `${leadRef} (${leadName})`;
    }
    if (dom.deleteModal) {
      dom.deleteModal.classList.add('open');
    }
  }

  function closeDeleteModal() {
    state.activeLeadToDelete = null;
    if (dom.deleteModal) {
      dom.deleteModal.classList.remove('open');
    }
  }

  /**
   * Execute Lead Deletion
   */
  async function executeDeleteLead() {
    if (!state.activeLeadToDelete) return;

    if (dom.btnDeleteConfirm) {
      dom.btnDeleteConfirm.disabled = true;
      dom.btnDeleteConfirm.textContent = 'Deleting...';
    }

    try {
      const response = await fetch('/api/delete-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: state.activeLeadToDelete })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete lead');
      }

      closeDeleteModal();
      showToast(data.message || 'Lead deleted successfully.');
      
      // Reload stats and leads
      loadStats();
      loadLeads();

    } catch (err) {
      alert('Delete Failed: ' + err.message);
    } finally {
      if (dom.btnDeleteConfirm) {
        dom.btnDeleteConfirm.disabled = false;
        dom.btnDeleteConfirm.textContent = 'Yes, Delete Lead';
      }
    }
  }

  function showToast(msg) {
    if (!dom.toast) return;
    if (dom.toastMessage) dom.toastMessage.textContent = msg;
    dom.toast.classList.add('show');
    setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(dtStr) {
    if (!dtStr) return '—';
    try {
      const d = new Date(dtStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return dtStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dtStr;
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', init);
})();
