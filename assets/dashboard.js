// 대시보드: 상장 D-day 카운트다운 + 요약 카드(참여자 수/누적 지급액 등) + 최근 활동 + 주요 공지.
// 참여자/공지 데이터는 Supabase에서 anon key로 읽기만 함 (participants.js/notices.js와 동일한 방식).
(function () {
  const LISTING_DATE_KEY = 'aurora_listing_date_v1';
  const SUPABASE_URL = 'https://euiyywzyhvxstqxqbpek.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1aXl5d3p5aHZ4c3RxeHFicGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODcyNzUsImV4cCI6MjEwMzc2MzI3NX0.LT-1BYihLZAFsUwO8TNZ6dNp8mNwl27IDPmvcF7yFu8';

  function fmt(n, decimals) {
    if (decimals === undefined) decimals = 0;
    return Number(n).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function getListingDate() {
    try {
      const s = localStorage.getItem(LISTING_DATE_KEY) || '';
      return s ? new Date(s + 'T00:00:00') : null;
    } catch (e) {
      return null;
    }
  }

  // ---------- 상장 D-day 카운트다운 ----------
  function renderCountdown() {
    const card = document.getElementById('countdownCard');
    if (!card) return;
    const target = getListingDate();

    if (!target) {
      card.innerHTML =
        '<div class="countdown-label">상장 예정일</div>' +
        '<div class="countdown-empty">아직 상장 예정일이 설정되지 않았습니다.<br>' +
        '<a href="settings.html">설정 페이지</a>에서 날짜를 지정하면 여기에 D-day가 표시됩니다.</div>';
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    let big;
    if (diffDays > 0) big = 'D-' + diffDays;
    else if (diffDays === 0) big = 'D-Day';
    else big = 'D+' + Math.abs(diffDays);

    const dateLabel = target.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    card.innerHTML =
      '<div class="countdown-label">상장 예정일까지</div>' +
      '<div class="countdown-value num">' + big + '</div>' +
      '<div class="countdown-date">' + dateLabel + '</div>';
  }

  // ---------- 보상 계산 공식 (rewards.html의 계산기와 동일. assets/calculator.js 참고) ----------
  function getTier(arrg) {
    if (arrg < 350000) return { pct: 0.06 };
    if (arrg < 700000) return { pct: 0.08 };
    if (arrg < 1050000) return { pct: 0.1 };
    return { pct: 0.12 };
  }

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
    return { arrg, monthly, daily, preBonus, grandTotal };
  }

  // 상장일 기준 매달 1회(총 15회) 원금 리워드 지급 스케줄 계산.
  function monthsBetween(start, today) {
    let months = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    if (today.getDate() < start.getDate()) months -= 1;
    return Math.max(0, months);
  }

  function addMonths(date, n) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d;
  }

  // 참여자 1명의 "오늘 기준 누적 발생액(추정)"을 계산.
  // - 사전 이자(preBonus)는 항상 발생한 것으로 간주 (상장 전 스테이킹 기간에 대한 값이므로).
  // - 원금 리워드는 상장일부터 매달 1회, 스테이킹 이자는 상장 후에도 매일 계속 적립.
  function accruedSoFar(p, listingDate, today) {
    const c = compute(p.amount, p.days);
    let principalPaidCount = 0;
    let postListingInterestDays = 0;

    if (listingDate && today >= listingDate) {
      principalPaidCount = Math.min(monthsBetween(listingDate, today) + 1, 15);
      postListingInterestDays = Math.round((today - listingDate) / (1000 * 60 * 60 * 24));
    }

    const accrued = c.preBonus + c.monthly * principalPaidCount + c.daily * postListingInterestDays;
    return { accrued: Math.min(accrued, c.grandTotal), grandTotal: c.grandTotal };
  }

  function nextPaymentLabel(listingDate, today, hasParticipants) {
    if (!listingDate) return '미정';
    if (today < listingDate) {
      return listingDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (!hasParticipants) return '-';
    const paidCount = Math.min(monthsBetween(listingDate, today) + 1, 15);
    if (paidCount >= 15) return '지급 완료';
    const next = addMonths(listingDate, paidCount);
    return next.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ---------- Supabase 조회 (anon key, 읽기 전용) ----------
  async function fetchJson(url) {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function renderSummary(participants) {
    const grid = document.getElementById('dashSummaryGrid');
    if (!grid) return;

    const listingDate = getListingDate();
    const today = new Date();

    let totalAccrued = 0;
    let totalGrand = 0;
    participants.forEach(function (p) {
      const r = accruedSoFar(p, listingDate, today);
      totalAccrued += r.accrued;
      totalGrand += r.grandTotal;
    });
    const totalRemaining = Math.max(0, totalGrand - totalAccrued);

    grid.innerHTML =
      '<div class="dash-summary-card"><div class="lbl">총 참여자 수</div><div class="val num">' +
      fmt(participants.length) +
      '명</div></div>' +
      '<div class="dash-summary-card"><div class="lbl">누적 지급액 (추정)</div><div class="val num">' +
      fmt(totalAccrued) +
      ' ARRG</div><div class="sub">사전 이자 + 상장 후 원금/이자 누적분</div></div>' +
      '<div class="dash-summary-card"><div class="lbl">예상 미지급액</div><div class="val num">' +
      fmt(totalRemaining) +
      ' ARRG</div><div class="sub">15개월 완료 시 총액 기준</div></div>' +
      '<div class="dash-summary-card"><div class="lbl">다음 지급일</div><div class="val num">' +
      esc(nextPaymentLabel(listingDate, today, participants.length > 0)) +
      '</div></div>';
  }

  function relativeTime(iso) {
    const then = new Date(iso);
    const diffMs = Date.now() - then.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return diffMin + '분 전';
    const diffHour = Math.round(diffMin / 60);
    if (diffHour < 24) return diffHour + '시간 전';
    const diffDay = Math.round(diffHour / 24);
    if (diffDay < 30) return diffDay + '일 전';
    return then.toLocaleDateString('ko-KR');
  }

  function renderActivity(participants) {
    const list = document.getElementById('dashActivityList');
    if (!list) return;
    if (!participants || participants.length === 0) {
      list.innerHTML = '<div class="dash-empty-hint">아직 등록된 참여자가 없습니다.</div>';
      return;
    }
    const recent = participants.slice().sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    }).slice(0, 5);

    list.innerHTML = recent
      .map(function (p) {
        return (
          '<div class="dash-activity-item">' +
          '<div class="dash-activity-icon">👤</div>' +
          '<div class="dash-activity-main">' +
          '<div class="dash-activity-name">' + esc(p.name || '(이름 없음)') + '</div>' +
          '<div class="dash-activity-sub">$' + fmt(p.amount) + ' 참여</div>' +
          '</div>' +
          '<div class="dash-activity-time">' + relativeTime(p.created_at) + '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderNotice(notices) {
    const wrap = document.getElementById('dashNoticeWrap');
    if (!wrap) return;
    if (!notices || notices.length === 0) {
      wrap.innerHTML = '<div class="dash-empty-hint">등록된 공지사항이 없습니다.</div>';
      return;
    }
    const n = notices[0];
    const preview = n.body && n.body.length > 90 ? n.body.slice(0, 90) + '…' : n.body;
    wrap.innerHTML =
      '<div class="notice-item">' +
      '<div class="notice-top">' +
      '<span class="notice-title">' + esc(n.title) + '</span>' +
      '<span class="notice-date">' + new Date(n.created_at).toLocaleDateString('ko-KR') + '</span>' +
      '</div>' +
      '<div class="notice-body">' + esc(preview) + '</div>' +
      '</div>';
  }

  async function loadDynamicSections() {
    try {
      const participants = await fetchJson(
        SUPABASE_URL + '/rest/v1/participants?select=name,amount,days,created_at&order=created_at.desc'
      );
      renderSummary(participants);
      renderActivity(participants);
    } catch (e) {
      const grid = document.getElementById('dashSummaryGrid');
      if (grid) grid.innerHTML = '<div class="dash-empty-hint">요약 정보를 불러오지 못했습니다.</div>';
      const list = document.getElementById('dashActivityList');
      if (list) list.innerHTML = '<div class="dash-empty-hint">최근 활동을 불러오지 못했습니다.</div>';
    }

    try {
      const notices = await fetchJson(
        SUPABASE_URL + '/rest/v1/notices?select=title,body,created_at&order=created_at.desc&limit=1'
      );
      renderNotice(notices);
    } catch (e) {
      const wrap = document.getElementById('dashNoticeWrap');
      if (wrap) wrap.innerHTML = '<div class="dash-empty-hint">공지사항을 불러오지 못했습니다.</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderCountdown();
    loadDynamicSections();
  });
})();
