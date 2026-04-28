function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function jsonForScript(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e')
}

export function renderViewerHtml(archiveData, manifest) {
  const title = archiveData.publication?.title ?? 'Open Memory Archive'
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: Canvas; color: CanvasText; }
    header { padding: 2rem; border-bottom: 1px solid color-mix(in srgb, CanvasText 16%, transparent); }
    main { width: min(980px, calc(100% - 2rem)); margin: 0 auto; padding: 1.5rem 0 3rem; }
    h1 { margin: 0 0 .4rem; font-size: clamp(1.8rem, 4vw, 3rem); }
    h2 { margin-top: 2rem; border-bottom: 1px solid color-mix(in srgb, CanvasText 14%, transparent); padding-bottom: .4rem; }
    h3 { margin-bottom: .25rem; }
    .meta, .privacy { color: color-mix(in srgb, CanvasText 70%, transparent); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: .75rem; }
    .card { border: 1px solid color-mix(in srgb, CanvasText 14%, transparent); border-radius: 8px; padding: .85rem; background: color-mix(in srgb, Canvas 94%, CanvasText 6%); }
    .redacted { border-style: dashed; }
    .badge { display: inline-block; border: 1px solid color-mix(in srgb, CanvasText 24%, transparent); border-radius: 999px; padding: .1rem .45rem; font-size: .78rem; margin-left: .35rem; }
    .section { margin: 1rem 0 1.25rem; line-height: 1.65; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; }
    a { color: LinkText; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">${escapeHtml(archiveData.publication?.author ?? 'Unknown author')} · ${escapeHtml(manifest.generatedAt)}</div>
    <p class="privacy">Offline archive. External network required: ${manifest.privacy.externalNetworkRequired ? 'yes' : 'no'}. Telemetry enabled: ${manifest.privacy.telemetryEnabled ? 'yes' : 'no'}. Redactions: ${manifest.privacy.redactionCount}.</p>
  </header>
  <main id="app"></main>
  <script type="application/json" id="archive-data">${jsonForScript({ archiveData, manifest })}</script>
  <script>
    const { archiveData, manifest } = JSON.parse(document.getElementById('archive-data').textContent);
    const app = document.getElementById('app');
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const badge = (item) => item?.redacted ? '<span class="badge">redacted</span>' : '';
    const card = (body, item) => '<article class="card ' + (item?.redacted ? 'redacted' : '') + '">' + body + '</article>';
    const list = (title, items, render) => '<section><h2>' + esc(title) + '</h2><div class="grid">' + (items || []).map(render).join('') + '</div></section>';
    const chapters = (archiveData.chapters || []).map((chapter) => '<section><h2>' + esc(chapter.title) + badge(chapter) + '</h2>' + (chapter.sections || []).map((section) => '<div class="section"><h3>' + esc(section.title || '') + badge(section) + '</h3><p>' + esc(section.text || '') + '</p></div>').join('') + '</section>').join('');
    app.innerHTML = [
      chapters,
      list('People', archiveData.people, (person) => card('<strong>' + esc(person.displayName) + '</strong>' + badge(person) + '<p>' + esc(person.description || person.biography || '') + '</p>', person)),
      list('Events', archiveData.events, (event) => card('<strong>' + esc(event.title) + '</strong>' + badge(event) + '<p>' + esc(event.date || '') + '</p><p>' + esc(event.description || '') + '</p>', event)),
      list('Locations', archiveData.locations, (location) => card('<strong>' + esc(location.name) + '</strong>' + badge(location) + '<p>' + esc([location.region, location.country].filter(Boolean).join(', ')) + '</p>', location)),
      list('Media', archiveData.media, (media) => card('<strong>' + esc(media.title || media.id) + '</strong>' + badge(media) + (media.localPath ? '<p><a href="' + esc(media.localPath) + '">' + esc(media.localPath) + '</a></p>' : '<p>Media unavailable in this privacy profile.</p>'), media)),
      '<section><h2>Archive Manifest</h2><pre>' + esc(JSON.stringify(manifest, null, 2)) + '</pre></section>'
    ].join('');
  </script>
</body>
</html>`
}

