"use client"

import React, { SetStateAction, useEffect, useState } from "react"
import Slider from "react-slick"
import { LogoAsset } from "../assets/LogoAsset"
import { LogoVariants } from "@/utils/types"
import CarouselImage1 from "../../../public/images/carousel/c1.jpg"
import CarouselImage2 from "../../../public/images/carousel/c2.jpg"
import CarouselImage3 from "../../../public/images/carousel/c3.jpg"
import CarouselImage4 from "../../../public/images/carousel/c4.jpg"
import Image, { StaticImageData } from "next/image"

const PrimaryCarousel = ({
    images,
    setActiveSlide
}: {
    images: StaticImageData[]
    setActiveSlide: React.Dispatch<SetStateAction<number>>
}) => {
    const [slideState, setSlideState] = useState(0)

    const settings = {
        dots: false,
        infinite: true,
        speed: 800,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        afterChange: (currentSlide: number) => setSlideState(currentSlide)
    }

    useEffect(() => {
        setActiveSlide(slideState)
    }, [slideState])

    return (
        <div className="w-full h-[90vh] isolate">
            <Slider {...settings}>
                {images.map((image, index) => (
                    <div key={index} className="w-full h-full flex justify-center items-center">
                        <Image
                            src={image.src}
                            alt={`slide-${index}`}
                            width={image.width}
                            height={image.height}
                            className="w-full h-[80vh] object-cover object-top rounded-xl"
                        />
                    </div>
                ))}
            </Slider>
        </div>
    )
}

export const OnboardingCarousel = () => {
    const [activeSlide, setActiveSlide] = useState(0)

    const images = [CarouselImage1, CarouselImage2, CarouselImage3, CarouselImage4]

    const ReviewCard = () => {
        return (
            <div className="flex w-full justify-center px-8">
                <div className="flex justify-between gap-6 flex-col rounded-xl bg-glass py-6 px-6">
                    <div className="text-gray-200 leading-8">
                        <strong>Fornix AI</strong> transforms healthcare with seamless doctor-patient connectivity. Its
                        user-friendly interface ensures easy access and secure communication, while AI integration
                        enhances diagnostics and promotes proactive health management. A game-changer for efficient and
                        quality healthcare.
                    </div>

                    <div className="flex gap-4">
                        {/*<div*/}
                        {/*    className="flex justify-center items-center rounded-xl bg-amber-200 w-16 h-16 overflow-hidden">*/}
                        {/*    <Image*/}
                        {/*        src={CarouselImage2.src}*/}
                        {/*        alt={`doc-james-img`}*/}
                        {/*        width={100}*/}
                        {/*        height={100}*/}
                        {/*        className="object-cover min-w-full h-full"*/}
                        {/*    />*/}
                        {/*</div>*/}

                        <div className="flex flex-col justify-evenly text-sm">
                            <span className="font-semibold text-white">Dr. James Appiah</span>
                            <span className="text-xs text-gray-300">Senior doctor @ Korle Bu Teaching Hospital</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const CarouselSlideIndicator = () => {
        return (
            <div className="w-full flex gap-2 justify-center items-center">
                {Array.from({ length: images.length }, (_, index) => (
                    <div
                        key={index}
                        className={"w-3 h-3 rounded-full " + (activeSlide == index ? " bg-white " : " bg-gray-500 ")}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="relative w-full h-full max-h-[1200px] max-w-[1000px] py-3 rounded-lg lg:flex lg:flex-col items-center overflow-hidden hidden">
            <PrimaryCarousel images={images} setActiveSlide={setActiveSlide} />
            <div className="absolute w-full h-full">
                <div className="h-full grid grid-rows-4 justify-between py-8 px-4">
                    {/* rounded circle */}
                    <div className="w-fit px-4">
                        <LogoAsset size={40} variant={LogoVariants.plain} title={false} />
                    </div>

                    <div className="flex flex-col justify-between items-center row-span-3">
                        <div className="flex flex-col gap-4 justify-center text-balance h-fit mx-16">
                            <p className="text-white text-4xl font-bold">Begin your health journey with Fornix AI.</p>
                            <p className="text-gray-200 text-lg">
                                Discover a holistic approach to well-being with Fornix AI, guiding you on your health
                                journey through innovative and personalized solutions.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <ReviewCard />
                            <CarouselSlideIndicator />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
