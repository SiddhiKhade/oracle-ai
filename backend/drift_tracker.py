from database import get_drift_history, get_latest_scores
import statistics

def get_model_drift_summary(days: int = 30) -> dict:
    models = ["gpt4", "claude", "gemini"]
    summary = {}
    for model in models:
        history = get_drift_history(model, days)
        if not history:
            summary[model] = {"status": "no_data"}
            continue

        confidences = [h["avg_confidence"] for h in history]
        accuracies = [h["avg_accuracy"] for h in history]
        anomalies = [h for h in history if h.get("anomaly_detected")]

        summary[model] = {
            "avg_confidence_30d": round(statistics.mean(confidences), 3),
            "avg_accuracy_30d": round(statistics.mean(accuracies), 3),
            "confidence_trend": round(confidences[-1] - confidences[0], 3) if len(confidences) > 1 else 0,
            "anomaly_count": len(anomalies),
            "last_anomaly": anomalies[-1]["timestamp"] if anomalies else None,
            "history": history
        }

    return summary

def get_leaderboard() -> list:
    scores = get_latest_scores()
    leaderboard = []
    for s in scores:
        leaderboard.append({
            "model": s["model"],
            "avg_confidence": round(s.get("avg_confidence", 0), 3),
            "avg_consistency": round(s.get("avg_consistency", 0), 3),
            "avg_accuracy": round(s.get("avg_accuracy", 0), 3),
            "epistemic_score": round(
                (s.get("avg_confidence", 0) * 0.4) +
                (s.get("avg_consistency", 0) * 0.3) +
                (s.get("avg_accuracy", 0) * 0.3), 3
            )
        })
    leaderboard.sort(key=lambda x: x["epistemic_score"], reverse=True)
    return leaderboard