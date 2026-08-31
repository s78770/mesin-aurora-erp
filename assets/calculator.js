// Aurora 패키지 예상 수령 계산 로직.
// amountInput/daysInput 이 있는 페이지(rewards.html)에서 값을 바꾸면
// localStorage 에 저장되고, 다른 페이지(timeline.html 등)에서도
// 같은 값을 불러와 화면에 반영합니다. (페이지 이동 시 값 유지)
(function () {
  const STORAGE_KEY = 'aurora_calc_state_v1';

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { amount: 0, days: 0 };
      const s = JSON.parse(raw);
      return {
        amount: Number.isFinite(Number(s.amount)) ? Number(s.amount) : 0,
        days: Number.isFinite(Number(s.days)) ? Number(s.days) : 0,
      };
    } catch (e) {
      return { amount: 0, days: 0 };
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* localStorage 사용 불가 시 무시 */
    }
  }

  function fmt(n, decimals) {
    if (decimals === undefined) decimals = 0;
    return Number(n).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function getTier(arrg) {
    if (arrg < 350000) return { idx: 0, pct: 0.06, label: '6%' };
    if (arrg < 700000) return { idx: 1, pct: 0.08, label: '8%' };
    if (arrg < 1050000) return { idx: 2, pct: 0.1, label: '10%' };
    return { idx: 3, pct: 0.12, label: '12%' };
  }

  // 15개월 이자 누적: (연이율 ÷ 12개월) × 15개월 로 계산
  function compute(amount, days) {
    amount = isNaN(amount) || amount < 0 ? 0 : amount;
    days = isNaN(days) || days < 0 ? 0 : days;

    const doubled = amount * 0.35 * 2; // 참여금의 35% x2
    const arrg = doubled / 0.01; // ARRG 전환
    const tier = getTier(arrg);
    const monthly = arrg / 15;
    const daily = (arrg * tier.pct) / 365;
    const monthlyTotal15 = monthly * 15; // == arrg
    const interestTotal15 = arrg * (tier.pct / 12) * 15;
    const preBonus = daily * days;
    const grandTotal = monthlyTotal15 + interestTotal15 + preBonus;

    return {
      amount, days, doubled, arrg, tier, monthly, daily,
      monthlyTotal15, interestTotal15, preBonus, grandTotal,
    };
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function render(r) {
    // ---- 상단 흐름 chips (rewards) ----
    setText('chipAmount', '$' + fmt(r.amount));
    setText('chipDouble', '$' + fmt(r.doubled));
    setText('chipArrg', fmt(r.arrg));

    // ---- Step1 (rewards) ----
    setText('stakeAmt', fmt(r.arrg));

    // ---- 카드① 원금 리워드 (rewards) ----
    setText('monthlyReward', fmt(r.monthly, 2));
    setText('monthlyFormula', fmt(r.arrg) + ' ÷ 15개월 = ' + fmt(r.monthly, 2) + ' ARRG');
    setText('monthlyTotal', fmt(r.monthlyTotal15) + ' ARRG');

    // ---- APY 테이블 활성화 (rewards) ----
    const apyTable = document.getElementById('apyTable');
    if (apyTable) {
      apyTable.querySelectorAll('.apy-row').forEach(function (row) {
        row.classList.remove('active');
        const badge = row.querySelector('.apy-badge');
        if (badge) badge.remove();
      });
      const activeRow = apyTable.querySelector('.apy-row[data-tier="' + r.tier.idx + '"]');
      if (activeRow) {
        activeRow.classList.add('active');
        const rangeSpan = activeRow.querySelector('.apy-range');
        const b = document.createElement('span');
        b.className = 'apy-badge';
        b.textContent = '내 구간';
        rangeSpan.appendChild(b);
      }
    }

    // ---- 카드② 스테이킹 이자 (rewards) ----
    setText('dailyInterest', fmt(r.daily, 2));
    setText('dailyFormula', fmt(r.arrg) + ' × ' + r.tier.label + ' ÷ 365일 = ' + fmt(r.daily, 2) + ' ARRG');
    setText('interestTotal', '≈ ' + fmt(r.interestTotal15) + ' ARRG');

    // ---- 타임라인 (timeline) ----
    setText('tlDate1', '오늘 ~ 상장 전 · 예시 ' + fmt(r.days) + '일');
    setText('tlDaily1', fmt(r.daily, 2) + '개');
    setHTML(
      'tlBonusFormula',
      '예: ' + fmt(r.days) + '일 남았다면 → ' + fmt(r.daily, 2) + ' × ' + fmt(r.days) +
        ' = <span class="num-hl">' + fmt(r.preBonus) + ' ARRG</span> 추가 적립'
    );
    setText('tlPillMonthly', '월 ' + fmt(r.monthly, 2) + ' ARRG');
    setText('tlPillDaily', '일 ' + fmt(r.daily, 2) + ' ARRG');
    setText('tlPillFinish', '15회 완료 시 ' + fmt(r.monthlyTotal15) + ' ARRG');

    // ---- 요약 (rewards top-summary) ----
    setText('summaryTitle', '$' + fmt(r.amount) + ' 참여 · 상장까지 ' + fmt(r.days) + '일 남은 경우 · 총 예상 수령');
    setText('sumA', fmt(r.monthlyTotal15));
    setText('sumB', '≈ ' + fmt(r.interestTotal15));
    setText('sumC', fmt(r.preBonus));
    setText('tsBonusFormula', '일일이자 ' + fmt(r.daily, 2) + ' × 남은 ' + fmt(r.days) + '일 = ' + fmt(r.preBonus) + ' ARRG');
    setText('sumTotal', '≈ ' + fmt(r.grandTotal));

    // ---- preset 버튼 active 표시 (rewards) ----
    document.querySelectorAll('.preset-btn').forEach(function (btn) {
      btn.classList.toggle('active', parseFloat(btn.dataset.val) === r.amount);
    });
  }

  function recalcFromInputs() {
    const amountInput = document.getElementById('amountInput');
    const daysInput = document.getElementById('daysInput');
    const amount = amountInput ? parseFloat(amountInput.value) : loadState().amount;
    const days = daysInput ? parseFloat(daysInput.value) : loadState().days;
    const state = { amount: isNaN(amount) ? 0 : amount, days: isNaN(days) ? 0 : days };
    saveState(state);
    render(compute(state.amount, state.days));
  }

  function init() {
    const state = loadState();
    const amountInput = document.getElementById('amountInput');
    const daysInput = document.getElementById('daysInput');

    if (amountInput) amountInput.value = state.amount;
    if (daysInput) daysInput.value = state.days;

    if (amountInput) amountInput.addEventListener('input', recalcFromInputs);
    if (daysInput) daysInput.addEventListener('input', recalcFromInputs);

    document.querySelectorAll('.preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (amountInput) amountInput.value = btn.dataset.val;
        recalcFromInputs();
      });
    });

    render(compute(state.amount, state.days));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
