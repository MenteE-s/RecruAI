# mlservices — local embedding playground (NOT deployed)

Standalone Gradio service wrapping `sentence-transformers/all-MiniLM-L6-v2`
for local embedding experiments.

- **Not used in production.** The backend uses the `EMBEDDING_PROVIDER` API
  (see `backend/.env.production`). Nothing in `backend/` or compose imports this.
- **Not shipped to EC2.** Excluded from the deploy rsync in
  `.github/workflows/deploy.yml`.
- **Run locally only:** `pip install -r requirements.txt && python app.py`,
  then open http://127.0.0.1:7860
