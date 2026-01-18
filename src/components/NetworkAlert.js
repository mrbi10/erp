import { useEffect, useState } from "react";
import { BASE_URL } from "../constants/API";

export default function NetworkAlert() {
  const [show, setShow] = useState(false);
  const [backendReady, setBackendReady] = useState(false);


  // useEffect(() => {
  //   const checkServer = async () => {
  //     try {
  //       const controller = new AbortController();
  //       const timeoutId = setTimeout(() => controller.abort(), 3000);

  //       const res = await fetch(`${BASE_URL}/status`, {
  //         method: "GET",
  //         signal: controller.signal,
  //       });

  //       clearTimeout(timeoutId);
  //       if (!res.ok) throw new Error("Bad response");
  //       setShow(false);
  //     } catch {
  //       setShow(true);
  //     }
  //   };

  //   checkServer();
  //   const interval = setInterval(checkServer, 10000);
  //   return () => clearInterval(interval);
  // }, []);

  useEffect(() => {
  const checkServer = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${BASE_URL}/status`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Bad response");

      setBackendReady(true); 
    } catch {
      setBackendReady(false); 
    }
  };

  checkServer();
  const interval = setInterval(checkServer, 8000);

  return () => clearInterval(interval);
}, []);


  // if (!show) return null;
  if (backendReady) return null;


  return (
    // <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[9999] animate-fadeIn">
    //   <div className="bg-white rounded-2xl shadow-2xl max-w-md w-[90%] p-8 text-center border-t-4 border-red-600">
    //     <h2 className="text-2xl font-semibold text-gray-900 mb-3">
    //       Uh-oh! Please connect to the MNM-JEC Wi-Fi
    //     </h2>
    //     <p className="text-gray-600 text-[15px] leading-relaxed mb-6">
    //       This ERP system is accessible only within the{" "}
    //       <span className="font-semibold text-gray-800">
    //         MNM Jain Engineering College
    //       </span>{" "}
    //       campus network.
    //     </p>
    //     <button
    //       onClick={() => window.location.reload()}
    //       className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
    //     >
    //       Retry
    //     </button>
    //   </div>
    // </div>

    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999]">
  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-[90%] p-8 text-center">
    <h2 className="text-2xl font-semibold text-gray-900 mb-3">
      Preparing the ERP system…
    </h2>

    <p className="text-gray-600 text-[15px] leading-relaxed mb-6">
      The server is starting up. This usually takes a few seconds on first access.
      Please stay on this page.
    </p>

    <div className="flex justify-center">
      <span className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-gray-900 rounded-full" />
    </div>
  </div>
</div>

  );
}
