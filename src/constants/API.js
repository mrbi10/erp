const BASE_URLS = [
    "http://192.168.0.69:5000/api",
    "http://localhost:5000/api",
    "http://192.168.0.50:5000/api",
    "http://192.168.1.6:5000/api",
    "http://192.168.29.236:5000/api",
    "http://192.168.1.4:5000/api",
    "http://10.157.240.226:5000/api",
];

let activeBaseUrl = null;

export const getBaseUrl = async () => {
    if (activeBaseUrl) return activeBaseUrl;

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
                    activeBaseUrl = url;
                    console.log("✅ Backend connected:", url);
                    return url;
                }
            }
        } catch (err) {
            // try next URL silently
        }
    }

    throw new Error("❌ No backend server reachable");
};
