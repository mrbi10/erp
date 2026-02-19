import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../../constants/API";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaIdCard
} from "react-icons/fa";

/* ===== Format Date ===== */
const formatDate = (isoString) => {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ===== Format Pass Type ===== */
const formatPassType = (type) => {
  if (type === "jain_mess") return "Jain Mess";
  if (type === "bus") return "Bus Transport";
  return type;
};

export default function PassVerify() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [scanTime, setScanTime] = useState("");

  useEffect(() => {
    const now = new Date();
    setScanTime(
      now.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "medium",
      })
    );
    verifyPass();
  }, []);

  const verifyPass = async () => {
    try {
      const res = await fetch(`${BASE_URL}/studentPass/verify/${token}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        valid: false,
        message: "Verification failed",
      });
    }
  };

  /* ===== Loading State ===== */
  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <FaSpinner className="text-3xl text-indigo-600 animate-spin mb-3" />
        <p className="text-gray-600 font-medium">Verifying pass...</p>
      </div>
    );
  }

  const isValid = result.valid;
  const pass = result.pass;

  return (

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">

        {/* Status Icon */}
        <div className="flex justify-center mb-4">
          {isValid ? (
            <FaCheckCircle className="text-green-500 text-6xl" />
          ) : (
            <FaTimesCircle className="text-red-500 text-6xl" />
          )}
        </div>

        {/* Status Title */}
        <h2
          className={`text-2xl font-bold mb-2 ${
            isValid ? "text-green-600" : "text-red-600"
          }`}
        >
          {isValid ? "Access Granted" : "Access Denied"}
        </h2>

        <p className="text-gray-500 mb-6">{result.message}</p>

        {/* Pass Details */}
        {isValid && pass && (
          <div className="bg-gray-50 rounded-xl p-5 text-left border">
            <div className="flex items-center gap-2 mb-4">
              <FaIdCard className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">
                Pass Details
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Pass Type</span>
                <span className="font-semibold">
                  {formatPassType(pass.pass_type)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Valid Till</span>
                <span className="font-semibold">
                  {formatDate(pass.valid_till)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scan Time */}
        <div className="mt-6 text-xs text-gray-400">
          Scan Time: {scanTime}
        </div>
      </div>

  );
}
