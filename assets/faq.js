// FAQ 페이지 (공개, 읽기 전용). Supabase faqs 테이블에서 anon key로 조회만 합니다.
// 작성/삭제는 admin.html(로그인 + 승인된 editor/admin)에서만 가능합니다.
(function () {
  const SUPABASE_URL = 'https://euiyywzyhvxstqxqbpek.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1aXl5d3p5aHZ4c3RxeHFicGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODcyNzUsImV4cCI6MjEwMzc2MzI3NX0.LT-1BYihLZAFsUwO8TNZ6dNp8mNwl27IDPmvcF7yFu8';
  const REST_URL = SUPABASE_URL + '/rest/v1/faqs';

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  async function loadFaqs() {
    const listEl = document.getElementById('faqListPublic');
    try {
      const res = await fetch(REST_URL + '?select=*&order=sort_order.asc,created_at.asc', {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      if (!data || data.length === 0) {
        listEl.innerHTML = '<div class="company-note">등록된 FAQ가 없습니다.</div>';
        return;
      }

      listEl.innerHTML = data
        .map(function (row, i) {
          return (
            '<details class="faq-item"' + (i === 0 ? ' open' : '') + '>' +
            '<summary>' + esc(row.question) + '</summary>' +
            '<div class="faq-answer">' + esc(row.answer) + '</div>' +
            '</details>'
          );
        })
        .join('');
    } catch (e) {
      listEl.innerHTML = '<div class="company-note">FAQ를 불러오지 못했습니다.</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', loadFaqs);
})();
