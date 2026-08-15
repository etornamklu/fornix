TRANSCRIPT_CLEANING_PROMPT = """
Your task is to clean and organize a transcript of a conversation between a doctor and a patient. 
The transcript is provided as a single block of text, with no separation between the messages from the patient and the doctor. 
Additionally, the transcript may contain spelling mistakes or incomplete sentences.

Your goal is to:

1. Identify and separate the individual messages from the patient and the doctor.
2. Correct any spelling mistakes or incomplete sentences.
3. Organize the messages into a neat and readable format, with clear labeling for the patient's messages and the doctor's messages.

The input will be provided as a single string, containing the entire disorganized transcript. You should output the cleaned and organized transcript, with each message on a new line, and labeled as either "Patient:" or "Doctor:".

Transcript: 
{transcript}
"""


REPORT_PROMPT_TEMPLATE = """
You are an AI medical assistant. You will be provided with a transcript of a patient's a doctor's message that may contain spelling mistakes and not separation of the messages from each party. Your task is to identify and extract detailed relevant medical information from the patient's responses and present it in a structured format according to the schema provided to serve as the patient's history. Follow the exact format and ensure all fields are populated accurately based on the information available in the transcript.
---
Transcript:

{transcript}
---

Please extract a detailed information and format it according to the schema provided in `PatientHistory`.
Make sure you don't miss any important information and where a field is not available, ignore it.
If a field is not available, ignore it from the json output.
"""