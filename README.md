# Kesho

A local-first personal budget tracker. Log income and expenses in KES, watch spending envelopes, check monthly trends and export your ledger — without connecting a bank account or signing up for anything.

## Features

- **Monthly overview** — balance, income, spending and savings rate
- **Quick entry** — amount, category, date and note with expense/income toggle
- **Envelopes** — per-category limits with progress bars that flag overspending
- **Six-month trend** — income vs expenses chart
- **Searchable ledger** with filters and one-click delete
- **CSV export** and demo reset
- **Dark mode**, responsive layout and local autosave

## Run it

```bash
# open index.html directly, or
python3 -m http.server 8000  # then visit http://localhost:8000
```

## Privacy

Kesho has no backend. All data lives in `localStorage` under `kesho:budget:v1`. It never contacts a server, so it cannot sync across devices — export a CSV if you want a backup.

## Stack

HTML5, CSS custom properties and vanilla JavaScript. Zero dependencies.

## License

MIT — see [LICENSE](LICENSE).
