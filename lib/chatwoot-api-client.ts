import axios from "axios";

const chatwoot_access_key = process.env.NEXT_PUBLIC_CHATWOOT_ACCESS_KEY!;

export const chatwoot_api_client = axios.create({
  baseURL: "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${chatwoot_access_key}`,
  },
});
