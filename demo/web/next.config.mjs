/** @type {import('next').NextConfig} */
import { createProxyMiddleware } from 'http-proxy-middleware';

const nextConfig = {
    reactStrictMode: false,
    output: 'standalone',
    async rewrites() {
        return [
            {
                source: '/rest/:path*',
                destination: 'http://192.168.6.93:4080/rest/:path*',
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/rest/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'X-Requested-With, Content-Type',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;