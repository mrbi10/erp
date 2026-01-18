let resolvedBaseUrl = null;
let resolvingPromise = null;

const BASE_URLS = [
  "https://erp-mnmjec-backend.onrender.com/api",
  // "http://localhost:5000/api",
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

// 🔑 SINGLE source of truth
export let BASE_URL = "";

// 🔑 MUST be awaited once before app renders
export const initBaseUrl = async () => {
  if (BASE_URL) return BASE_URL;

  if (!resolvingPromise) {
    resolvingPromise = detectBaseUrl();
  }

  resolvedBaseUrl = await resolvingPromise;

  // IMPORTANT: never leave BASE_URL as null
  BASE_URL = resolvedBaseUrl || "";

  return BASE_URL;
};
