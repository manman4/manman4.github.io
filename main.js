fetch('data/missing_numbers.csv')
  .then(res => res.text())
  .then(text => {
    const lines = text.trim().split('\n');
    let latestData = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line) { latestData = line; break; }
    }
    const card = document.getElementById('oeis-card');
    if (!latestData) {
      card.innerHTML = '<p class="oeis-loading">データがありません</p>';
      return;
    }
    const values = latestData.split(',');
    const ts = values[0];
    const numbers = values.slice(1).filter(n => n.trim());
    const dateStr = `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)} ${ts.slice(9,11)}:${ts.slice(11,13)}:${ts.slice(13,15)}`;
    card.innerHTML = `
      <div class="oeis-meta">
        <div>更新日時: <span>${dateStr}</span></div>
        <div>件数: <span>${numbers.length}</span></div>
      </div>
      <div class="oeis-numbers">${numbers.join(', ')}</div>
    `;
  })
  .catch(() => {
    document.getElementById('oeis-card').innerHTML = '<p class="oeis-loading">読み込みに失敗しました</p>';
  });
