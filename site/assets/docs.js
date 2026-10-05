/* Local-only controls. No analytics, external assets or remote search service. */
const sectionMenu = document.querySelector('.section-nav details');
if (sectionMenu) {
  const mobile = matchMedia('(max-width:900px)');
  const resizeMenu = () => { sectionMenu.open = !mobile.matches; };
  resizeMenu();
  mobile.addEventListener('change', resizeMenu);
}
document.querySelectorAll('pre').forEach(pre => {
  if (!pre.querySelector('code')) return;
  const box = document.createElement('div'); box.className = 'code-box';
  pre.before(box); box.append(pre);
  const button = document.createElement('button'); button.className = 'copy';
  button.type = 'button'; button.textContent = 'Copy';
  button.setAttribute('aria-label', 'Copy code'); button.setAttribute('aria-live', 'polite');
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pre.querySelector('code').textContent);
      button.textContent = 'Copied';
    } catch { button.textContent = 'Copy failed — select code'; }
    setTimeout(() => { button.textContent = 'Copy'; }, 2500);
  });
  box.append(button);
});

function searchDocumentation(entries, rawQuery) {
  const originalQuery = rawQuery.trim().toLowerCase();
  if (!originalQuery) return [];
  const normalized = text => text.toLowerCase().replace(/[-_]/g, ' ');
  const words = normalized(originalQuery).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const query = words.join(' ');
  const flag = originalQuery.startsWith('--') ? originalQuery.split(/\s+/)[0] : '';
  const commandQuery = originalQuery.startsWith('--') || (/^(aac|aeg)\s/.test(originalQuery) &&
    entries.some(item => item.kind === 'command' &&
      (item.title.toLowerCase() === originalQuery || item.title.toLowerCase().startsWith(originalQuery + ' ') ||
       originalQuery.startsWith(item.title.toLowerCase() + ' '))));
  const matches = [];
  for (const item of entries) {
    const title = normalized(item.title);
    if (flag && !item.text.includes(flag)) continue;
    if (!words.every(word => (title + ' ' + normalized(item.text)).includes(word))) continue;
    const sections = item.sections.map(section => {
      const heading = normalized(section.heading);
      const text = heading + ' ' + normalized(section.text);
      const count = words.filter(word => text.includes(word)).length;
      return {...section, score: count + (count === words.length ? 10 : 0) +
        (heading.includes(query) ? 12 : 0) + (text.includes(query) ? 8 : 0) +
        Math.min(5, text.split(query).length - 1) + (flag && section.text.includes(flag) ? 20 : 0)};
    }).sort((a, b) => b.score - a.score);
    const match = sections[0];
    const text = match.text || match.heading;
    const searchable = normalized(text);
    const positions = words.map(word => searchable.indexOf(word)).filter(i => i >= 0);
    const phrase = flag ? text.indexOf(flag) : searchable.indexOf(query);
    const position = phrase >= 0 ? phrase : positions.sort((a, b) =>
      words.filter(word => searchable.slice(b, b + 115).includes(word)).length -
      words.filter(word => searchable.slice(a, a + 115).includes(word)).length)[0] || 0;
    let start = Math.max(0, position - 45);
    while (start > 0 && !/\s/.test(text[start - 1])) start--;
    let end = Math.min(text.length, Math.max(start + 160, position + 115));
    while (end < text.length && !/\s/.test(text[end])) end++;
    const excerpt = (start ? '…' : '') + text.slice(start, end).trim() +
      (end < text.length ? '…' : '');
    const preferredKind = commandQuery ? 'command' : 'guide';
    matches.push({...item,
      href: item.route + (match.anchor ? '#' + encodeURIComponent(match.anchor) : ''),
      matchHeading: match.heading, excerpt,
      score: (item.kind === preferredKind ? 100 : 0) +
        (title === query ? 200 : title.includes(query) ? 20 : 0) + match.score});
  }
  return matches.sort((a, b) => b.score - a.score || a.route.localeCompare(b.route)).slice(0, 12);
}

const input = document.getElementById('site-search');
const results = document.getElementById('search-results');
let index;
if (input && results) {
  input.addEventListener('input', async () => {
    const query = input.value.trim().toLowerCase();
    results.replaceChildren();
    if (!query) return;
    try {
      index ||= fetch('/search-index.json').then(response => {
        if (!response.ok) throw new Error('Search unavailable');
        return response.json();
      }).catch(error => { index = undefined; throw error; });
      const entries = await index;
      if (input.value.trim().toLowerCase() !== query) return;
      const matches = searchDocumentation(entries, query);
      if (!matches.length) results.textContent = 'No matching pages. Try a command or topic.';
      for (const item of matches) {
        const link = document.createElement('a'); link.href = item.href;
        link.textContent = item.title;
        if (item.matchHeading !== item.title) {
          const heading = document.createElement('small'); heading.className = 'match-heading';
          heading.textContent = item.matchHeading; link.append(heading);
        }
        const context = document.createElement('small');
        context.textContent = item.section + ' · ' + item.applicability;
        const excerpt = document.createElement('small'); excerpt.className = 'excerpt';
        excerpt.textContent = item.excerpt;
        link.append(context, excerpt); results.append(link);
      }
    } catch { results.textContent = 'Search is unavailable. Use the section navigation.'; }
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { input.value = ''; results.replaceChildren(); }
    if (event.key === 'ArrowDown') { event.preventDefault(); results.querySelector('a')?.focus(); }
  });
}
