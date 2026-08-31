// 참여자 관리. Supabase(참여자 테이블)에 저장되어 이 링크에 접속하는 모든 사람이
// 같은 데이터를 봅니다. 접근은 공유 비밀번호로 가볍게 막아두지만(아래 SHARED_PASSWORD),
// 이 값은 페이지 소스에 그대로 노출되므로 완전한 보안은 아닙니다 — 외부인의 우연한/실수
// 접근을 막는 용도로만 사용하세요. 참여자 데이터를 진짜로 보호해야 한다면 Supabase Auth +
// RLS 정책으로 교체해야 합니다.
(function () {
  const SUPABASE_URL = 'https://euiyywzyhvxstqxqbpek.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1aXl5d3p5aHZ4c3RxeHFicGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODcyNzUsImV4cCI6MjEwMzc2MzI3NX0.LT-1BYihLZAFsUwO8TNZ6dNp8mNwl27IDPmvcF7yFu8';
  const REST_URL = SUPABASE_URL + '/rest/v1/participants';
  const SHARED_PASSWORD = 'Aurora2026!';
  const AUTH_KEY = 'aurora_participants_auth_v1'; // 이 페이지 전용 잠금 상태 (브라우저별 localStorage)

  function restHeaders(extra) {
    return Object.assign(
      {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      extra || {}
    );
  }

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

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  async function fetchParticipants() {
    const res = await fetch(REST_URL + '?select=*&order=created_at.asc', {
      headers: restHeaders(),
    });
    if (!res.ok) throw new Error('load failed: ' + res.status);
    return res.json();
  }

  async function insertParticipant(p) {
    const res = await fetch(REST_URL, {
      method: 'POST',
      headers: restHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify([{ name: p.name, amount: p.amount, days: p.days }]),
    });
    if (!res.ok) throw new Error('insert failed: ' + res.status);
    return res.json();
  }

  async function deleteParticipant(id) {
    const res = await fetch(REST_URL + '?id=eq.' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: restHeaders(),
    });
    if (!res.ok) throw new Error('delete failed: ' + res.status);
  }

  function initGate(onUnlocked) {
    const gate = document.getElementById('pGate');
    const content = document.getElementById('pContent');
    const pwInput = document.getElementById('pGatePassword');
    const submitBtn = document.getElementById('pGateSubmit');
    const errorEl = document.getElementById('pGateError');
    if (!gate || !content) {
      if (typeof onUnlocked === 'function') onUnlocked();
      return;
    }

    let unlocked = false;
    try {
      unlocked = localStorage.getItem(AUTH_KEY) === '1';
    } catch (e) {
      /* localStorage 사용 불가 시 매번 비밀번호 입력 */
    }

    function reveal() {
      gate.hidden = true;
      content.hidden = false;
      if (typeof onUnlocked === 'function') onUnlocked();
    }

    if (unlocked) {
      reveal();
      return;
    }

    function trySubmit() {
      if (pwInput.value === SHARED_PASSWORD) {
        try {
          localStorage.setItem(AUTH_KEY, '1');
        } catch (e) {
          /* 저장 실패해도 이번 방문에서는 계속 진행 */
        }
        reveal();
      } else {
        if (errorEl) errorEl.hidden = false;
        pwInput.value = '';
        pwInput.focus();
      }
    }

    if (submitBtn) submitBtn.addEventListener('click', trySubmit);
    if (pwInput) {
      pwInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') trySubmit();
      });
      pwInput.focus();
    }
  }

  function initApp() {
    const nameInput = document.getElementById('pName');
    const amountInput = document.getElementById('pAmount');
    const daysInput = document.getElementById('pDays');
    const addBtn = document.getElementById('pAddBtn');
    const exportBtn = document.getElementById('pExportBtn');
    const tbody = document.getElementById('pTableBody');
    const tableWrap = document.getElementById('pTableWrap');
    const emptyHint = document.getElementById('pEmptyHint');
    const loadingHint = document.getElementById('pLoadingHint');
    const errorHint = document.getElementById('pErrorHint');
    const statCount = document.getElementById('pStatCount');
    const statAmount = document.getElementById('pStatAmount');
    const statArrg = document.getElementById('pStatArrg');
    if (!tbody) return;

    let list = [];

    function renderRows() {
      tbody.innerHTML = '';
      let totalAmount = 0;
      let totalGrand = 0;

      list.forEach(function (p) {
        const r = compute(p.amount, p.days);
        totalAmount += Number(p.amount) || 0;
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
      if (emptyHint) emptyHint.hidden = !hasRows ? false : true;
      if (statCount) statCount.textContent = list.length;
      if (statAmount) statAmount.textContent = '$' + fmt(totalAmount);
      if (statArrg) statArrg.textContent = fmt(totalGrand);
    }

    async function reload() {
      if (loadingHint) loadingHint.hidden = false;
      if (errorHint) errorHint.hidden = true;
      try {
        list = await fetchParticipants();
        renderRows();
      } catch (e) {
        if (errorHint) errorHint.hidden = false;
      } finally {
        if (loadingHint) loadingHint.hidden = true;
      }
    }

    tbody.addEventListener('click', async function (e) {
      const btn = e.target.closest('.p-del-btn');
      if (!btn) return;
      btn.disabled = true;
      btn.textContent = '삭제 중...';
      try {
        await deleteParticipant(btn.dataset.id);
        await reload();
      } catch (e2) {
        btn.disabled = false;
        btn.textContent = '삭제';
        alert('삭제에 실패했습니다. 네트워크 상태를 확인해주세요.');
      }
    });

    if (addBtn) {
      addBtn.addEventListener('click', async function () {
        const amount = parseFloat(amountInput.value);
        const days = parseFloat(daysInput.value);
        if (isNaN(amount) || amount <= 0) {
          amountInput.focus();
          return;
        }
        addBtn.disabled = true;
        addBtn.textContent = '추가 중...';
        try {
          await insertParticipant({
            name: (nameInput.value || '').trim(),
            amount: amount,
            days: isNaN(days) || days < 0 ? 0 : days,
          });
          nameInput.value = '';
          amountInput.value = '';
          daysInput.value = '0';
          await reload();
          nameInput.focus();
        } catch (e) {
          alert('추가에 실패했습니다. 네트워크 상태를 확인해주세요.');
        } finally {
          addBtn.disabled = false;
          addBtn.textContent = '+ 참여자 추가';
        }
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

    reload();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initGate(initApp);
  });
})();
