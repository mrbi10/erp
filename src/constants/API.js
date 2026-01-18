let resolvedBaseUrl = null;
let resolvingPromise = null;

const BASE_URLS = [
  // "http://localhost:5000/api",
  "https://erp-mnmjec-backend.onrender.com/api",
];

const detectBaseUrl = async () => {
  for (const url of BASE_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${url}/status`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data?.ok) return url;
      }
    } catch {}
  }

  return null;
};

export const getBaseUrl = async () => {
  if (resolvedBaseUrl) return resolvedBaseUrl;
  if (!resolvingPromise) resolvingPromise = detectBaseUrl();
  resolvedBaseUrl = await resolvingPromise;
  return resolvedBaseUrl;
};

export let BASE_URL = null;

export const initBaseUrl = async () => {
  BASE_URL = await getBaseUrl();
  return BASE_URL;
};
