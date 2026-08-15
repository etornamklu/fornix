import re


def diagnosis_completion_response_to_json(response_string):
    """
    This function takes the response string from the get_diagnosis_completion method
    the string is then parsed as JSON using pattern matching.

    :param response_string: the string response from the LLM.
    :return: the json parsed LLM response.
    """

    most_likely_diagnosis_pattern = re.compile(
        r"MOST LIKELY DIAGNOSIS: (.+?)\n\nREASON: (.+?)\n\n", re.DOTALL
    )
    alternative_diagnoses_pattern = re.compile(
        r'ALTERNATIVE DIAGNOSES:(.+?.+[^"])', re.DOTALL
    )
    alternative_diagnosis_items_pattern = re.compile(
        r"\d+\.\s(.+?)\sREASON: (.+?)(?=\n\n\d+\.|\n\nNone)", re.DOTALL
    )
    summary_pattern = re.compile(r"None of the alternative diagnoses(.+)", re.DOTALL)

    most_likely_diagnosis_match = most_likely_diagnosis_pattern.search(response_string)
    alternative_diagnoses_match = alternative_diagnoses_pattern.search(response_string)
    alternative_diagnoses_items = alternative_diagnosis_items_pattern.findall(
        alternative_diagnoses_match.group(1)
    )
    summary_match = summary_pattern.search(response_string)

    data = {
        "diagnosis": {
            "most_likely": most_likely_diagnosis_match.group(1)
            if most_likely_diagnosis_match
            else None,
            "reason": most_likely_diagnosis_match.group(2).strip()
            if most_likely_diagnosis_match
            else None,
        },
        "alternative_diagnoses": [
            {"name": item[0].strip(), "reason": item[1].strip()}
            for item in alternative_diagnoses_items
        ],
        # "summary": summary_match.group(1).strip() if summary_match else None
    }

    # response_as_json_string = json.dumps(data, indent=2)

    return data
