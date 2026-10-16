# StaySense — Room Type Predictor UI

Responsive dark-theme frontend for your FastAPI model.

## Files
- `index.html` — structure and form
- `style.css` — dark styling, responsive layout, and animations
- `script.js` — validation, progress, API request, and prediction display

## Start backend
Keep `main.py` and `House_Pipeline.pkl` in the expected locations, then run:

```bash
pip install fastapi uvicorn joblib pandas scikit-learn
uvicorn main:app --reload
```

API URL: `http://127.0.0.1:8000`

## Open the frontend
Use VS Code Live Server to serve `index.html`. In `script.js`, change `API_BASE_URL` if your backend is deployed.

## Note about probability labels
Your API returns a probability array but not class names. The UI currently labels these as `Class 1`, `Class 2`, etc. To show meaningful names, also return `model.classes_` from FastAPI and use those labels in the frontend.

For production, restrict CORS to your real frontend origin rather than `allow_origins=['*']`.
