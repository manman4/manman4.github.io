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
      const p = document.createElement('p');
      p.className = 'oeis-loading';
      p.textContent = 'No data available';
      card.replaceChildren(p);
      return;
    }
    const values = latestData.split(',');
    const ts = values[0];
    const numbers = values.slice(1).filter(n => n.trim());
    const dateStr = `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)} ${ts.slice(9,11)}:${ts.slice(11,13)}:${ts.slice(13,15)}`;

    const numsDiv = document.createElement('div');
    numsDiv.className = 'oeis-numbers';
    numbers.forEach((n, i) => {
      const span = document.createElement('span');
      span.className = 'oeis-num';
      span.style.animationDelay = (i / numbers.length * 16).toFixed(3) + 's';
      span.textContent = n.trim();
      numsDiv.appendChild(span);
      if (i < numbers.length - 1) numsDiv.appendChild(document.createTextNode(', '));
    });

    const metaDiv = document.createElement('div');
    metaDiv.className = 'oeis-meta';
    metaDiv.style.marginTop = '1rem';
    metaDiv.style.marginBottom = '0';

    const updatedDiv = document.createElement('div');
    updatedDiv.textContent = 'Updated: ';
    const updatedSpan = document.createElement('span');
    updatedSpan.textContent = dateStr + ' JST';
    updatedDiv.appendChild(updatedSpan);

    const countDiv = document.createElement('div');
    countDiv.textContent = 'Count: ';
    const countSpan = document.createElement('span');
    countSpan.textContent = numbers.length;
    countDiv.appendChild(countSpan);

    metaDiv.append(updatedDiv, countDiv);
    card.replaceChildren(numsDiv, metaDiv);
  })
  .catch(() => {
    // Keep the server-rendered fallback so the page stays useful to users and crawlers.
  });
