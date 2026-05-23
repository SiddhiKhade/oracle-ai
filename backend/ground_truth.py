import re
import yfinance as yf
from questions import PROBE_QUESTIONS

def extract_number_from_response(text: str):
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
def verify_answer(question_id: str, model_answer: str) -> dict:
    question = next((q for q in PROBE_QUESTIONS if q["id"] == question_id), None)
    if not question:
        return {"verified": False, "reason": "Question not found"}

    ground_truth = question["ground_truth"]
    tolerance = question["tolerance"]
    extracted = extract_number_from_response(model_answer)

    if extracted is None:
        return {
            "verified": False,
            "correct": False,
            "ground_truth": ground_truth,
            "model_answer_extracted": None,
            "reason": "Could not extract number from response"
        }

    error_rate = abs(extracted - ground_truth) / ground_truth
    is_correct = error_rate <= tolerance

    return {
        "verified": True,
        "correct": is_correct,
        "ground_truth": ground_truth,
        "model_answer_extracted": extracted,
        "error_rate": round(error_rate, 4),
        "tolerance": tolerance
    }