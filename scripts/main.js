/*
Name: Sama Salem Saloum
ID: 2205679
Section: CPCS403
Date: 24-02-2026
File: scripts/main.js
Purpose: JavaScript interactivity for ShipSmart (validation, demo results, timeline UI)
*/

(() => {
  "use strict";

  // ===== Elements =====
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
  const navToggle = document.querySelector(".nav-toggle");

  const timelineSteps = Array.from(document.querySelectorAll(".timeline-step"));

  // ===== Utilities =====
  const carrierLabel = (value) => {
    const map = { aramex: "Aramex", dhl: "DHL", fedex: "FedEx", smsa: "SMSA" };
    return map[value] || "—";
  };

  const isValidTracking = (value) => {
    // Letters/numbers only, min length 6
    const v = value.trim();
    if (v.length < 6) return false;
    return /^[A-Za-z0-9-]+$/.test(v);
  };

  const setBadge = (text, type = "info") => {
    statusBadge.textContent = text;
    statusBadge.className = "badge"; // reset
    if (type === "ok") statusBadge.classList.add("ok");
    if (type === "warn") statusBadge.classList.add("warn");
    if (type === "info") statusBadge.classList.add("info");
  };

  const resetTimeline = () => {
    timelineSteps.forEach((li) => {
      li.classList.remove("done", "active");
    });
  };

  const setTimelineProgress = (stepKey) => {
    // Order: created -> picked -> transit -> out -> delivered
    const order = ["created", "picked", "transit", "out", "delivered"];
    const idx = order.indexOf(stepKey);

    resetTimeline();

    timelineSteps.forEach((li) => {
      const key = li.dataset.step;
      const i = order.indexOf(key);
      if (i < idx) li.classList.add("done");
      if (i === idx) li.classList.add("active");
    });
  };

  const showLoading = (show) => {
    loadingBox.hidden = !show;
  };

  const showResult = (show) => {
    resultArea.hidden = !show;
  };

  const clearErrors = () => {
    trackingError.textContent = "";
    carrierError.textContent = "";
  };

  const validateForm = () => {
    clearErrors();
    let ok = true;

    if (!isValidTracking(trackingInput.value)) {
      trackingError.textContent = "Please enter a valid tracking number (min 6 characters, letters/numbers).";
      ok = false;
    }

    if (!carrierSelect.value) {
      carrierError.textContent = "Please select a carrier.";
      ok = false;
    }

    return ok;
  };

  // ===== Save/restore last carrier =====
  const STORAGE_KEY = "shipsmart_last_carrier";
  const savedCarrier = localStorage.getItem(STORAGE_KEY);
  if (savedCarrier && carrierSelect) carrierSelect.value = savedCarrier;

  carrierSelect?.addEventListener("change", () => {
    if (carrierSelect.value) localStorage.setItem(STORAGE_KEY, carrierSelect.value);
  });

  // ===== Demo data (no API needed) =====
  const demoScenarios = [
    { status: "In Transit", badge: "info", step: "transit", etaDays: 3 },
    { status: "Out for Delivery", badge: "warn", step: "out", etaDays: 1 },
    { status: "Delivered", badge: "ok", step: "delivered", etaDays: 0 }
  ];

  const renderDemoResult = () => {
    const scenario = demoScenarios[Math.floor(Math.random() * demoScenarios.length)];
    const now = new Date();

    const eta = new Date(now);
    eta.setDate(eta.getDate() + scenario.etaDays);

    rCarrier.textContent = carrierLabel(carrierSelect.value);
    rTracking.textContent = trackingInput.value.trim().toUpperCase();
    rEta.textContent = scenario.etaDays === 0 ? "Delivered" : eta.toDateString();
    rUpdate.textContent = now.toLocaleString();

    setBadge(scenario.status, scenario.badge);
    setTimelineProgress(scenario.step);

    showResult(true);
  };

  // ===== Form submit =====
  trackForm?.addEventListener("submit", (e) => {
    // If demo mode is ON, prevent PHP submit and show result on same page
    const useDemo = demoMode?.checked;

    if (!validateForm()) {
      e.preventDefault();
      return;
    }

    if (useDemo) {
      e.preventDefault();

      showResult(false);
      showLoading(true);
      setBadge("Loading", "info");
      resetTimeline();

      // Fake delay for nice UX
      setTimeout(() => {
        showLoading(false);
        renderDemoResult();
      }, 900);

      return;
    }

    // If demo mode OFF -> allow normal POST to server/track.php
  });

  // ===== New search button =====
  newSearchBtn?.addEventListener("click", () => {
    showResult(false);
    showLoading(false);
    clearErrors();
    resetTimeline();

    trackingInput.value = "";
    trackingInput.focus();
  });

  // ===== Mobile nav toggle =====
  navToggle?.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("menu-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

})();