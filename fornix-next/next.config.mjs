import withPWAInit from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        AUTH_SECRET: process.env.AUTH_SECRET,
    },

    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "picsum.photos"
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com"
            }
        ],
    },

    async rewrites() {
        return [
            { source: '/privacy', destination: '/privacy.html' },
        ]
    },
};

const withPWA = withPWAInit({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    mode: 'production'
})

// module.exports = withPWA(nextConfig);
export default withPWA(nextConfig);
// export default nextConfig;
