import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel';
import FormController from '@/components/onboarding/FormController';

export default function Authentication() {
    return (
        <main className="flex justify-center lg:gap-32 items-start md:items-center w-full h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12 p-4 w-full h-[100vh]">
                <div className="lg:flex justify-center items-center hidden">
                    <OnboardingCarousel />
                </div>
                <FormController />
            </div>
        </main>
    );
}
