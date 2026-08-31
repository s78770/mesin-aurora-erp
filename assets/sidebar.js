// 사이드바 메뉴 정의.
// 메뉴를 추가하려면:
//   1) 아래 MENU_ITEMS 배열에 { id, icon, label, href } 항목을 추가하고
//   2) href 로 지정한 새 html 페이지를 만들고 <body data-page="id"> 를 지정하면 끝.
// 이 파일 하나만 고치면 모든 페이지의 사이드바에 자동으로 반영됩니다.
(function () {
  const MENU_ITEMS = [
    { id: 'dashboard', icon: '🏠', label: '대시보드', href: 'index.html' },
    { id: 'company', icon: '🏢', label: '회사소개', href: 'company.html' },
    { id: 'rewards', icon: '🧮', label: '보상', href: 'rewards.html' },
    { id: 'timeline', icon: '🗓️', label: '타임라인', href: 'timeline.html' }
    // 새 메뉴 예시:
    // { id: 'participants', icon: '👥', label: '참여자 관리', href: 'participants.html' },
  ];

  // 하단에 고정되는 항목 (설정 등). 메뉴가 늘어나도 항상 맨 아래 유지됩니다.
  const BOTTOM_ITEMS = [
    { id: 'settings', icon: '⚙️', label: '설정', href: 'settings.html' },
  ];

  function makeNavLink(item, activeId) {
    const a = document.createElement('a');
    a.className = 'nav-item' + (item.id === activeId ? ' active' : '');
    a.href = item.href;
    a.dataset.label = item.label;
    a.innerHTML = '<span class="nav-icon">' + item.icon + '</span><span>' + item.label + '</span>';
    return a;
  }

  function makeBottomTab(item, activeId) {
    const a = document.createElement('a');
    a.className = 'bottom-nav-item' + (item.id === activeId ? ' active' : '');
    a.href = item.href;
    a.innerHTML = '<span class="bn-icon">' + item.icon + '</span><span>' + item.label + '</span>';
    return a;
  }

  function renderNav() {
    const nav = document.getElementById('sidebarNav');
    const bottomNav = document.getElementById('sidebarBottomNav');
    const mobileTabs = document.getElementById('bottomNav');
    const activeId = document.body.dataset.page;

    if (nav) {
      nav.innerHTML = '';
      MENU_ITEMS.forEach(function (item) {
        nav.appendChild(makeNavLink(item, activeId));
      });
    }

    if (bottomNav) {
      bottomNav.innerHTML = '';
      BOTTOM_ITEMS.forEach(function (item) {
        bottomNav.appendChild(makeNavLink(item, activeId));
      });
    }

    // 모바일(안드로이드 등) 화면 하단 아이콘 메뉴. 사이드바와 같은 MENU_ITEMS 배열을 사용하므로
    // 메뉴를 추가하면 여기에도 자동으로 반영됩니다.
    if (mobileTabs) {
      const list = document.createElement('div');
      list.className = 'bottom-nav-list';
      MENU_ITEMS.forEach(function (item) {
        list.appendChild(makeBottomTab(item, activeId));
      });
      mobileTabs.innerHTML = '';
      mobileTabs.appendChild(list);
    }

    const breadcrumbLabel = document.getElementById('breadcrumbLabel');
    const all = MENU_ITEMS.concat(BOTTOM_ITEMS);
    const current = all.find(function (m) { return m.id === activeId; });
    if (breadcrumbLabel && current) breadcrumbLabel.textContent = current.label;
  }

  function initSidebarToggle() {
    const app = document.getElementById('app');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', function () {
        app.classList.toggle('sidebar-open');
      });
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', function () {
        app.classList.remove('sidebar-open');
      });
    }
  }

  // 사이드바 접기/펼치기 (데스크톱, 하단 고정 버튼).
  // 페이지를 이동해도(새로고침되어도) localStorage 에 저장된 상태를 그대로 유지합니다.
  const COLLAPSE_KEY = 'aurora_sidebar_collapsed';

  function setCollapsed(app, collapseBtn, collapsed) {
    app.classList.toggle('sidebar-collapsed', collapsed);
    collapseBtn.innerHTML =
      '<span class="nav-icon">' + (collapsed ? '➡️' : '⬅️') + '</span><span>' +
      (collapsed ? '메뉴 펼치기' : '메뉴 접기') + '</span>';
    collapseBtn.dataset.label = collapsed ? '메뉴 펼치기' : '메뉴 접기';
    collapseBtn.setAttribute('aria-label', collapsed ? '메뉴 펼치기' : '메뉴 접기');
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch (e) {
      /* localStorage 사용 불가 시 무시 */
    }
  }

  function initSidebarCollapse() {
    const app = document.getElementById('app');
    const bottomNav = document.getElementById('sidebarBottomNav');
    if (!app || !bottomNav) return;

    const collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.className = 'nav-item sidebar-collapse-btn';
    bottomNav.appendChild(collapseBtn);

    let collapsed = false;
    try {
      collapsed = localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch (e) {
      /* localStorage 사용 불가 시 기본값(펼침) 유지 */
    }
    setCollapsed(app, collapseBtn, collapsed);

    collapseBtn.addEventListener('click', function () {
      setCollapsed(app, collapseBtn, !app.classList.contains('sidebar-collapsed'));
    });
  }

  // 사이드바가 접혔을 때, 아이콘에 마우스를 올리면 라벨을 보여주는 툴팁.
  function initCollapsedTooltips() {
    const app = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    if (!app || !sidebar) return;

    let tooltipEl = null;

    function showTooltip(target) {
      if (!app.classList.contains('sidebar-collapsed')) return;
      const label = target.dataset.label;
      if (!label) return;
      hideTooltip();
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'sidebar-tooltip';
      tooltipEl.textContent = label;
      document.body.appendChild(tooltipEl);
      const rect = target.getBoundingClientRect();
      tooltipEl.style.left = rect.right + 10 + 'px';
      tooltipEl.style.top = rect.top + rect.height / 2 + 'px';
    }

    function hideTooltip() {
      if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
      }
    }

    sidebar.addEventListener(
      'mouseenter',
      function (e) {
        const target = e.target.closest && e.target.closest('.nav-item');
        if (target && sidebar.contains(target)) showTooltip(target);
      },
      true
    );
    sidebar.addEventListener(
      'mouseleave',
      function (e) {
        const target = e.target.closest && e.target.closest('.nav-item');
        if (target) hideTooltip();
      },
      true
    );
    // 접기/펼치기 전환 시 남아있는 툴팁 정리
    sidebar.addEventListener('click', hideTooltip, true);
  }

  // 다크 / 라이트(아이보리) 테마 전환. <head> 최상단의 인라인 스크립트가 페이지 렌더링 전에
  // localStorage 값을 읽어 미리 data-theme 를 적용해두므로 화면 깜빡임(FOUC)이 없습니다.
  const THEME_KEY = 'aurora_theme';

  function applyThemeIcon(btn, theme) {
    const isLight = theme === 'light';
    btn.textContent = isLight ? '☀️' : '🌙';
    btn.setAttribute('aria-label', isLight ? '다크 테마로 전환' : '라이트 테마로 전환');
  }

  function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyThemeIcon(btn, current);

    btn.addEventListener('click', function () {
      const now = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = now === 'light' ? 'dark' : 'light';
      if (next === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      applyThemeIcon(btn, next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        /* localStorage 사용 불가 시 무시 (새로고침 전까지는 화면에 그대로 반영됨) */
      }
    });
  }

  // 앱처럼 설치/오프라인 실행이 가능하도록 서비스워커 등록 (HTTPS 또는 localhost 에서만 동작).
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {
        /* http(IP 등 비보안 컨텍스트)에서는 등록이 거부될 수 있음 - 무시 */
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderNav();
    initSidebarToggle();
    initSidebarCollapse();
    initCollapsedTooltips();
    initThemeToggle();
  });
  registerServiceWorker();
})();
