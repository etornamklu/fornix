import { AccountType, ProfileSetupCardProps } from "@/utils/types"
import doctor from "../../../public/images/doctor.png"
import patient from "../../../public/images/patient.png"
import radiology from "../../../public/images/radiology.png"
import pharmacy from "../../../public/images/pharmacy.jpg"
import hospital from "../../../public/images/hospital.jpg"
import Image from "next/image"
import Button from "@/components/global/Button"
import { useRouter } from "next/navigation"
import Link from "next/link"

function ProfileSetupCard({ accountType, selected, onClick, ...rest }: ProfileSetupCardProps) {
    const router = useRouter()

    const subtitles = [
        "Get AI-assisted diagnosis, treatment recommendations, and structured patient histories to enhance decision-making and streamline patient care.",
        "Share symptoms through AI-driven history-taking and receive structured reports that can be securely shared with clinicians for accurate diagnosis and treatment.",
        "Leverage AI-assisted imaging analysis, structured reporting, and integration with clinical workflows to improve diagnostic precision and reporting efficiency.",
        "Access AI-powered patient summaries and clinical insights to optimize medication dispensing, improve pharmaceutical care, and ensure safe prescribing.",
        "Integrate AI-driven diagnostics, automated patient history-taking, and streamlined workflows to enhance efficiency, accuracy, and patient outcomes.",
        "For people who manage organizations, users, and billing."
    ]

    let subtitle = ""
    let image = doctor

    switch (accountType) {
        case AccountType.doctor:
            subtitle = subtitles[0]
            break
        case AccountType.patient:
            subtitle = subtitles[1]
            image = patient
            break
        case AccountType.admin:
            // Keep visual minimal; show admin-specific copy
            subtitle = subtitles[5]
            image = hospital
            break
        case AccountType.radiologist:
            subtitle = subtitles[2]
            image = radiology
            break
        case AccountType.pharmacy:
            subtitle = subtitles[3]
            image = pharmacy
            break
        case AccountType.hospital:
            subtitle = subtitles[4]
            image = hospital
            break
    }

    const demoTypes = [AccountType.pharmacy, AccountType.hospital]

    const getDemoPageLink = (): string => {
        const accountKey = Object.entries(AccountType).find(([key, value]) => value === accountType)?.[0]

        return accountKey ? `/request-demo/${accountKey}` : "/request-demo/hospital"
    }

    return (
        <div
            {...rest}
            className={`relative w-full rounded-xl p-4 outline outline-1 outline-[#DCE1E4] ${selected && "outline-[3px] outline-blue-500 bg-[#F0F7FF]"}`}
            role="button"
            aria-label="button"
            onClick={onClick}>
            {/*{accountType === AccountType.radiology && (*/}
            {/*    // || accountType === AccountType.hospital*/}
            {/*    // || accountType === AccountType.pharmacy*/}
            {/*    <div className="absolute rounded-xl bg-gray-100 opacity-50 w-full h-full z-10 left-0 top-0" />*/}
            {/*)}*/}

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex w-full lg:w-fit justify-between items-start">
                    <Image
                        src={image}
                        width={100}
                        height={200}
                        alt={accountType}
                        className="rounded-lg w-24 h-20 lg:w-36 lg:h-24 object-cover"
                    />
                    <div className="block lg:hidden">
                        <RadioButton onChange={onClick} selected={selected} />
                    </div>
                </div>
                <div className="flex w-full justify-between">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold">{accountType}</h2>
                        <span className="text-sm text-[#64748B]">{subtitle}</span>
                    </div>
                    {!demoTypes.includes(accountType) && (
                        <div className="hidden lg:block">
                            <RadioButton onChange={onClick} selected={selected} />
                        </div>
                    )}
                </div>
            </div>
            {demoTypes.includes(accountType) && (
                <Link className="w-full" href={getDemoPageLink()}>
                    <Button size="md" className="blue-gradient w-full mt-3 z-20">
                        Request Demo
                    </Button>
                </Link>
            )}
        </div>
    )
}

function RadioButton({ selected, onChange }: { selected: boolean; onChange?: () => void }) {
    return (
        <div className="relative">
            {selected ? (
                <span className="material-icons text-blue-600">check_circle</span>
            ) : (
                <input
                    type="radio"
                    name="accountType"
                    checked={selected}
                    className={`appearance-none cursor-pointer rounded-full bg-white ring-1 ring-[#DCE1E4] p-2`}
                    onChange={onChange}
                />
            )}
        </div>
    )
}

export default ProfileSetupCard
