// 참여자 관리. 등록한 참여자를 이 브라우저에만 저장하고(localStorage), 목록에서
// Aurora 계산 로직으로 예상 ARRG 수령액을 자동 계산합니다. 서버가 없으므로 다른
// 기기/브라우저와는 동기화되지 않습니다.
(function () {
  const STORAGE_KEY = 'aurora_participants_v1';

  function fmt(n, decimals) {
    if (decimals === undefined) decimals = 0;
    return Number(n).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function getTier(arrg) {
    if (arrg < 350000) return { pct: 0.06 };
    if (arrg < 700000) return { pct: 0.08 };
    if (arrg < 1050000) return { pct: 0.1 };
    return { pct: 0.12 };
  }

  // rewards.html의 계산 공식과 동일 (assets/calculator.js 참고).
  function compute(amount, days) {
    amount = isNaN(amount) || amount < 0 ? 0 : amount;
    days = isNaN(days) || days < 0 ? 0 : days;
    const doubled = amount * 0.35 * 2;
    const arrg = doubled / 0.01;
    const tier = getTier(arrg);
    const monthly = arrg / 15;
    const daily = (arrg * tier.pct) / 365;
    const monthlyTotal15 = monthly * 15;
    const interestTotal15 = arrg * (tier.pct / 12) * 15;
    const preBonus = daily * days;
    const grandTotal = monthlyTotal15 + interestTotal15 + preBonus;
    return { arrg, grandTotal };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function save(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      /* localStorage 사용 불가 시 무시 (새로고침 전까지는 화면에 그대로 반영됨) */
    }
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const nameInput = document.getElementById('pName');
    const amountInput = document.getElementById('pAmount');
    const daysInput = document.getElementById('pDays');
    const addBtn = document.getElementById('pAddBtn');
    const exportBtn = document.getElementById('pExportBtn');
    const tbody = document.getElementById('pTableBody');
    const tableWrap = document.getElementById('pTableWrap');
    const emptyHint = document.getElementById('pEmptyHint');
    const statCount = document.getElementById('pStatCount');
    const statAmount = document.getElementById('pStatAmount');
    const statArrg = document.getElementById('pStatArrg');
    if (!tbody) return;

    let list = load();

    function render() {
      tbody.innerHTML = '';
      let totalAmount = 0;
      let totalGrand = 0;

      list.forEach(function (p) {
        const r = compute(p.amount, p.days);
        totalAmount += p.amount;
        totalGrand += r.grandTotal;

        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(p.name || '(이름 없음)') + '</td>' +
          '<td class="num">$' + fmt(p.amount) + '</td>' +
          '<td class="num">' + fmt(p.days) + '일</td>' +
          '<td class="num">' + fmt(r.arrg) + ' ARRG</td>' +
          '<td class="num">≈ ' + fmt(r.grandTotal) + ' ARRG</td>' +
          '<td><button type="button" class="p-del-btn" data-id="' + p.id + '">삭제</button></td>';
        tbody.appendChild(tr);
      });

      const hasRows = list.length > 0;
      if (tableWrap) tableWrap.hidden = !hasRows;
      if (emptyHint) emptyHint.hidden = hasRows;
      if (statCount) statCount.textContent = list.length;
      if (statAmount) statAmount.textContent = '$' + fmt(totalAmount);
      if (statArrg) statArrg.textContent = fmt(totalGrand);
    }

    tbody.addEventListener('click', function (e) {
      const btn = e.target.closest('.p-del-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      list = list.filter(function (p) {
        return String(p.id) !== String(id);
      });
      save(list);
      render();
    });

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        const amount = parseFloat(amountInput.value);
        const days = parseFloat(daysInput.value);
        if (isNaN(amount) || amount <= 0) {
          amountInput.focus();
          return;
        }
        list.push({
          id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
          name: (nameInput.value || '').trim(),
          amount: amount,
          days: isNaN(days) || days < 0 ? 0 : days,
        });
        save(list);
        nameInput.value = '';
        amountInput.value = '';
        daysInput.value = '0';
        render();
        nameInput.focus();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        if (!list.length) return;
        const rows = [['이름/지갑', '참여금액(USD)', '상장까지 남은 일수', 'ARRG 전환', '총 예상 수령(ARRG)']];
        list.forEach(function (p) {
          const r = compute(p.amount, p.days);
          rows.push([p.name || '', p.amount, p.days, Math.round(r.arrg), Math.round(r.grandTotal)]);
        });
        const csv = rows
          .map(function (row) {
            return row
              .map(function (cell) {
                const s = String(cell).replace(/"/g, '""');
                return /[",\n]/.test(s) ? '"' + s + '"' : s;
              })
              .join(',');
          })
          .join('\r\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mesin-participants.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    render();
  });
})();
