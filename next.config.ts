import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las fichas técnicas de producto admiten PDF de hasta 10MB (como el
      // legacy); se deja margen para el overhead de multipart.
      bodySizeLimit: "12mb",
    },
  },
};

export default withNextIntl(nextConfig);
