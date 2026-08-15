export interface RadiologyReport {
    id: string
    name: string
    created_at: string

    patient_name?: string
    study_type?: string
    status?: string
}

export const MOCK_RADIOLOGY_REPORTS: RadiologyReport[] = [
    {
        id: "rad_001",
        name: "RADIOLOGY_REPORT_2025-01-15_10:30:49",
        created_at: "2024-01-15T10:30:00Z",
        patient_name: "John Smith",
        study_type: "Chest X-Ray"
    },
    {
        id: "rad_002",
        name: "RADIOLOGY_REPORT_2025-01-14_14:20:33",
        created_at: "2024-01-14T14:20:00Z",
        patient_name: "Sarah Johnson",
        study_type: "MRI Brain"
    },
    {
        id: "rad_003",
        name: "RADIOLOGY_REPORT_2025-01-13_09:15:21",
        created_at: "2024-01-13T09:15:00Z",
        patient_name: "Mike Wilson",
        study_type: "CT Abdomen"
    },
    {
        id: "rad_004",
        name: "RADIOLOGY_REPORT_2025-01-12_16:45:18",
        created_at: "2024-01-12T16:45:00Z",
        patient_name: "Emma Davis",
        study_type: "Ultrasound Abdomen"
    }
]
