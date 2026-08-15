import { useState, useEffect } from "react"
import { getRadiologyReports } from "@/services/dashboard/radiology.service"
import { RadiologyReport } from "@/utils/types"

export function useRadiologyNavbar() {
    const [reports, setReports] = useState<RadiologyReport[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    const filteredReports = reports.filter(report => report.name.toLowerCase().includes(search.toLowerCase()))

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getRadiologyReports()
                setReports(data)
            } catch (err) {
                setError("Failed to fetch radiology reports")
                console.error("Error fetching radiology reports:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchReports()
    }, [])

    return {
        reports,
        filteredReports,
        loading,
        error,
        search,
        setSearch,
        refetch: () => {
            const fetchReports = async () => {
                setLoading(true)
                const data = await getRadiologyReports()
                setReports(data)
                setLoading(false)
            }
            fetchReports()
        }
    }
}
