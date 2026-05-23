import re
from config import UNCERTAINTY_MARKERS, MODELS, OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

gpt4 = ChatOpenAI(model=MODELS["gpt4"], temperature=0, api_key=OPENAI_API_KEY)
claude = ChatAnthropic(model=MODELS["claude"], temperature=0, api_key=ANTHROPIC_API_KEY)
import os
gemini = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)
MODEL_CLIENTS = {
    "gpt4": gpt4,
    "claude": claude,
    "gemini": gemini
}

REPHRASINGS = [
    "{}",
    "Could you tell me: {}",
    "I need to verify: {}",
    "Please answer: {}",
    "What is the answer to: {}"
]

def extract_number(text: str):
    if not text:
        return None

    text_lower = text.lower()

    # Detect multiplier words
    multiplier = 1
    if "trillion" in text_lower:
        multiplier = 1e12
    elif "billion" in text_lower:
        multiplier = 1e9
    elif "million" in text_lower:
        multiplier = 1e6

    # Remove currency symbols and commas
    import re
    cleaned = re.sub(r'[$,]', '', text)

    # Find all numbers including decimals
    matches = re.findall(r'\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?', cleaned)

    if not matches:
        return None

    candidates = []
    for m in matches:
        try:
            val = float(m.replace(',', ''))
            # Apply multiplier if the number looks like it needs one
            if multiplier > 1 and val < 10000:
                val = val * multiplier
            elif val > 1e6:
                # Already a large number, use as-is
                pass
            candidates.append(val)
        except:
            continue

    if not candidates:
        return None

    # Return the largest number that's in a plausible revenue range
    # Filter to numbers that could be revenue (> $1M)
    revenue_candidates = [c for c in candidates if c >= 1e6]
    if revenue_candidates:
        return max(revenue_candidates)

    return candidates[0]

def detect_uncertainty(text: str) -> float:
    text_lower = text.lower()
    hits = sum(1 for m in UNCERTAINTY_MARKERS if m in text_lower)
    return min(hits / 3, 1.0)

def run_consistency_probe(question: str, model_name: str) -> dict:
    model = MODEL_CLIENTS[model_name]
    responses = []
    numbers = []
    uncertainty_scores = []

    for template in REPHRASINGS:
        rephrased = template.format(question)
        try:
            response = model.invoke([HumanMessage(content=rephrased)])
            text = response.content
            responses.append(text)
            numbers.append(extract_number(text))
            uncertainty_scores.append(detect_uncertainty(text))
        except Exception as e:
            responses.append(f"ERROR: {str(e)}")
            numbers.append(None)
            uncertainty_scores.append(0.5)

    valid = [n for n in numbers if n is not None]
    if len(valid) >= 2:
        mean = sum(valid) / len(valid)
        if mean > 0:
            variance = sum((n - mean) ** 2 for n in valid) / len(valid)
            cv = (variance ** 0.5) / mean
            consistency_score = max(0, 1 - cv)
        else:
            consistency_score = 0.5
    elif len(valid) == 1:
        consistency_score = 0.6
    else:
        consistency_score = 0.0

    avg_uncertainty = sum(uncertainty_scores) / len(uncertainty_scores)
    confidence_score = (consistency_score * 0.7) + ((1 - avg_uncertainty) * 0.3)

    return {
        "model": model_name,
        "question": question,
        "responses": responses,
        "extracted_numbers": numbers,
        "consistency_score": round(consistency_score, 3),
        "uncertainty_score": round(avg_uncertainty, 3),
        "confidence_score": round(confidence_score, 3),
        "primary_answer": responses[0] if responses else None
    }

def run_cross_model_probe(question: str) -> dict:
    results = {}
    for model_name in MODEL_CLIENTS:
        print(f"  Probing {model_name}...")
        results[model_name] = run_consistency_probe(question, model_name)

    all_numbers = []
    for r in results.values():
        valid = [n for n in r["extracted_numbers"] if n is not None]
        if valid:
            all_numbers.append(sum(valid) / len(valid))

    if len(all_numbers) >= 2:
        mean = sum(all_numbers) / len(all_numbers)
        if mean > 0:
            variance = sum((n - mean) ** 2 for n in all_numbers) / len(all_numbers)
            cv = (variance ** 0.5) / mean
            cross_model_agreement = max(0, 1 - cv)
        else:
            cross_model_agreement = 0.5
    else:
        cross_model_agreement = 0.5

    return {
        "question": question,
        "model_results": results,
        "cross_model_agreement": round(cross_model_agreement, 3)
    }