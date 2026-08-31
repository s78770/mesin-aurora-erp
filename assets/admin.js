// 관리자 화면 (admin.html): 승인 대기 처리, 회원 권한 부여, 공지사항/FAQ 관리.
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const sb = window.sbClient;
    if (!sb) return;

    const loadingWrap = document.getElementById('loadingWrap');
    const pendingWrap = document.getElementById('pendingWrap');
    const userMgmtWrap = document.getElementById('userMgmtWrap');
    const noPendingHint = document.getElementById('noPendingHint');
    const userTableWrap = document.getElementById('userTableWrap');
    const userTableBody = document.getElementById('userTableBody');
    const noticesWrap = document.getElementById('noticesWrap');
    const faqWrap = document.getElementById('faqWrap');
    const noticeList = document.getElementById('noticeList');
    const faqList = document.getElementById('faqList');
    const whoami = document.getElementById('whoami');
    const logoutBtn = document.getElementById('logoutBtn');

    const noticeTitle = document.getElementById('noticeTitle');
    const noticeBody = document.getElementById('noticeBody');
    const noticeAddBtn = document.getElementById('noticeAddBtn');

    const faqQuestion = document.getElementById('faqQuestion');
    const faqAnswer = document.getElementById('faqAnswer');
    const faqAddBtn = document.getElementById('faqAddBtn');

    let myProfile = null;

    function esc(s) {
      const d = document.createElement('div');
      d.textContent = s == null ? '' : String(s);
      return d.innerHTML;
    }

    function fmtDate(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      return d.toLocaleString('ko-KR');
    }

    logoutBtn.addEventListener('click', async function () {
      await sb.auth.signOut();
      location.href = 'login.html';
    });

    async function loadPendingUsers() {
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: true });
      if (error) return;

      if (!data || data.length === 0) {
        noPendingHint.hidden = false;
        userTableWrap.hidden = true;
        return;
      }
      noPendingHint.hidden = true;
      userTableWrap.hidden = false;
      userTableBody.innerHTML = data
        .map(function (row) {
          return (
            '<tr data-id="' +
            row.id +
            '"><td>' +
            esc(row.email) +
            '</td><td>' +
            fmtDate(row.created_at) +
            '</td><td>' +
            '<select class="preset-btn role-select">' +
            '<option value="editor">editor</option>' +
            '<option value="admin">admin</option>' +
            '</select> ' +
            '<button type="button" class="ppt-nav-btn approve-btn">승인</button>' +
            '</td></tr>'
          );
        })
        .join('');

      userTableBody.querySelectorAll('.approve-btn').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          const tr = btn.closest('tr');
          const id = tr.dataset.id;
          const role = tr.querySelector('.role-select').value;
          btn.disabled = true;
          btn.textContent = '처리 중...';
          const { error } = await sb.from('profiles').update({ approved: true, role: role }).eq('id', id);
          if (error) {
            alert('승인 실패: ' + error.message);
            btn.disabled = false;
            btn.textContent = '승인';
            return;
          }
          loadPendingUsers();
        });
      });
    }

    async function loadNotices() {
      const { data, error } = await sb.from('notices').select('*').order('created_at', { ascending: false });
      if (error) {
        noticeList.innerHTML = '<div class="company-note">공지사항을 불러오지 못했습니다.</div>';
        return;
      }
      if (!data || data.length === 0) {
        noticeList.innerHTML = '<div class="company-note">등록된 공지사항이 없습니다.</div>';
        return;
      }
      noticeList.innerHTML = data
        .map(function (row) {
          return (
            '<div class="notice-item" data-id="' +
            row.id +
            '">' +
            '<div class="notice-top">' +
            '<span class="notice-title">' +
            esc(row.title) +
            '</span>' +
            '<span style="display:flex; align-items:center; gap:8px;">' +
            '<span class="notice-date">' +
            fmtDate(row.created_at) +
            '</span>' +
            '<button type="button" class="p-del-btn notice-del-btn">삭제</button>' +
            '</span>' +
            '</div>' +
            '<div class="notice-body">' +
            esc(row.body) +
            '</div>' +
            '</div>'
          );
        })
        .join('');

      noticeList.querySelectorAll('.notice-del-btn').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          const id = btn.closest('[data-id]').dataset.id;
          if (!confirm('이 공지사항을 삭제할까요?')) return;
          await sb.from('notices').delete().eq('id', id);
          loadNotices();
        });
      });
    }

    async function loadFaqs() {
      const { data, error } = await sb.from('faqs').select('*').order('sort_order', { ascending: true });
      if (error) {
        faqList.innerHTML = '<div class="company-note">FAQ를 불러오지 못했습니다.</div>';
        return;
      }
      if (!data || data.length === 0) {
        faqList.innerHTML = '<div class="company-note">등록된 FAQ가 없습니다.</div>';
        return;
      }
      faqList.innerHTML = data
        .map(function (row) {
          return (
            '<div class="notice-item" data-id="' +
            row.id +
            '">' +
            '<div class="notice-top">' +
            '<span class="notice-title">Q. ' +
            esc(row.question) +
            '</span>' +
            '<button type="button" class="p-del-btn faq-del-btn">삭제</button>' +
            '</div>' +
            '<div class="notice-body">A. ' +
            esc(row.answer) +
            '</div>' +
            '</div>'
          );
        })
        .join('');

      faqList.querySelectorAll('.faq-del-btn').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          const id = btn.closest('[data-id]').dataset.id;
          if (!confirm('이 FAQ를 삭제할까요?')) return;
          await sb.from('faqs').delete().eq('id', id);
          loadFaqs();
        });
      });
    }

    noticeAddBtn.addEventListener('click', async function () {
      const title = (noticeTitle.value || '').trim();
      const body = (noticeBody.value || '').trim();
      if (!title || !body) {
        alert('제목과 내용을 입력하세요.');
        return;
      }
      noticeAddBtn.disabled = true;
      const { error } = await sb.from('notices').insert({ title: title, body: body });
      noticeAddBtn.disabled = false;
      if (error) {
        alert('등록 실패: ' + error.message);
        return;
      }
      noticeTitle.value = '';
      noticeBody.value = '';
      loadNotices();
    });

    faqAddBtn.addEventListener('click', async function () {
      const question = (faqQuestion.value || '').trim();
      const answer = (faqAnswer.value || '').trim();
      if (!question || !answer) {
        alert('질문과 답변을 입력하세요.');
        return;
      }
      faqAddBtn.disabled = true;
      const { error } = await sb.from('faqs').insert({ question: question, answer: answer, sort_order: 999 });
      faqAddBtn.disabled = false;
      if (error) {
        alert('등록 실패: ' + error.message);
        return;
      }
      faqQuestion.value = '';
      faqAnswer.value = '';
      loadFaqs();
    });

    async function init() {
      const { data: sessionRes } = await sb.auth.getSession();
      const session = sessionRes && sessionRes.session;
      if (!session) {
        location.href = 'login.html';
        return;
      }
      whoami.textContent = session.user.email || '';

      const { data: profile, error: profileErr } = await sb
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      loadingWrap.hidden = true;

      if (profileErr || !profile || !profile.approved) {
        pendingWrap.hidden = false;
        return;
      }

      myProfile = profile;
      noticesWrap.hidden = false;
      faqWrap.hidden = false;
      loadNotices();
      loadFaqs();

      if (profile.role === 'admin') {
        userMgmtWrap.hidden = false;
        loadPendingUsers();
      }
    }

    init();
  });
})();
