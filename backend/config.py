import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
BIGQUERY_DATASET = os.getenv("BIGQUERY_DATASET", "oracle_data")

MODELS = {
    "gpt4": "gpt-4o",
    "claude": "claude-sonnet-4-20250514",
    "gemini": "gemini-2.5-flash"
}

PROBE_INTERVAL_HOURS = 24
MAX_QUESTIONS_PER_RUN = 10

UNCERTAINTY_MARKERS = [
    "approximately", "around", "roughly", "about",
    "i think", "i believe", "i'm not sure", "not certain",
    "might be", "could be", "may be", "possibly",
    "unclear", "uncertain", "don't know", "not sure",
    "estimate", "ballpark"
]