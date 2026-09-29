# Fine-tuned DeepSeek AI integration

Your LoRA adapter in `fine_tuned_model/` is served by a small Python API. The Node backend proxies chat requests to it.

## Architecture

```
Browser (iSmart chat on /problem/:id)
  → POST /ai/chat (Express, port 3000)
    → POST /chat (Python + PEFT, port 8000)
      → deepseek-coder-1.3b-base + your LoRA weights
```

On each question, the app automatically sends:

- Problem title and description
- Visible test cases
- Starter code for the selected language
- **Current Monaco editor code** (via `getCurrentCode()`)
- Your question

## 1. Python environment (one-time)

```powershell
cd ai_service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

First run downloads the base model from Hugging Face (~2.5 GB). GPU is used if CUDA is available; otherwise CPU (slower).

## 2. Start services (every session)

**Terminal 1 – AI inference**

```powershell
cd ai_service
.\venv\Scripts\Activate.ps1
python -m uvicorn inference:app --host 0.0.0.0 --port 8000
```

Or: `.\start.ps1`

**Terminal 2 – Node API**

```powershell
cd src
npm start
```

**Terminal 3 – Frontend**

```powershell
cd front\mahesh
npm run dev
```

## 3. Environment

In `src/.env` add (optional; default is `http://localhost:8000`):

```
AI_SERVICE_URL=http://localhost:8000
```

## 4. Using iSmart on a problem

1. Open any problem: `/problem/:id`
2. Click **iSmart AI** on the left panel
3. Write code in the editor on the right
4. Ask questions — context is attached automatically

## Prompt format

If answers look off, adjust `build_prompt()` in `ai_service/inference.py` to match the exact format you used on Kaggle during fine-tuning.

## Troubleshooting

### `memory allocation of XXXXX bytes failed` (Windows)

This means **RAM ran out** while loading the 2.7 GB model. Developer Mode only fixes the symlink *warning*, not RAM.

**Do this:**

1. Close Chrome, games, and other heavy apps (need **~4 GB free RAM** minimum).
2. Restart the AI server after the code update (uses **float16** + `low_cpu_mem_usage` — about half the RAM of float32).
3. Run from `ai_service`:
   ```powershell
   .\start.ps1
   ```
4. Check health: open `http://localhost:8000/health` — should show `"model_loaded": true`.

If it still fails:

- Restart the PC to free memory.
- Ensure you have **64-bit Python** and **8 GB+ system RAM** (16 GB recommended).
- On a laptop with 8 GB RAM, close everything except the terminal before starting.

| Issue | Fix |
|-------|-----|
| "AI server is not running" | Start uvicorn on port 8000 |
| Symlink warning on Windows | Enable Developer Mode OR set `HF_HUB_DISABLE_SYMLINKS_WARNING=1` (in start.ps1) |
| Out of memory | float16 mode in inference.py; free RAM; 8GB+ system RAM |
| Slow replies on CPU | Normal for 1.3B; consider GPU or smaller `MAX_NEW_TOKENS` |
