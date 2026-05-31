/*
 * File: scripts/search.js
 * Purpose: Live search and filtering for ShipSmart shipments page
 */

(() => {
  "use strict";

  const searchInput   = document.getElementById("searchQuery");
  const searchForm    = document.getElementById("searchForm");
  const searchBtn     = document.getElementById("searchBtn");
  const filterCarrier = document.getElementById("filterCarrier");
  const filterStatus  = document.getElementById("filterStatus");
  const filterCategory = document.getElementById("filterCategory");
  const dateFrom      = document.getElementById("dateFrom");
  const dateTo        = document.getElementById("dateTo");
  const clearBtn      = document.getElementById("clearFiltersBtn");
  const loadingEl     = document.getElementById("searchLoading");
  const resultsEl     = document.getElementById("searchResults");
  const countEl       = document.getElementById("resultCount");
  const emptyEl       = document.getElementById("noResults");

  if (!resultsEl) return;

  const API_URL = "../api/search.php";
  const DEBOUNCE_MS = 400;

  let debounceTimer = null;

  const carrierLabels = {
    aramex: "Aramex",
    dhl: "DHL",
    fedex: "FedEx",
    smsa: "SMSA",
  };

  const statusLabels = {
    created: "Created",
    picked_up: "Picked Up",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
  };

  const categoryLabels = {
    standard: "Standard",
    express: "Express",
    freight: "Freight",
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value + "T00:00:00");
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
  };

  const formatWeight = (kg) => {
    const n = parseFloat(kg);
    return Number.isNaN(n) ? "—" : n.toFixed(2) + " kg";
  };

  const buildParams = () => {
    const params = new URLSearchParams();
    const q = (searchInput?.value || "").trim();
    if (q) params.set("q", q);
    if (filterCarrier?.value) params.set("carrier", filterCarrier.value);
    if (filterStatus?.value) params.set("status", filterStatus.value);
    if (filterCategory?.value) params.set("category", filterCategory.value);
    if (dateFrom?.value) params.set("date_from", dateFrom.value);
    if (dateTo?.value) params.set("date_to", dateTo.value);
    return params;
  };

  const setLoading = (on) => {
    if (loadingEl) loadingEl.hidden = !on;
  };

  const renderCard = (shipment) => {
    const status = shipment.status || "created";
    const card = document.createElement("article");
    card.className = "card shipment-card";
    card.innerHTML = `
      <div class="shipment-card-head">
        <h3 class="shipment-tracking">${escapeHtml(shipment.tracking_number)}</h3>
        <span class="badge badge-status badge-status-${escapeHtml(status)}">${escapeHtml(statusLabels[status] || status)}</span>
      </div>
      <p class="shipment-route">
        <strong>${escapeHtml(shipment.origin_city)}</strong>
        <span class="route-arrow" aria-hidden="true">→</span>
        <strong>${escapeHtml(shipment.destination_city)}</strong>
      </p>
      <div class="shipment-meta">
        <p><span class="meta-label">Carrier</span> ${escapeHtml(carrierLabels[shipment.carrier] || shipment.carrier)}</p>
        <p><span class="meta-label">Category</span> ${escapeHtml(categoryLabels[shipment.category] || shipment.category)}</p>
        <p><span class="meta-label">Weight</span> ${formatWeight(shipment.weight_kg)}</p>
        <p><span class="meta-label">ETA</span> ${formatDate(shipment.estimated_delivery)}</p>
      </div>
    `;
    return card;
  };

  const escapeHtml = (str) => {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  };

  const renderResults = (shipments) => {
    resultsEl.innerHTML = "";

    const count = Array.isArray(shipments) ? shipments.length : 0;
    if (countEl) countEl.textContent = "Showing " + count + " result" + (count === 1 ? "" : "s");

    if (emptyEl) emptyEl.hidden = count > 0;

    if (count === 0) return;

    const fragment = document.createDocumentFragment();
    shipments.forEach((s) => fragment.appendChild(renderCard(s)));
    resultsEl.appendChild(fragment);
  };

  const runSearch = () => {
    const params = buildParams();
    const url = params.toString() ? API_URL + "?" + params.toString() : API_URL;

    setLoading(true);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Search request failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          renderResults(data);
        } else {
          renderResults([]);
        }
      })
      .catch(() => {
        renderResults([]);
        if (countEl) countEl.textContent = "Unable to load shipments";
      })
      .finally(() => setLoading(false));
  };

  const scheduleSearch = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, DEBOUNCE_MS);
  };

  searchInput?.addEventListener("input", scheduleSearch);
  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearTimeout(debounceTimer);
    runSearch();
  });
  searchBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    clearTimeout(debounceTimer);
    runSearch();
  });

  [filterCarrier, filterStatus, filterCategory, dateFrom, dateTo].forEach((el) => {
    el?.addEventListener("change", runSearch);
  });

  clearBtn?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (filterCarrier) filterCarrier.value = "";
    if (filterStatus) filterStatus.value = "";
    if (filterCategory) filterCategory.value = "";
    if (dateFrom) dateFrom.value = "";
    if (dateTo) dateTo.value = "";
    runSearch();
  });

  runSearch();
})();
