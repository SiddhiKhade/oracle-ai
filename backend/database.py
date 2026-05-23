from google.cloud import bigquery
import datetime
import os

# Client initialized lazily so config.py credentials run first
_client = None
_probe_buffer = []
_drift_buffer = []

def get_client():
    global _client
    if _client is None:
        from config import GCP_PROJECT_ID
        _client = bigquery.Client(project=GCP_PROJECT_ID)
    return _client

def get_dataset_ref():
    from config import GCP_PROJECT_ID, BIGQUERY_DATASET
    return f"{GCP_PROJECT_ID}.{BIGQUERY_DATASET}"

def create_tables():
    client = get_client()
    dataset_ref = get_dataset_ref()

    schema_probe_results = [
        bigquery.SchemaField("run_id", "STRING"),
        bigquery.SchemaField("timestamp", "TIMESTAMP"),
        bigquery.SchemaField("question_id", "STRING"),
        bigquery.SchemaField("question", "STRING"),
        bigquery.SchemaField("model", "STRING"),
        bigquery.SchemaField("confidence_score", "FLOAT"),
        bigquery.SchemaField("consistency_score", "FLOAT"),
        bigquery.SchemaField("uncertainty_score", "FLOAT"),
        bigquery.SchemaField("cross_model_agreement", "FLOAT"),
        bigquery.SchemaField("is_correct", "BOOL"),
        bigquery.SchemaField("error_rate", "FLOAT"),
        bigquery.SchemaField("primary_answer", "STRING"),
    ]

    schema_drift = [
        bigquery.SchemaField("timestamp", "TIMESTAMP"),
        bigquery.SchemaField("model", "STRING"),
        bigquery.SchemaField("avg_confidence", "FLOAT"),
        bigquery.SchemaField("avg_consistency", "FLOAT"),
        bigquery.SchemaField("avg_accuracy", "FLOAT"),
        bigquery.SchemaField("anomaly_detected", "BOOL"),
        bigquery.SchemaField("z_score", "FLOAT"),
    ]

    for table_id, schema in [
        ("probe_results", schema_probe_results),
        ("drift_scores", schema_drift)
    ]:
        table_ref = f"{dataset_ref}.{table_id}"
        table = bigquery.Table(table_ref, schema=schema)
        try:
            client.create_table(table)
            print(f"Created table {table_id}")
        except Exception as e:
            print(f"Table {table_id} already exists or error: {e}")

def insert_probe_result(run_id, question_id, question, model,
                        confidence, consistency, uncertainty,
                        cross_agreement, is_correct, error_rate, primary_answer):
    _probe_buffer.append({
        "run_id": run_id,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "question_id": question_id,
        "question": question,
        "model": model,
        "confidence_score": confidence,
        "consistency_score": consistency,
        "uncertainty_score": uncertainty,
        "cross_model_agreement": cross_agreement,
        "is_correct": is_correct,
        "error_rate": error_rate,
        "primary_answer": primary_answer,
    })

def insert_drift_score(model, avg_confidence, avg_consistency,
                       avg_accuracy, anomaly, z_score):
    _drift_buffer.append({
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "model": model,
        "avg_confidence": avg_confidence,
        "avg_consistency": avg_consistency,
        "avg_accuracy": avg_accuracy,
        "anomaly_detected": anomaly,
        "z_score": z_score,
    })

def flush_to_bigquery():
    global _probe_buffer, _drift_buffer
    client = get_client()
    dataset_ref = get_dataset_ref()

    if _probe_buffer:
        table_ref = f"{dataset_ref}.probe_results"
        job = client.load_table_from_json(
            _probe_buffer,
            table_ref,
            job_config=bigquery.LoadJobConfig(
                write_disposition="WRITE_APPEND",
                source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
            )
        )
        job.result()
        print(f"Flushed {len(_probe_buffer)} probe results to BigQuery")
        _probe_buffer = []

    if _drift_buffer:
        table_ref = f"{dataset_ref}.drift_scores"
        job = client.load_table_from_json(
            _drift_buffer,
            table_ref,
            job_config=bigquery.LoadJobConfig(
                write_disposition="WRITE_APPEND",
                source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
            )
        )
        job.result()
        print(f"Flushed {len(_drift_buffer)} drift scores to BigQuery")
        _drift_buffer = []

def get_drift_history(model: str, days: int = 30) -> list:
    client = get_client()
    dataset_ref = get_dataset_ref()
    query = f"""
        SELECT timestamp, avg_confidence, avg_consistency,
               avg_accuracy, anomaly_detected, z_score
        FROM `{dataset_ref}.drift_scores`
        WHERE model = '{model}'
        AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {days} DAY)
        ORDER BY timestamp ASC
    """
    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"BigQuery query error: {e}")
        return []

def get_latest_scores() -> list:
    client = get_client()
    dataset_ref = get_dataset_ref()
    query = f"""
        SELECT model,
               AVG(confidence_score) as avg_confidence,
               AVG(consistency_score) as avg_consistency,
               AVG(CAST(is_correct AS INT64)) as avg_accuracy
        FROM `{dataset_ref}.probe_results`
        WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
        GROUP BY model
    """
    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"BigQuery query error: {e}")
        return []