import { DashboardPath } from "@/utils/types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type TabStore = {
    activeTab: DashboardPath
    setActiveTab: (tab: DashboardPath) => void // Allow partial updates
    resetActiveTab: () => void
}

export const useTabStore = create<TabStore>()(
    persist(
        set => ({
            activeTab: DashboardPath.Base,
            setActiveTab: (tab: DashboardPath) => set({ activeTab: tab }),
            resetActiveTab: () => set({ activeTab: DashboardPath.Base })
        }),
        {
            name: "tab-store"
        }
    )
)
