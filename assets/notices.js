// 공지사항 게시판 (공개, 읽기 전용). Supabase notices 테이블에서 anon key로 조회만 합니다.
// 작성/삭제는 admin.html(로그인 + 승인된 editor/admin)에서만 가능합니다.
(function () {
  const SUPABASE_URL = 'https://euiyywzyhvxstqxqbpek.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1aXl5d3p5aHZ4c3RxeHFicGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODcyNzUsImV4cCI6MjEwMzc2MzI3NX0.LT-1BYihLZAFsUwO8TNZ6dNp8mNwl27IDPmvcF7yFu8';
  const REST_URL = SUPABASE_URL + '/rest/v1/notices';

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function fmtDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('ko-KR');
  }

  async function loadNotices() {
    const listEl = document.getElementById('noticeListPublic');
    try {
      const res = await fetch(REST_URL + '?select=*&order=created_at.desc', {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      if (!data || data.length === 0) {
        listEl.innerHTML = '<div class="company-note">등록된 공지사항이 없습니다.</div>';
        return;
      }

      listEl.innerHTML = data
        .map(function (row) {
          return (
            '<div class="notice-item">' +
            '<div class="notice-top">' +
            '<span class="notice-title">' + esc(row.title) + '</span>' +
            '<span class="notice-date">' + fmtDate(row.created_at) + '</span>' +
            '</div>' +
            '<div class="notice-body">' + esc(row.body) + '</div>' +
            '</div>'
          );
        })
        .join('');
    } catch (e) {
      listEl.innerHTML = '<div class="company-note">공지사항을 불러오지 못했습니다.</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', loadNotices);
})();
