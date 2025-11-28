// src/pages/profilehub/ProfileAdd.js

import React, { useState } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../constants/API";

export default function ProfileAdd() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [type, setType] = useState("cert");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [file, setFile] = useState(null);

  const [projectUser, setProjectUser] = useState("");
  const [projectRepo, setProjectRepo] = useState("");
  const [projectFull, setProjectFull] = useState("");

  const [certLink, setCertLink] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const typeOptions = [
    { value: "cert", label: "Certification" },
    { value: "project", label: "Project" },
    { value: "achievement", label: "Achievement" },
  ];

  const uploadFile = async (fileToUpload) => {
    if (!fileToUpload) return null;

    const fd = new FormData();
    fd.append("file", fileToUpload);

    const res = await fetch(`${BASE_URL}/profile/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    const data = await res.json();
    return data.file_id || null;
  };

  const buildGithubLink = () => {
    if (projectFull) return projectFull;

    if (projectUser && projectRepo) {
      return `https://github.com/${projectUser}/${projectRepo}`;
    }

    return "";
  };

  const handleSave = async () => {
    setError("");

    if (!title.trim()) return setError("Title is required");
    setLoading(true);

    try {
      let file_id = null;

      if (file) {
        file_id = await uploadFile(file);
      }

      const extra = {};

      if (type === "project") {
        const link = buildGithubLink();
        if (link) extra.link = link;
      }

      if (type === "cert") {
        if (certLink) extra.cert_link = certLink;
      }

      await fetch(`${BASE_URL}/profile/item`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          title,
          description,
          date: date || null,
          file_id,
          extra,
        }),
      });

      navigate("/erp/profilehub/view");
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-2xl border border-gray-100 mt-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Add New Entry</h2>

      <div className="space-y-5">

        <div>
          <p className="font-semibold mb-1 text-gray-700">Category</p>
          <Select
            value={typeOptions.find((t) => t.value === type)}
            onChange={(opt) => setType(opt.value)}
            options={typeOptions}
            className="text-sm"
            styles={{
              control: (base) => ({
                ...base,
                borderRadius: "10px",
                padding: "4px",
                borderColor: "#d1d5db",
              }),
            }}
          />
        </div>

        <div>
          <p className="font-semibold mb-1 text-gray-700">Title</p>
          <input
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Python Certificate, Portfolio Website"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <p className="font-semibold mb-1 text-gray-700">Description</p>
          <textarea
            className="w-full p-3 border rounded-xl h-28 focus:ring-2 focus:ring-blue-500"
            placeholder="Write a short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <p className="font-semibold mb-1 text-gray-700">Date</p>
          <input
            type="date"
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {type === "project" && (
          <div className="space-y-4">
            <p className="text-gray-700 font-semibold">GitHub Details</p>

            <input
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="GitHub username"
              value={projectUser}
              onChange={(e) => setProjectUser(e.target.value)}
            />

            <input
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Repository name"
              value={projectRepo}
              onChange={(e) => setProjectRepo(e.target.value)}
            />

            <p className="text-sm text-gray-500">OR paste full GitHub link</p>

            <input
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/username/repo"
              value={projectFull}
              onChange={(e) => setProjectFull(e.target.value)}
            />
          </div>
        )}

        {type === "cert" && (
          <div className="space-y-4">
            <p className="text-gray-700 font-semibold">Certificate Link</p>
            <input
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Google Drive / PDF public link"
              value={certLink}
              onChange={(e) => setCertLink(e.target.value)}
            />

            <div>
              <p className="text-sm text-gray-500 mb-1">File Upload (Optional)</p>
              <input
                type="file"
                className="w-full p-2 border rounded-xl"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          </div>
        )}

        {type === "achievement" && (
          <p className="text-sm text-gray-600">
            Achievements usually don’t require links or files. Description is enough.
          </p>
        )}

        {error && <p className="text-red-600">{error}</p>}

        <div className="flex gap-4 pt-4">
          <button
            className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 transition"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>

      </div>
    </div>
  );
}
