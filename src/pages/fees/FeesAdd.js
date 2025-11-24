import React, { useState } from "react";
import Select from "react-select";
import * as XLSX from "xlsx";
import { BASE_URL } from "../../constants/API";
import { FaPlusCircle, FaUpload } from "react-icons/fa";

export default function FeesAdd() {
  const token = localStorage.getItem("token");

  const [mode, setMode] = useState("single"); 
  const [loading, setLoading] = useState(false);

  const feeTypeOptions = [
    { value: "SEMESTER", label: "Semester Fee" },
    { value: "HOSTEL", label: "Hostel Fee" },
    { value: "TRANSPORT", label: "Transport Fee" },
  ];

  const initialSingle = {
    reg_no: "",
    fee_type: "",
    fee_for: "",
    quota: "",
    total_amount: "",
    amount_paid: "",
    remarks: "",
  };

  const [singleForm, setSingleForm] = useState(initialSingle);
  const [bulkData, setBulkData] = useState([]);


  const handleSingleSubmit = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/fees/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(singleForm),
      });

      const data = await res.json();
      alert(data.message);

      if (data.success) {
        setSingleForm(initialSingle);
      }
    } catch (err) {
      alert("Error adding fee");
    }

    setLoading(false);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      setBulkData(json);
    };

    reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async () => {
    if (bulkData.length === 0) {
      alert("Upload an Excel file first");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/fees/bulk-insert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rows: bulkData }),
      });

      const data = await res.json();
      alert(data.message);

      if (data.success) setBulkData([]);
    } catch (err) {
      alert("Bulk upload failed");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="bg-white p-6 rounded-xl shadow-xl border-t-8 border-green-600">
        <h1 className="text-3xl font-bold mb-4">Fees Entry</h1>

        {/* MODE SWITCH */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setMode("single")}
            className={`px-5 py-2 rounded-lg shadow ${
              mode === "single"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            <FaPlusCircle className="inline mr-2" />
            Single Entry
          </button>

          <button
            onClick={() => setMode("bulk")}
            className={`px-5 py-2 rounded-lg shadow ${
              mode === "bulk"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            <FaUpload className="inline mr-2" />
            Bulk Upload
          </button>
        </div>

        {/* SINGLE ENTRY FORM */}
        {mode === "single" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="p-3 border rounded-lg"
              placeholder="Register Number"
              value={singleForm.reg_no}
              onChange={(e) =>
                setSingleForm({ ...singleForm, reg_no: e.target.value })
              }
            />

            <Select
              options={feeTypeOptions}
              placeholder="Fee Type"
              value={feeTypeOptions.find(
                (o) => o.value === singleForm.fee_type
              )}
              onChange={(v) =>
                setSingleForm({ ...singleForm, fee_type: v?.value || "" })
              }
            />

            <input
              className="p-3 border rounded-lg"
              placeholder="Fee For (Eg: 2024-25, Sem 3)"
              value={singleForm.fee_for}
              onChange={(e) =>
                setSingleForm({ ...singleForm, fee_for: e.target.value })
              }
            />

            <input
              className="p-3 border rounded-lg"
              placeholder="Quota (GQ / MQ / LE)"
              value={singleForm.quota}
              onChange={(e) =>
                setSingleForm({ ...singleForm, quota: e.target.value })
              }
            />

            <input
              className="p-3 border rounded-lg"
              type="number"
              placeholder="Total Amount"
              value={singleForm.total_amount}
              onChange={(e) =>
                setSingleForm({ ...singleForm, total_amount: e.target.value })
              }
            />

            <input
              className="p-3 border rounded-lg"
              type="number"
              placeholder="Amount Paid"
              value={singleForm.amount_paid}
              onChange={(e) =>
                setSingleForm({ ...singleForm, amount_paid: e.target.value })
              }
            />

            <textarea
              className="p-3 border rounded-lg col-span-1 md:col-span-2"
              placeholder="Remarks"
              value={singleForm.remarks}
              onChange={(e) =>
                setSingleForm({ ...singleForm, remarks: e.target.value })
              }
            ></textarea>

            <button
              onClick={handleSingleSubmit}
              className="bg-green-600 text-white px-5 py-3 rounded-lg shadow mt-4"
            >
              Save Fee
            </button>
          </div>
        )}

        {/* BULK UPLOAD */}
        {mode === "bulk" && (
          <div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="mb-4"
            />

            {bulkData.length > 0 && (
              <div className="mt-4 bg-white shadow p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">
                  Preview ({bulkData.length} records)
                </h2>

                <div className="max-h-64 overflow-auto">
                  <table className="w-full border text-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        {Object.keys(bulkData[0]).map((k) => (
                          <th key={k} className="p-2 border">
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkData.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((v, i) => (
                            <td key={i} className="p-2 border">
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleBulkSubmit}
                  className="bg-indigo-600 text-white px-5 py-3 rounded-lg shadow mt-4"
                >
                  Upload All
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
