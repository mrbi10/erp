import React, { useState } from "react";
import Swal from "sweetalert2";
import { BASE_URL } from "../../constants/API";
import { FaUserClock } from "react-icons/fa";

export default function SecurityLateEntry({ user }) {
  const [rollNo, setRollNo] = useState("");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const DEPT_MAP = {
    1: "CSE",
    2: "ECE",
    3: "EEE",
    4: "MECH",
    5: "CIVIL",
    6: "IT",
  };

  const handleMarkLate = async () => {
    if (!rollNo.trim()) {
      Swal.fire({
        title: "Missing Roll No",
        text: "Please enter a register number.",
        icon: "warning",
        customClass: {
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded",
          cancelButton:
            "bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded ml-2",
        },
        buttonsStyling: false,
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/lateentry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roll_no: rollNo.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setStudent(data.student);
        Swal.fire({
          title: "Marked Late",
          html: `
            <div style="text-align:center">
              <strong>Name:</strong> ${data.student.name}<br/>
              <strong>Reg No:</strong> ${data.student.roll_no}<br/>
              <strong>Dept:</strong> ${DEPT_MAP[data.student.dept]}<br/>
              <strong>Year:</strong> ${data.student.year}
            </div>
          `,
          icon: "warning",
          confirmButtonColor: "#2563eb",
          customClass: {
            confirmButton:
              "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded",
            cancelButton:
              "bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded ml-2",
          },
          buttonsStyling: false,
        });
        setRollNo("");
      } else {
        Swal.fire({
          title: "Error",
          text: data.message || "Failed to load data",
          icon: "error",
          customClass: {
            confirmButton: "!bg-blue-600 hover:!bg-blue-700 text-white font-semibold px-4 py-2 rounded transition",
            cancelButton:
              "bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded ml-2",
          },
          buttonsStyling: false,
        });
      }
    } catch (err) {
      console.error("Error marking late:", err);
      Swal.fire({
        title: "Error",
        text: "Server unreachable",
        icon: "error",
        customClass: {
          confirmButton:
            "bg-blue-600 text-white font-semibold px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-700 transition",
          cancelButton:
            "bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded ml-2 hover:bg-gray-300 transition",
        },
        buttonsStyling: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-center mb-4">
          <FaUserClock className="text-blue-600 text-3xl mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">
            Security Late Entry Portal
          </h1>
        </div>

        <p className="text-gray-600 text-sm mb-4 text-center">
          Enter student Register Number to mark as late (after 9:00 AM)
        </p>

        <input
          type="number"
          inputMode="numeric"
          placeholder="Enter Register Number"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value.replace(/\D/g, ""))}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring focus:ring-blue-200 mb-4 text-center text-lg tracking-wide"
          disabled={loading}
        />

        <button
          onClick={handleMarkLate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          {loading ? "Marking..." : "Mark Late"}
        </button>

        {student && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center text-gray-700">
            <p className="font-semibold">{student.name}</p>
            <p className="text-sm">{student.roll_no}</p>
            <p className="text-sm">
              {DEPT_MAP[student.dept]} - {student.year} Year
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Marked as late successfully
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
