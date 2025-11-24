import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BASE_URL } from "../../constants/API";

const parseQuery = (qs) => Object.fromEntries(new URLSearchParams(qs));

const drivePreviewUrl = (link) => {
  if (!link) return null;
  const m1 = link.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (m1?.[1]) return `https://drive.google.com/uc?export=view&id=${m1[1]}`;
  const m2 = link.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m2?.[1]) return `https://drive.google.com/uc?export=view&id=${m2[1]}`;
  return link;
};

const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url || "");
const isPDF = (url) => /\.pdf(\?.*)?$/i.test(url || "") || url?.includes("drive.google.com");
const isVideo = (url) => /\.(mp4|webm)$/i.test(url || "");

const PDFViewer = ({ url }) => (
  <iframe
    src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`}
    className="w-full h-32 rounded"
    title="pdf"
  />
);

const VideoPreview = ({ url }) => (
  <video src={url} className="w-full h-32 rounded object-cover" controls />
);

const LinkPreview = ({ url }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className="w-full h-32 bg-gray-100 rounded flex items-center justify-center text-blue-600 underline"
  >
    View File
  </a>
);

export default function ProfileView({ user }) {
  const location = useLocation();
  const query = parseQuery(location.search);
  const scope = query.scope || "self";
  const token = localStorage.getItem("token");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/profile/items?scope=${encodeURIComponent(scope)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error("profilehub fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [scope]);

  const previewBlock = (certLink, fileView) => {
    const url = fileView || certLink;
    if (!url) return null;

    const previewURL = isImage(url) ? drivePreviewUrl(url) : url;

    if (isImage(url)) return <img src={previewURL} className="w-full h-32 object-cover rounded" />;
    if (isPDF(url)) return <PDFViewer url={previewURL} />;
    if (isVideo(url)) return <VideoPreview url={previewURL} />;
    return <LinkPreview url={previewURL} />;
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Items ({items.length})</h2>
        <p className="text-sm text-gray-500">Scope: {scope}</p>
      </div>

      {loading && <p>Loading…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it) => {
          const certLink = it?.extra?.cert_link || it?.extra?.link || null;
          const preview = previewBlock(certLink, it.file_view_link);

          return (
            <div key={it.id} className="p-4 bg-white rounded shadow flex gap-4">
              <div style={{ minWidth: 120, maxWidth: 160 }}>
                {preview ? (
                  preview
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    No preview
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{it.title}</h3>
                    <div className="text-xs text-gray-500">
                      {it.type} • {it.owner_name}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    {new Date(it.created_at).toLocaleString()}
                    {user?.id === it.owner_user_id && (
                      <div
                        onClick={() => {
                          setDeleteId(it.id);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 text-sm mt-2 cursor-pointer"
                      >
                        Delete
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 mt-2">{it.description}</p>

                <div className="mt-3 flex gap-3">
                  {(it.file_view_link || certLink) && (
                    <a
                      href={it.file_view_link || certLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600"
                    >
                      Open
                    </a>
                  )}
                  {it.extra?.link && (
                    <a
                      href={it.extra.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600"
                    >
                      Project
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && items.length === 0 && (
        <p className="text-gray-500 mt-6">No items found.</p>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-3">Delete Item?</h2>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={async () => {
                  await fetch(`${BASE_URL}/profile/item/${deleteId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  setShowDeleteModal(false);
                  fetchItems();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
