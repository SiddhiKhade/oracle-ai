import uuid
import datetime
from questions import PROBE_QUESTIONS
from consistency_engine import run_cross_model_probe
from ground_truth import verify_answer
from database import insert_probe_result, insert_drift_score, get_drift_history
import statistics

def compute_z_score(current: float, history: list, key: str) -> float:
    values = [h[key] for h in history if h.get(key) is not None]
    if len(values) < 3:
        return 0.0
    mean = statistics.mean(values)
    stdev = statistics.stdev(values)
    if stdev == 0:
        return 0.0
    return (current - mean) / stdev

def run_probe_cycle():
    run_id = str(uuid.uuid4())
    print(f"\n=== ORACLE Probe Run: {run_id} ===")
    print(f"Time: {datetime.datetime.utcnow()}\n")

    model_scores = {"gpt4": [], "claude": [], "gemini": []}
    model_accuracy = {"gpt4": [], "claude": [], "gemini": []}

    for q in PROBE_QUESTIONS:
        print(f"Probing: {q['question']}")
        try:
            result = run_cross_model_probe(q["question"])
            for model_name, model_result in result["model_results"].items():
                verification = verify_answer(q["id"], model_result["primary_answer"] or "")
                is_correct = verification.get("correct", False)
                error_rate = verification.get("error_rate", 1.0)

                insert_probe_result(
                    run_id=run_id,
                    question_id=q["id"],
                    question=q["question"],
                    model=model_name,
                    confidence=model_result["confidence_score"],
                    consistency=model_result["consistency_score"],
                    uncertainty=model_result["uncertainty_score"],
                    cross_agreement=result["cross_model_agreement"],
                    is_correct=is_correct,
                    error_rate=error_rate,
                    primary_answer=str(model_result["primary_answer"])[:500] if model_result["primary_answer"] else ""
                )

                model_scores[model_name].append(model_result["confidence_score"])
                model_accuracy[model_name].append(1.0 if is_correct else 0.0)

        except Exception as e:
            print(f"  Error on question {q['id']}: {e}")

    # Compute and store drift scores
    for model_name in ["gpt4", "claude", "gemini"]:
        scores = model_scores[model_name]
        accuracy = model_accuracy[model_name]
        if not scores:
            continue

        avg_confidence = sum(scores) / len(scores)
        avg_accuracy = sum(accuracy) / len(accuracy)

        history = get_drift_history(model_name, days=30)
        z_score = compute_z_score(avg_confidence, history, "avg_confidence")
        anomaly = abs(z_score) > 2.0

        insert_drift_score(
            model=model_name,
            avg_confidence=avg_confidence,
            avg_consistency=avg_confidence,
            avg_accuracy=avg_accuracy,
            anomaly=anomaly,
            z_score=z_score
        )

        print(f"\n{model_name.upper()} — Confidence: {avg_confidence:.3f} | Accuracy: {avg_accuracy:.3f} | Z-Score: {z_score:.3f} | Anomaly: {anomaly}")

    # Batch insert everything to BigQuery
    from database import flush_to_bigquery
    flush_to_bigquery()

    print(f"\n=== Run {run_id} complete ===")
    for model_name, model_result in result["model_results"].items():
        if model_name in ["gpt4", "gemini"]:
         print(f"\n{model_name} raw answer: {model_result['primary_answer'][:200]}")
         print(f"{model_name} extracted numbers: {model_result['extracted_numbers']}")
    return run_id

if __name__ == "__main__":
    run_probe_cycle()
    flush_to_bigquery()