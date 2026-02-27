/*
Name: Sama Salem Saloum
ID: 2205679
Section: CPCS403
Date: 27-02-2026
File: scripts/main.js
Purpose: ShipSmart JS (nav toggle, form validation, demo results timeline)
*/

(() => {
  "use strict";

  // ===== Elements =====
  const navToggle = document.querySelector(".nav-toggle");
  const trackForm = document.getElementById("trackForm");
  const trackingInput = document.getElementById("trackingNumber");
  const carrierSelect = document.getElementById("carrier");
  const demoMode = document.getElementById("demoMode");

  const trackingError = document.getElementById("trackingError");
  const carrierError = document.getElementById("carrierError");

  const loadingBox = document.getElementById("loadingBox");
  const resultArea = document.getElementById("resultArea");

  const statusBadge = document.getElementById("statusBadge");
  const rCarrier = document.getElementById("rCarrier");
  const rTracking = document.getElementById("rTracking");
  const rEta = document.getElementById("rEta");
  const rUpdate = document.getElementById("rUpdate");

  const newSearchBtn = document.getElementById("newSearchBtn");
  const steps = Array.from(document.querySelectorAll(".step"));

  // ===== Helpers =====
  const labelCarrier = (val) => {
    const map = { aramex: "Aramex", dhl: "DHL", fedex: "FedEx", smsa: "SMSA" };
    return map[val] || "—";
  };

  const setBadge = (text, type = "info") => {
    statusBadge.textContent = text;
    statusBadge.className = "badge";
    if (type === "ok") statusBadge.classList.add("ok");
    if (type === "warn") statusBadge.classList.add("warn");
  };

  const clearErrors = () => {
    trackingError.textContent = "";
    carrierError.textContent = "";
  };

  const isValidTracking = (v) => {
    const value = (v || "").trim();
    // simple rule: at least 6 chars, letters/numbers/- allowed
    return value.length >= 6 && /^[A-Za-z0-9-]+$/.test(value);
  };

  const validate = () => {
    clearErrors();
    let ok = true;

    if (!isValidTracking(trackingInput.value)) {
      trackingError.textContent = "Enter a valid tracking number (min 6 characters, letters/numbers).";
      ok = false;
    }
    if (!carrierSelect.value) {
      carrierError.textContent = "Please select a carrier.";
      ok = false;
    }
    return ok;
  };

  const showLoading = (on) => { loadingBox.hidden = !on; };
  const showResult = (on) => { resultArea.hidden = !on; };

  const resetTimeline = () => {
    steps.forEach(s => s.classList.remove("done", "active"));
  };

  const setTimeline = (key) => {
    const order = ["created", "picked", "transit", "out", "delivered"];
    const idx = order.indexOf(key);
    resetTimeline();

    steps.forEach((li) => {
      const i = order.indexOf(li.dataset.step);
      if (i < idx) li.classList.add("done");
      if (i === idx) li.classList.add("active");
    });
  };

  // Save last carrier
  const STORAGE_KEY = "shipsmart_last_carrier";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) carrierSelect.value = saved;

  carrierSelect.addEventListener("change", () => {
    if (carrierSelect.value) localStorage.setItem(STORAGE_KEY, carrierSelect.value);
  });

  // Demo scenarios
  const demo = [
    { status: "In Transit", type: "info", step: "transit", etaDays: 3 },
    { status: "Out for Delivery", type: "warn", step: "out", etaDays: 1 },
    { status: "Delivered", type: "ok", step: "delivered", etaDays: 0 },
  ];

  const renderDemo = () => {
    const pick = demo[Math.floor(Math.random() * demo.length)];
    const now = new Date();

    const eta = new Date(now);
    eta.setDate(eta.getDate() + pick.etaDays);

    rCarrier.textContent = labelCarrier(carrierSelect.value);
    rTracking.textContent = trackingInput.value.trim().toUpperCase();
    rEta.textContent = pick.etaDays === 0 ? "Delivered" : eta.toDateString();
    rUpdate.textContent = now.toLocaleString();

    setBadge(pick.status, pick.type);
    setTimeline(pick.step);

    showResult(true);
  };

  // ===== Events =====
  navToggle?.addEventListener("click", () => {
    const opened = document.body.classList.toggle("menu-open");
    navToggle.setAttribute("aria-expanded", String(opened));
  });

  trackForm?.addEventListener("submit", (e) => {
    if (!validate()) {
      e.preventDefault();
      return;
    }

    // If demo mode enabled -> show result on this page (no PHP needed)
    if (demoMode?.checked) {
      e.preventDefault();

      showResult(false);
      resetTimeline();
      setBadge("Loading", "info");

      showLoading(true);
      setTimeout(() => {
        showLoading(false);
        renderDemo();
      }, 900);

      return;
    }

    // Otherwise: allow normal POST to server/track.php (backend by Member B)
  });

  newSearchBtn?.addEventListener("click", () => {
    showResult(false);
    showLoading(false);
    resetTimeline();
    clearErrors();
    trackingInput.value = "";
    trackingInput.focus();
  });
})();