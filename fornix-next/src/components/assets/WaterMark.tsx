import React from 'react';
import Image from 'next/image';
import WatermarkImage from '../../assets/watermark.png';

export const Watermark = () => {
    return (
        <div className="fixed top-0 left-0 w-full flex justify-center opacity-80 pointer-events-none pl-80">
            <Image
                src={WatermarkImage.src}
                alt="Watermark"
                width={600}
                height={400}
            />
        </div>
    );
};

export default Watermark;
