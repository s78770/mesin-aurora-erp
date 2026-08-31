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
    if (!stage || !img) return;

    let current = 1;

    function preload(n) {
      if (n < 1 || n > TOTAL) return;
      const pre = new Image();
      pre.src = srcFor(n);
    }

    function render() {
      img.src = srcFor(current);
      img.alt = '슬라이드 ' + current;
      if (curEl) curEl.textContent = current;
      if (prevBtn) prevBtn.disabled = current <= 1;
      if (nextBtn) nextBtn.disabled = current >= TOTAL;
      preload(current + 1);
      preload(current - 1);
    }

    function go(n) {
      current = Math.min(TOTAL, Math.max(1, n));
      render();
    }

    if (totalEl) totalEl.textContent = TOTAL;
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
