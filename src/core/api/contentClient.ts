import axios from "axios";

// Content client factory — attaches X-API-Key for a specific site
export function makeContentClient(apiKey: string) {
  const client = axios.create({ baseURL: "" });
  client.interceptors.request.use((config) => {
    config.headers["X-API-Key"] = apiKey;
    return config;
  });
  return client;
}
