export const parseRole = (role: string): string => {
    const roleMap: Record<string, string> = {
        ADMIN: "Admin",
        PATIENT: "Client",
        DOCTOR: "Clinician",
        PHARMACY: "Pharmacist",
        RADIOLOGY: "Radiology",
        RADIOLOGIST: "Radiologist"
    }

    return role ? roleMap[role.toUpperCase()] || "Unknown Role" : "Unknown Role"
}
