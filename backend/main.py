from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_tables, get_latest_scores
from drift_tracker import get_model_drift_summary, get_leaderboard
from probe_engine import run_probe_cycle
from scheduler import start_scheduler
from consistency_engine import run_cross_model_probe
from ground_truth import verify_answer
from questions import PROBE_QUESTIONS

app = FastAPI(title="ORACLE API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    create_tables()
    start_scheduler()

@app.get("/")
def root():
    return {"status": "ORACLE is running"}

@app.get("/leaderboard")
def leaderboard():
    return get_leaderboard()

@app.get("/drift")
def drift(days: int = 30):
    return get_model_drift_summary(days)

@app.get("/drift/{model}")
def model_drift(model: str, days: int = 30):
    from database import get_drift_history
    return get_drift_history(model, days)

@app.post("/probe/run")
def trigger_probe():
    run_id = run_probe_cycle()
    return {"status": "complete", "run_id": run_id}

@app.post("/probe/query")
def query_probe(payload: dict):
    question = payload.get("question")
    if not question:
        return {"error": "No question provided"}
    result = run_cross_model_probe(question)
    return result

@app.get("/questions")
def get_questions():
    return PROBE_QUESTIONS