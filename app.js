const SUPPORTED_LANGS = ['cs', 'en', 'de', 'fr', 'es', 'pt'];
const DEFAULT_LANG = 'en';
const PAGE_TITLES = {
  privacy: { cs: 'Zásady ochrany soukromí', en: 'Privacy Policy', de: 'Datenschutzerklärung', fr: 'Politique de confidentialité', es: 'Política de privacidad', pt: 'Política de privacidade' },
  terms: { cs: 'Obchodní podmínky', en: 'Terms & Conditions', de: 'Allgemeine Geschäftsbedingungen', fr: 'Conditions générales', es: 'Términos y condiciones', pt: 'Termos e condições' },
  faq: { cs: 'FAQ', en: 'FAQ', de: 'FAQ', fr: 'FAQ', es: 'Preguntas frecuentes', pt: 'FAQ' },
};

const params = new URLSearchParams(location.search);
const page = ['privacy', 'terms', 'faq'].includes(params.get('p')) ? params.get('p') : 'privacy';
const detectedLang = (navigator.language || DEFAULT_LANG).slice(0, 2).toLowerCase();
let lang = params.get('lang') || localStorage.getItem('panda_lang') || detectedLang;
lang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let listOpen = false;

  function closeList() {
    if (!listOpen) return;
    html.push('</ul>');
    listOpen = false;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith('# ')) {
      closeList();
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith('> ')) {
      closeList();
      html.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
    } else if (line.startsWith('- ')) {
      if (!listOpen) {
        html.push('<ul>');
        listOpen = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
    } else {
      closeList();
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }

  closeList();
  return html.join('\n');
}

function renderLanguageSwitch() {
  document.querySelector('.language-switch').innerHTML = SUPPORTED_LANGS.map(code =>
    `<button type="button" class="${code === lang ? 'active' : ''}" data-lang="${code}">${code.toUpperCase()}</button>`
  ).join('');
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.setItem('panda_lang', btn.dataset.lang);
      location.href = `page.html?p=${page}&lang=${btn.dataset.lang}`;
    });
  });
}

async function loadMarkdown() {
  document.documentElement.lang = lang;
  document.title = `${PAGE_TITLES[page][lang]} — Pan-da`;
  document.querySelectorAll('[data-page-link]').forEach(link => {
    link.href = `page.html?p=${link.dataset.pageLink}&lang=${lang}`;
    link.textContent = PAGE_TITLES[link.dataset.pageLink][lang];
  });

  renderLanguageSwitch();

  try {
    const response = await fetch(`content/${page}_${lang}.md`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    document.getElementById('content').innerHTML = markdownToHtml(markdown);
  } catch (error) {
    document.getElementById('content').innerHTML = '<p class="error">Content could not be loaded. Make sure the site is served over HTTP(S), not opened directly as a file.</p>';
  }
}

loadMarkdown();
