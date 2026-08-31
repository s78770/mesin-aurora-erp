// 관리자 로그인/회원가입 (login.html). 로그인/가입 성공 시 admin.html 로 이동합니다.
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const sb = window.sbClient;
    const titleEl = document.getElementById('authTitle');
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const emailInput = document.getElementById('authEmail');
    const passwordInput = document.getElementById('authPassword');
    const submitBtn = document.getElementById('authSubmit');
    const errorEl = document.getElementById('authError');
    const noteEl = document.getElementById('authNote');
    if (!sb || !submitBtn) return;

    let mode = 'login';

    function setMode(next) {
      mode = next;
      tabLogin.classList.toggle('active', mode === 'login');
      tabSignup.classList.toggle('active', mode === 'signup');
      titleEl.textContent = mode === 'login' ? '관리자 로그인' : '회원가입';
      submitBtn.textContent = mode === 'login' ? '로그인' : '회원가입';
      passwordInput.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
      errorEl.hidden = true;
      noteEl.hidden = mode === 'login';
    }

    tabLogin.addEventListener('click', function () {
      setMode('login');
    });
    tabSignup.addEventListener('click', function () {
      setMode('signup');
    });

    // 이미 로그인되어 있으면 바로 관리자 화면으로.
    sb.auth.getSession().then(function (res) {
      if (res.data && res.data.session) {
        location.href = 'admin.html';
      }
    });

    submitBtn.addEventListener('click', async function () {
      const email = (emailInput.value || '').trim();
      const password = passwordInput.value || '';
      errorEl.hidden = true;

      if (!email || password.length < 6) {
        errorEl.textContent = '이메일과 6자 이상의 비밀번호를 입력하세요.';
        errorEl.hidden = false;
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '처리 중...';

      try {
        if (mode === 'login') {
          const { error } = await sb.auth.signInWithPassword({ email, password });
          if (error) throw error;
          location.href = 'admin.html';
        } else {
          const { error } = await sb.auth.signUp({ email, password });
          if (error) throw error;
          setMode('login');
          errorEl.hidden = true;
          noteEl.hidden = false;
          noteEl.style.color = 'var(--teal)';
          noteEl.textContent = '가입 완료! 관리자 승인 후 로그인해서 사용할 수 있습니다.';
        }
      } catch (e) {
        errorEl.textContent =
          mode === 'login'
            ? '로그인에 실패했습니다. 이메일/비밀번호를 확인하거나, 아직 승인 전일 수 있습니다.'
            : '회원가입에 실패했습니다: ' + (e && e.message ? e.message : '알 수 없는 오류');
        errorEl.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });

    passwordInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitBtn.click();
    });
  });
})();
