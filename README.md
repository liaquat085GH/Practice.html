# Horizon Institute of Technology – Website

Responsive multi-page site for an institute offering IT courses, DAE diplomas and intermediate (FSc/ICS/I.Com) education.

## Structure
| File | Purpose |
|---|---|
| `index.html` | Landing page (hero, programs filter, stats, testimonials, CTA) |
| `about.html` | Mission, timeline, faculty, facilities, FAQ |
| `admissions.html` | Process, fee table, validated online application form |
| `students.html` | Result lookup, toppers with search/filter, campus life |
| `style.css` | Design system and responsive layout |
| `main.js` | Menu, animations, filters, slider, form validation, API calls |
| `app.py` | Flask backend (form storage in SQLite, result API) |

## Run locally
```bash
pip install -r requirements.txt
python app.py        # open http://127.0.0.1:5000
```

## Publish
- **Full site (with working form/results):** deploy on Render, Railway, PythonAnywhere or any VPS using `gunicorn app:app`.
- **Static only:** upload the 4 HTML files + `style.css` + `main.js` to Netlify/GitHub Pages (the form needs the Python backend to submit).

## Before going live
Replace dummy name, address, phone, email and fees; add real logo/photos; set `FLASK_DEBUG` off (default).
All data in this project is placeholder content.
