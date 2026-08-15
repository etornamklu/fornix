import {SubscriptionType} from "@/utils/types";
import SubscriptionCard from "../onboarding/SubscriptionCard";
import Style from "./styles/pricing.module.css";
import {PayButton} from "@/components/payment/PayButton";

const Pricing = () => {
    return (
        <div className="flex justify-center py-20 px-4 md:px-0" id="pricing">
            <div
                className={`${Style.LogoWrapper} bg-[#F9FAFB] isolate relative overflow-hidden rounded-[48px] p-6 md:py-12 md:px-16 max-w-fit`}
            >
                <div
                    className={`${Style.LogoBg} !bg-contain md:bg-cover bg-black absolute left-0 bottom-24
                        md:bottom-0 h-96 md:h-96 w-full`}></div>
                <div className="flex flex-col gap-20 md:gap-32">
                    <div className="flex flex-col items-center gap-8">
                        <div className="px-4 py-2 rounded-3xl max-w-fit shadow-lg text-[#334155]">
                            <span>Pricing</span>
                        </div>
                        <div className="flex flex-col gap-4 items-center">
                            <div className="max-w-xl text-center">
                                <p className="text-4xl md:text-5xl font-bold">
                                    Pick a plan that&apos;s right for you
                                </p>
                            </div>
                            <div className="max-w-2xl text-center">
                                <p className="text-[#475569]">
                                    Choose from our three plans - Free, Standard and Premium or
                                    contact us for more details about our custom plans
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center mt-16">
                    <div className="flex flex-col md:flex-row items-end gap-8">
                        <div className="h-fit">
                            <SubscriptionCard
                                type={SubscriptionType.creditPack1}
                            />
                        </div>
                        <div className="flex flex-col-reverse md:flex-row items-end gap-8">
                            <SubscriptionCard
                                type={SubscriptionType.creditPack3}
                            />
                            <div className="h-fit">
                                <SubscriptionCard
                                    type={SubscriptionType.creditPack2}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
