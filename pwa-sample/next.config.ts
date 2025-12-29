/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // 開発中はPWAを無効化してループを防ぐ
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  /* ここに通常のNext.js設定を書けます */
};

module.exports = withPWA(nextConfig);