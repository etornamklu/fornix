"use client";
import Image, {StaticImageData} from "next/image";
import Doctor from "../../../public/images/doctor.png";
import KolebuLogo from "../../../public/images/landing/kulebu_logo.png";
import {motion, Variants} from "framer-motion";

interface CardProps {
    src: StaticImageData;
    name: string;
    logo?: StaticImageData;
    role: string;
    review: string;
}

const Reviews = () => {
    function Card({review, index}: { review: CardProps; index: number }) {
        const CardVariants: Variants = {
            offscreen: {
                y: 0,
                rotate: 0,
                x: 0,
            },
            onscreen: {
                y: index == 0 ? -64 : 0,
                x: index == 0 ? -20 : 8,
                rotate: index == 0 ? -6 : 2,
                width: "100%",
                transition: {
                    duration: 0.5,
                    ease: "easeInOut",
                },
            },
        };

        function CardInfo({...props}: CardProps) {
            return (
                <div className="p-2 min-w-full">
                    <div className="flex flex-col-reverse md:flex-row gap-4">
                        <div
                            className="flex flex-col gap-4 items-center bg-white px-4 py-6 rounded-[32px] shadow-xl md:basis-4/12 border border-[#E2E8F0]">
                            <div className="flex md:flex-col gap-2 items-center justify-around w-full text-center">
                                <Image
                                    src={props.src}
                                    width={100}
                                    height={100}
                                    alt="reviewer"
                                    className="object-cover rounded-2xl"
                                />

                                <div className="flex flex-col items-center gap-2 min-w-fit *:text-balance">
                                    <div>
                                        <p className="font-bold text-md md:text-lg">{props.name}</p>
                                        <p className="text-sm text-[#64748B] min-w-fit">
                                            {props.role}
                                        </p>
                                    </div>

                                    <Image
                                        src={review?.logo ?? KolebuLogo.src}
                                        width={50}
                                        height={50}
                                        alt="logo"
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-[#E2E8F0] rounded-[32px] shadow-xl">
                            <div className="flex h-full px-6 py-4 md:px-10 items-center justify-center max-w-md">
                                <p className="font-bold text-lg md:text-3xl">{props.review}</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <motion.div
                className="container sticky top-36 md:top-56 flex items-center w-fit"
                initial="offscreen"
                whileInView="onscreen"
                viewport={{once: false, amount: 0.9}}
            >
                <motion.div variants={CardVariants}>
                    <CardInfo
                        src={review.src}
                        name={review.name}
                        role={review.role}
                        review={review.review}
                        logo={review.logo}
                    />
                </motion.div>
            </motion.div>
        );
    }

    const Reviews: CardProps[] = [
        {
            src: Doctor,
            name: "John Doe",
            role: "Software Engineer",
            review: '"This product has significantly improved my productivity."',
        },
        {
            src: Doctor,
            name: "Jane Smith",
            role: "Product Manager",
            review: '"I\'m really impressed with the quality of this product."',
        },
        {
            src: Doctor,
            name: "Bob Johnson",
            role: "Data Scientist",
            review:
                '"This is a game changer! It has made my work so much easier and more efficient."',
        },
    ];

    return (
        <div
            className="bg-white/90 flex justify-center w-full pt-20 pb-40"
            id="reviews"
        >
            <div className="flex flex-col w-full">
                <div className="flex flex-col items-center gap-4 md:pb-0">
                    <div className="rounded-full w-fit bg-[#EFF5FB] py-1.5 px-4">
                        <span className="text-[#1972BF]">Reviews</span>
                    </div>
                    <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl tracking-widest">
                        Love from the wall
                    </h1>
                </div>

                <div className="flex pt-40">
                    <div className="w-full flex flex-col justify-center h-screen overflow-visible gap-12">
                        {Reviews.map((review, index) => (
                            <Card key={index} review={review} index={index}/>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reviews;
