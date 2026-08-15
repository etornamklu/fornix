import RequestDemo from "@/components/dashboard/requestdemo/requestdemo"

export default function Page({ params }: { params: { slug: string } }) {
    return <RequestDemo slug={params.slug} />
}
