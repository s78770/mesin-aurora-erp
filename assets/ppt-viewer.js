// PPT 슬라이드 뷰어. 좌우 버튼/화살표 키/모바일 스와이프로 한 장씩 넘겨봅니다.
(function () {
  const TOTAL = 30;

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }
  function srcFor(n) {
    return 'assets/ppt-slides/slide-' + pad2(n) + '.jpg';
  }

  document.addEventListener('DOMContentLoaded', function () {
    const stage = document.getElementById('pptStage');
    const img = document.getElementById('pptImage');
    const curEl = document.getElementById('pptCurrent');
    const totalEl = document.getElementById('pptTotal');
    const prevBtn = document.getElementById('pptPrev');
    const nextBtn = document.getElementById('pptNext');
    const thumbsWrap = document.getElementById('pptThumbs');
    if (!stage || !img) return;

    let current = 1;

    function preload(n) {
      if (n < 1 || n > TOTAL) return;
      const pre = new Image();
      pre.src = srcFor(n);
    }

    // 넓은 화면(>=1300px)에서만 CSS로 노출되는 축소판 목록. 좁은 화면에서도 DOM 자체는
    // 만들어두되 CSS가 숨기므로(.ppt-thumbs{display:none}) 별도 분기 없이 항상 생성.
    function buildThumbs() {
      if (!thumbsWrap || thumbsWrap.childElementCount) return;
      for (let n = 1; n <= TOTAL; n++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ppt-thumb';
        btn.dataset.n = String(n);
        btn.setAttribute('aria-label', '슬라이드 ' + n + '번으로 이동');
        btn.innerHTML =
          '<span class="tn-num">' + pad2(n) + '</span>' +
          '<img loading="lazy" src="' + srcFor(n) + '" alt="">';
        btn.addEventListener('click', function () { go(n); });
        thumbsWrap.appendChild(btn);
      }
    }

    function syncThumbs() {
      if (!thumbsWrap) return;
      const items = thumbsWrap.querySelectorAll('.ppt-thumb');
      items.forEach(function (t) {
        const active = Number(t.dataset.n) === current;
        t.classList.toggle('active', active);
        if (active && typeof t.scrollIntoView === 'function') {
          t.scrollIntoView({ block: 'nearest' });
        }
      });
    }

    function render() {
      img.src = srcFor(current);
      img.alt = '슬라이드 ' + current;
      if (curEl) curEl.textContent = current;
      if (prevBtn) prevBtn.disabled = current <= 1;
      if (nextBtn) nextBtn.disabled = current >= TOTAL;
      preload(current + 1);
      preload(current - 1);
      syncThumbs();
    }

    function go(n) {
      current = Math.min(TOTAL, Math.max(1, n));
      render();
    }

    if (totalEl) totalEl.textContent = TOTAL;
    buildThumbs();
    if (prevBtn) prevBtn.addEventListener('click', function () { go(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(current + 1); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(current - 1);
      if (e.key === 'ArrowRight') go(current + 1);
    });

    // 모바일 스와이프
    let touchStartX = null;
    stage.addEventListener(
      'touchstart',
      function (e) {
        touchStartX = e.touches[0].clientX;
      },
      { passive: true }
    );
    stage.addEventListener(
      'touchend',
      function (e) {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
          if (dx < 0) go(current + 1);
          else go(current - 1);
        }
        touchStartX = null;
      },
      { passive: true }
    );

    render();
  });
})();
