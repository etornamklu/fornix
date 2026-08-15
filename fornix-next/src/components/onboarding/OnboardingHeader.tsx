import { LogoVariants, ProfileSetupSteps } from "@/utils/types"
import { LogoAsset } from "../assets/LogoAsset"
import HelpCircle from "../../../public/help-circle.svg"
import Button from "../global/Button"
import Link from "next/link"
import Image from "next/image"
import { IoChevronBackOutline } from "react-icons/io5"

function OnboardingHeader({ step, onGoBack }: { step: ProfileSetupSteps; onGoBack?: () => void }) {
    return (
        <header className="py-4 sticky top-0 left-0 bg-white border-b-[1px] z-[3] w-full ">
            <nav>
                <ul className="flex w-full justify-between">
                    {step === ProfileSetupSteps.StepTwo && (
                        <li className="sm:hidden flex items-center" onClick={onGoBack}>
                            <IoChevronBackOutline size={20} className="w-8 h-8 text-gray-500 rounded-full bg-gray-50" />
                        </li>
                    )}

                    <li className="">
                        <Link href={"/"}>
                            <LogoAsset size={100} title={true} variant={LogoVariants.primary} />
                        </Link>
                    </li>

                    <li className="flex gap-4">
                        {step === ProfileSetupSteps.StepTwo && (
                            <Button variant="plain" className="hidden lg:block" onClick={onGoBack}>
                                <span>...go back</span>
                            </Button>
                        )}
                        <NeedHelpButton />
                    </li>
                </ul>
            </nav>
        </header>
    )
}

export default OnboardingHeader

function NeedHelpButton() {
    return (
        <Button className="flex gap-2 w-fit rounded-lg items-center outline-gray-400" variant="outline">
            <span>
                <Image src={HelpCircle} alt={"need-help"} width={20} height={20} />
            </span>
            <Link href={"#"} className="font-bold">
                Need help?
            </Link>
        </Button>
    )
}
