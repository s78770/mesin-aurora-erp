// 설정 페이지: 상장 예정일 / 보상 프리셋 금액 / 계산기 초기화.
// 여기서 저장한 값은 다른 페이지(대시보드 카운트다운, 보상 프리셋 버튼)에서 그대로 읽어갑니다.
(function () {
  const LISTING_DATE_KEY = 'aurora_listing_date_v1';
  const PRESETS_KEY = 'aurora_presets_v1';
  const DEFAULT_PRESETS = [3000, 5000, 10000, 15000, 30000];

  function flash(btn, text) {
    const original = btn.textContent;
    btn.textContent = text;
    setTimeout(function () {
      btn.textContent = original;
    }, 1500);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // ---- 계산기 초기화 ----
    const resetBtn = document.getElementById('resetCalcBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        try {
          localStorage.removeItem('aurora_calc_state_v1');
        } catch (e) {}
        flash(resetBtn, '초기화 완료 ✓');
      });
    }

    // ---- 상장 예정일 ----
    const dateInput = document.getElementById('listingDateInput');
    const saveDateBtn = document.getElementById('saveListingDateBtn');
    const clearDateBtn = document.getElementById('clearListingDateBtn');
    if (dateInput) {
      try {
        const saved = localStorage.getItem(LISTING_DATE_KEY);
        if (saved) dateInput.value = saved;
      } catch (e) {}
    }
    if (saveDateBtn) {
      saveDateBtn.addEventListener('click', function () {
        try {
          if (dateInput.value) localStorage.setItem(LISTING_DATE_KEY, dateInput.value);
          else localStorage.removeItem(LISTING_DATE_KEY);
        } catch (e) {}
        flash(saveDateBtn, '저장됨 ✓');
      });
    }
    if (clearDateBtn) {
      clearDateBtn.addEventListener('click', function () {
        dateInput.value = '';
        try {
          localStorage.removeItem(LISTING_DATE_KEY);
        } catch (e) {}
        flash(clearDateBtn, '초기화됨 ✓');
      });
    }

    // ---- 프리셋 금액 ----
    const presetInputs = [0, 1, 2, 3, 4].map(function (i) {
      return document.getElementById('preset' + i);
    });
    const savePresetsBtn = document.getElementById('savePresetsBtn');
    const resetPresetsBtn = document.getElementById('resetPresetsBtn');

    function loadPresets() {
      try {
        const raw = localStorage.getItem(PRESETS_KEY);
        const arr = raw ? JSON.parse(raw) : null;
        if (Array.isArray(arr) && arr.length === 5) return arr;
      } catch (e) {}
      return DEFAULT_PRESETS.slice();
    }

    function fillPresetInputs(values) {
      presetInputs.forEach(function (input, i) {
        if (input) input.value = values[i];
      });
    }

    if (presetInputs[0]) fillPresetInputs(loadPresets());

    if (savePresetsBtn) {
      savePresetsBtn.addEventListener('click', function () {
        const values = presetInputs.map(function (input) {
          const n = parseFloat(input.value);
          return isNaN(n) || n < 0 ? 0 : n;
        });
        try {
          localStorage.setItem(PRESETS_KEY, JSON.stringify(values));
        } catch (e) {}
        flash(savePresetsBtn, '저장됨 ✓');
      });
    }
    if (resetPresetsBtn) {
      resetPresetsBtn.addEventListener('click', function () {
        fillPresetInputs(DEFAULT_PRESETS);
        try {
          localStorage.removeItem(PRESETS_KEY);
        } catch (e) {}
        flash(resetPresetsBtn, '초기화됨 ✓');
      });
    }
  });
})();
