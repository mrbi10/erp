export let BASE_URL = "";

const BASE_URLS = [
  "http://192.168.0.69:5000/api",
  "http://localhost:5000/api",
  "http://192.168.0.50:5000/api",
  "http://192.168.1.6:5000/api",
  "http://192.168.29.236:5000/api",
  "http://192.168.1.4:5000/api",
  "http://10.157.240.226:5000/api",
];

let initialized = false;

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
          BASE_URL = url;
          console.log("✅ Backend connected:", url);
          return;
        }
      }
    } catch {
      // try next
    }
  }

  console.error("❌ No backend server reachable");
};

(async () => {
  if (!initialized) {
    initialized = true;
    await detectBaseUrl();
  }
})();
