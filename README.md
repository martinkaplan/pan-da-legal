# Pan-da localized static site

Open via a local HTTP server, not by double-clicking `index.html`, because browsers usually block `fetch()` from `file://` URLs.

```bash
cd panda_site_localized
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Pages:
- `index.html?lang=cs`
- `page.html?p=privacy&lang=en`
- `page.html?p=terms&lang=de`
- `page.html?p=faq&lang=fr`

Supported languages: `cs`, `en`, `de`, `fr`, `es`, `pt`.
