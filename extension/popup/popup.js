/**
 * LexPort Chrome Extension — Toolbar Popup Controller
 * Manages Server Health, Seller Profile/Auth, and Active Tab Audits
 */

document.addEventListener("DOMContentLoaded", async () => {
  const serverStatusPill = document.getElementById("lx-server-status");
  const serverStatusText = serverStatusPill.querySelector(".lx-status-text");
  const activeTitleEl = document.getElementById("lx-active-title");
  const auditBtn = document.getElementById("lx-btn-audit-tab");
  const benchAccEl = document.getElementById("lx-bench-acc");
  const benchF1El = document.getElementById("lx-bench-f1");
  const sellerNameEl = document.getElementById("lx-seller-name");
  const sellerIdEl = document.getElementById("lx-seller-id");
  const originSelect = document.getElementById("lx-origin-select");

  // 1. Check Server Health
  chrome.runtime.sendMessage({ action: "CHECK_SERVER_HEALTH" }, (res) => {
    if (res && res.online) {
      serverStatusPill.className = "lx-server-pill lx-online";
      serverStatusText.innerText = `Online (${res.version || "8000"})`;
    } else {
      serverStatusPill.className = "lx-server-pill lx-offline";
      serverStatusText.innerText = "Backend Offline";
    }
  });

  // 2. Fetch Seller Profile & Authentication Status
  chrome.runtime.sendMessage({ action: "GET_AUTH_STATUS" }, (res) => {
    if (res && res.sellerProfile) {
      const p = res.sellerProfile;
      sellerNameEl.innerText = p.sellerName || "Apex Global Direct";
      sellerIdEl.innerText = `ID: ${p.sellerId || "SELLER-APEX-9842"}`;
      if (p.originCountry && originSelect) {
        originSelect.value = p.originCountry;
      }
    }
  });

  // Handle Origin Change
  originSelect.addEventListener("change", () => {
    chrome.runtime.sendMessage({
      action: "LOGIN_SELLER",
      payload: { originCountry: originSelect.value }
    });
  });

  // 3. Query Active Tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.title) {
      activeTitleEl.innerText = tab.title;
    } else {
      activeTitleEl.innerText = "No active webpage detected";
    }
  });

  // 4. Query Benchmark Stats
  chrome.runtime.sendMessage({ action: "GET_BENCHMARK_STATS" }, (res) => {
    if (res && res.stats) {
      benchAccEl.innerText = `${res.stats.accuracy_score.toFixed(0)}%`;
      benchF1El.innerText = res.stats.f1_score.toFixed(3);
    }
  });

  // 5. Handle Market Toggles
  const marketCheckboxes = document.querySelectorAll(".lx-markets-grid input");
  chrome.runtime.sendMessage({ action: "GET_SETTINGS" }, (settings) => {
    if (settings && settings.targetMarkets) {
      marketCheckboxes.forEach((cb) => {
        cb.checked = settings.targetMarkets.includes(cb.value);
      });
    }
  });

  marketCheckboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const selected = Array.from(marketCheckboxes)
        .filter((c) => c.checked)
        .map((c) => c.value);
      chrome.runtime.sendMessage({
        action: "SAVE_SETTINGS",
        payload: { targetMarkets: selected }
      });
    });
  });

  // 6. Handle Audit Buttons
  const geminiBtn = document.getElementById("lx-btn-audit-gemini");

  function triggerTabAudit(enableGemini) {
    if (auditBtn) auditBtn.disabled = true;
    if (geminiBtn) geminiBtn.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "TRIGGER_AUDIT_FROM_POPUP", enableGemini },
          (response) => {
            if (chrome.runtime.lastError || !response) {
              // Fallback script execution if message listener wasn't registered yet
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (withGemini) => {
                  window.__lexport_requested_gemini = withGemini;
                  const pill = document.querySelector("#lexport-pill");
                  if (pill) pill.click();
                },
                args: [enableGemini]
              });
            }
            setTimeout(() => {
              window.close();
            }, 300);
          }
        );
      }
    });
  }

  if (auditBtn) {
    auditBtn.addEventListener("click", () => {
      auditBtn.innerText = "⚡ Scanning...";
      triggerTabAudit(false);
    });
  }

  if (geminiBtn) {
    geminiBtn.addEventListener("click", () => {
      geminiBtn.innerText = "✨ Running Gemini AI...";
      triggerTabAudit(true);
    });
  }
});
