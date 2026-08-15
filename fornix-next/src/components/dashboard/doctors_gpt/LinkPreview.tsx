import {DoctorGptSourceLink, LogoVariants} from "@/utils/types";
import {useEffect, useState} from "react";
import mql from "@microlink/mql";
import {LogoAsset} from "@/components/assets/LogoAsset";
import {GoLink} from "react-icons/go";

interface MicrolinkData {
    title: string
    description: string
    url: string
    image?: {
        url: string
    }
    publisher: string
}

export const LinkPreview = ({sourceLink}: { sourceLink: DoctorGptSourceLink }) => {
    const [mqlData, setMqlData] = useState<MicrolinkData | null>(null)

    const getMqlData = async () => {
        try {
            const {data} = await mql(sourceLink.url) as any
            setMqlData(data as MicrolinkData)
        } catch (err) {
            console.log(err)
        }
    }
    useEffect(() => {
        getMqlData()
    }, [])

    return (
        <a
            href={sourceLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg bg-gray-50 shadow w-full`}>
            <div className='flex h-32 w-full justify-between p-3'>
                <div className='flex justify-center items-center w-1/3'>
                    {mqlData?.image ? (
                        <img
                            src={mqlData.image.url}
                            alt={mqlData.title}
                            className='w-full h-full object-cover'
                        />
                    ) : (<LogoAsset size={50} title={false} variant={LogoVariants.primary}/>)}
                </div>

                <div className='flex flex-col justify-between w-3/5'>
                    <p className='text-lg font-semibold overflow-hidden whitespace-nowrap text-ellipsis'>
                        {mqlData ? mqlData.title : sourceLink.url}
                    </p>
                    <div className='w-full flex flex-col gap-1'>
                        <p className='w-[90%] line-clamp-2 text-sm'>
                            {mqlData ? mqlData.description : sourceLink.description}
                        </p>
                        <div className='flex justify-between gap-6 text-gray-600'>
                            <p className='lowercase overflow-hidden whitespace-nowrap text-ellipsis text-xs'>
                                {mqlData ? mqlData.publisher : sourceLink.url}
                            </p>
                            <GoLink size={20}/>
                        </div>
                    </div>
                </div>
            </div>
        </a>
    )
}