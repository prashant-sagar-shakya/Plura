/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "uploadthing.com",
      "utfs.io",
      "img.clerk.com",
      "subdomain",
      "files.stripe.com",
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/site",
        permanent: true,
      },
    ];
  },
  reactStrictMode: false,
};

module.exports = nextConfig;
