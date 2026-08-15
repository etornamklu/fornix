import FAQ from "@/components/landing/faq"
import Features from "@/components/landing/features"
import Footer from "@/components/landing/footer"
import LandingHero from "@/components/landing/hero"
import LandingNavbar from "@/components/landing/navbar"
import Pricing from "@/components/landing/pricing"
import Reviews from "@/components/landing/reviews"
import WhyFornix from "@/components/landing/why_us"
import Contact from "@/components/landing/contact"
import "@/app/globals.css"

const Home = () => {
    return (
        <main className="xl:max-w-screen-2xl mx-auto font-['Product_Sans',_sans-serif]">
            <div className="scroll-smooth">
                <LandingNavbar />
                <LandingHero />
                <WhyFornix />
                {/*<Reviews/>*/}
                <Features />
                {/*<Pricing/>*/}
                <FAQ />
                {/*<Contact/>*/}
                <Footer />
            </div>
        </main>
    )
}

export default Home
