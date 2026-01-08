let resolvedBaseUrl = null;
let resolvingPromise = null;

const BASE_URLS = [
  "http://192.168.29.235:5000/api",
  "http://localhost:5000/api",
  "https://erp-mnmjec-backend.onrender.com/api",
  // "https://10.199.0.10/api",
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
        if (data?.ok) {
          console.log("✅ Backend connected:", url);
          return url;
        }
      }
    } catch {
      // try next
    }
  }

  throw new Error("No backend reachable");
};

export const BASE_URL = await (async () => {
  if (resolvedBaseUrl) return resolvedBaseUrl;

  if (!resolvingPromise) {
    resolvingPromise = detectBaseUrl();
  }

  resolvedBaseUrl = await resolvingPromise;
  return resolvedBaseUrl;
})();
