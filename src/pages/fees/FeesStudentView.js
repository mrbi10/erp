import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../constants/API";
import { useParams } from "react-router-dom";


export default function FeesStudentView() {
  const { reg_no } = useParams();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [info, setInfo] = useState(null);

  const load = async () => {
    try {
      const res = await fetch(`${BASE_URL}/fees/${reg_no}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      setInfo(json);
    } catch (err) {
      console.error("Error fetching student fee info:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!info)
    return (
      <div className="p-10 text-center text-gray-600 text-lg">
        Loading student fee details…
      </div>
    );


  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">
            {info.roll_no}
          </span>
          {info.name}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="p-5 bg-gradient-to-br from-green-50 to-white border rounded-xl shadow text-center">
            <p className="text-gray-500 font-medium mb-1">Total Paid</p>
            <h2 className="text-3xl font-extrabold text-green-700">
              ₹{info.amount_paid}
            </h2>
          </div>

          <div className="p-5 bg-gradient-to-br from-red-50 to-white border rounded-xl shadow text-center">
            <p className="text-gray-500 font-medium mb-1">Balance</p>
            <h2 className="text-3xl font-extrabold text-red-600">
              ₹{info.balance}
            </h2>
          </div>

          <div className="p-5 bg-gradient-to-br from-blue-50 to-white border rounded-xl shadow text-center">
            <p className="text-gray-500 font-medium mb-1">Payment Status</p>
            <h2
              className={`text-2xl font-bold ${
                info.payment_status === "Paid"
                  ? "text-green-700"
                  : info.payment_status === "Partial"
                  ? "text-orange-600"
                  : "text-red-600"
              }`}
            >
              {info.payment_status}
            </h2>
          </div>
        </div>
      </div>

      
    </div>
  );
}
