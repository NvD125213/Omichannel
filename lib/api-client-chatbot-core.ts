import axios, { type InternalAxiosRequestConfig } from "axios";

const apiChatbotCoreConfig = axios.create({
  baseURL: process.env.NEXT_PUBLIC_CHATBOT_CORE_API_URL,
  headers: {
    Accept: "application/json",
    "X-API-Key": process.env.NEXT_PUBLIC_CHATBOT_CORE_API_KEY,
    "Content-Type": "application/json",
  },
});

apiChatbotCoreConfig.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.data instanceof FormData && config.headers) {
      // Let the browser set multipart boundary; a manual Content-Type breaks file uploads.
      config.headers.delete("Content-Type");
    }
    return config;
  },
);

export default apiChatbotCoreConfig;
