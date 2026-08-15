UPSERT_THREAD = """
INSERT INTO thread_ids (thread_id, patient_id, type, created_at)
VALUES (:thread_id, :patient_id, :type, now())
ON CONFLICT (thread_id, patient_id)
DO NOTHING;
"""