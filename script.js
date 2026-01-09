/* ================================
   Perch Option 2: Daily Keyboard Sync (JS panel only)
   - Forces a new-day check
   - Clears cached keyboard state so it can rotate
   - Tries to rebuild using your existing init/build functions
================================== */
(() => {
  const DAY_KEY_STORAGE = "perch__dayKey_v1";

  // Local-date key (so it flips at midnight in YOUR timezone)
  function todayKeyLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // Try to use YOUR existing daily index (anchors), else fallback.
  function getDailyIndexFallback() {
    // Fallback epoch: Jan 1, 2025 (local midnight)
    const epoch = new Date(2025, 0, 1);
    const now = new Date();
    const msPerDay = 86400000;

    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((todayMidnight - epoch) / msPerDay);
  }

  function getDailyIndex() {
    // If your code already has a function that computes the daily rotation index, use it.
    if (typeof window.getDailyIndex === "function") return window.getDailyIndex();
    if (typeof window.getPuzzleIndex === "function") return window.getPuzzleIndex();
    return getDailyIndexFallback();
  }

  function clearKeyboardCache() {
    // These are common “saved state” keys that freeze rotation.
    // (Safe even if some don’t exist.)
    [
      "perch_keyboard",
      "perchKeyboard",
      "keyboardLayout",
      "keyboard_layout",
      "perch_state",
      "perchState",
      "puzzleState"
    ].forEach(k => localStorage.removeItem(k));
  }

  function forceRebuildForNewDay() {
    clearKeyboardCache();

    // If you already have keyboard sets + an apply function, use them:
    const dayIndex = getDailyIndex();

    if (Array.isArray(window.KEYBOARD_SETS) && typeof window.applyKeyboardSet === "function") {
      const set = window.KEYBOARD_SETS[dayIndex % window.KEYBOARD_SETS.length];
      window.applyKeyboardSet(set);
      return;
    }

    // Otherwise try your existing “build/init” functions:
    if (typeof window.buildKeyboard === "function") {
      window.buildKeyboard();
      return;
    }
    if (typeof window.initGame === "function") {
      window.initGame();
      return;
    }
    if (typeof window.startGame === "function") {
      window.startGame();
      return;
    }

    // Last resort: refresh the page so your normal startup path re-runs cleanly
    location.reload();
  }

  function checkNewDayAndSync() {
    const today = todayKeyLocal();
    const last = localStorage.getItem(DAY_KEY_STORAGE);

    if (last === today) return; // same day => do nothing

    localStorage.setItem(DAY_KEY_STORAGE, today);
    forceRebuildForNewDay();
  }

  window.addEventListener("load", checkNewDayAndSync);

  // Also re-check when user returns to the tab (important on iPad)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkNewDayAndSync();
  });
})();
// ===== RESET BUTTON (global) =====
window.hardReset = function () {
  const keysToClear = [
    "perch_today_date",
    "perch_today",
    "perch_daily",
    "perch_daily_pair",
    "perch_daily_seed",
    // optional extras if they exist in your build:
    "perch_state",
    "perch_progress",
    "perch_stats_cache"
  ];

  keysToClear.forEach(k => {
    try { localStorage.removeItem(k); } catch (e) {}
  });

  try { sessionStorage.clear(); } catch (e) {}

  location.reload();
};
/* ================================
   PREMIUM button -> bonus-toast ONLY
   (Blocks any existing premium modal)
================================== */
(function () {
  function firePremiumToast(e) {
    // Use your existing bonus toast if it exists
    if (typeof showToast === "function") {
      showToast("Premium coming soon!");
    } else if (typeof showBonusToast === "function") {
      showBonusToast("Premium coming soon!");
    } else {
      // absolute fallback (shouldn't happen in Perch)
      console.log("Premium coming soon!");
    }
  }

  // Capture clicks/touches anywhere, but ONLY react when Premium footer button is the target
  function handler(e) {
    const btn = e.target && e.target.closest ? e.target.closest("#premiumBtn") : null;
    if (!btn) return;

    // Block the upsell modal + any other handlers
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

    firePremiumToast(e);
    return false;
  }

  document.addEventListener("click", handler, true);
  document.addEventListener("touchstart", handler, true);
  document.addEventListener("pointerup", handler, true);
})();