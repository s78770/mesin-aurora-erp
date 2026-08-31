// 대시보드: 설정 페이지에서 지정한 상장 예정일 기준 D-day 카운트다운.
(function () {
  const LISTING_DATE_KEY = 'aurora_listing_date_v1';

  function render() {
    const card = document.getElementById('countdownCard');
    if (!card) return;

    let dateStr = '';
    try {
      dateStr = localStorage.getItem(LISTING_DATE_KEY) || '';
    } catch (e) {}

    if (!dateStr) {
      card.innerHTML =
        '<div class="countdown-label">상장 예정일</div>' +
        '<div class="countdown-empty">아직 상장 예정일이 설정되지 않았습니다.<br>' +
        '<a href="settings.html">설정 페이지</a>에서 날짜를 지정하면 여기에 D-day가 표시됩니다.</div>';
      return;
    }

    const target = new Date(dateStr + 'T00:00:00');
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

  document.addEventListener('DOMContentLoaded', render);
})();
