"use client";

import { useParams } from "next/navigation";
import { DashboardPath } from "@/utils/types";

import PhysicalExamPage from "@/app/(site)/dashboard/(clinician)/report/page";
import HistoryTakingPage from "@/app/(site)/dashboard/(clinician)/report/page"
import ProgressNotesPage from "@/app/(site)/dashboard/(clinician)/report/page"
import OperativeNotesPage from "@/app/(site)/dashboard/(clinician)/report/page"
import AdmissionNotesPage from "@/app/(site)/dashboard/(clinician)/report/page"
import DischargeSummaryPage from "@/app/(site)/dashboard/(clinician)/report/page"
import ProcedureNotePage from "@/app/(site)/dashboard/(clinician)/report/page"
import ReferralNotesPage from "@/app/(site)/dashboard/(clinician)/report/page"

const pageMap: Partial<Record<DashboardPath, JSX.Element>> = {
    [DashboardPath.Examination]: <PhysicalExamPage />,
    [DashboardPath.HistoryTaking]: <HistoryTakingPage />,
    [DashboardPath.ProgressNotes]: <ProgressNotesPage />,
    [DashboardPath.OperativeNotes]: <OperativeNotesPage />,
    [DashboardPath.AdmissionNotes]: <AdmissionNotesPage />,
    [DashboardPath.DischargeSummary]: <DischargeSummaryPage />,
    [DashboardPath.ProcedureNote]: <ProcedureNotePage />,
    [DashboardPath.ReferralNotes]: <ReferralNotesPage />,
};

export default function ACCDynamicPage() {
    const params = useParams();
    const slug = params.slug;

    if (!slug || typeof slug !== "string") return null;

    const slugPath = `/${slug}` as DashboardPath;
    const Component = pageMap[slugPath];

    if (!Component) return <div className="text-red-500 mt-10 text-center">Page not found</div>;

    return <>{Component}</>;
}
