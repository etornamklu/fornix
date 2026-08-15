import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const FAQ = () => {
    const faqs = [
        {
            question: "Is there a free trial available?",
            answer: "Yes! You get 2 credits to use during the free trial, with access to all features."
        },
        // {
        //     question: "Can I change my plan later?",
        //     answer: "Yes, you can upgrade or downgrade your plan at any time.",
        // },
        {
            question: "What is your cancellation policy?",
            answer: "You can purchase credits at any time, no need for a subscription!"
        },
        {
            question: "Can other info be added to an invoice?",
            answer: "Yes, you can add any information you need to the invoice."
        },
        {
            question: "How does billing work?",
            answer: "You will be billed whenever you decide to purchase credits, and only then."
        }
        // {
        //     question: "How do I change my account email?",
        //     answer:
        //         "You can change your account email in the settings section of your account.",
        // },
    ]

    return (
        <div className="flex flex-col gap-12 items-center mt-6 px-2 scroll-mt-24" id="faq">
            <div className="flex flex-col items-center gap-8">
                <div className="max-w-2xl text-center">
                    <p className="text-4xl md:text-5xl font-bold">Frequently Asked Questions</p>
                </div>
                <div className="max-w-xl text-center">
                    <p className="text-[#475569]">Everything you need to know about the product and billing.</p>
                </div>
            </div>
            <div className="w-full px-4 md:max-w-screen-md">
                <Accordion type="single" collapsible>
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-[#64748B]">{faq.answer}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    )
}

export default FAQ
