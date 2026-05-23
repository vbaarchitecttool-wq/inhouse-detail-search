import React, { useState } from "react";
import JSZip from "jszip";
import type { Detail } from "../types";

interface Props {
  selectedIds: string[];
  allDetails: Detail[];
  onClear: () => void;
}

const safeName = (s: string): string =>
  String(s || "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 80);

const BulkDownloadBar: React.FC<Props> = ({
  selectedIds,
  allDetails,
  onClear,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!selectedIds || selectedIds.length === 0) return null;

  const detailsToZip = allDetails.filter((d) => selectedIds.includes(d.id));

  const handleDownload = async () => {
    setBusy(true);
    setError("");
    try {
      const zip = new JSZip();
      for (const d of detailsToZip) {
        const folder = zip.folder(safeName(d.title || d.id));
        if (!folder) continue;
        for (const [type, info] of Object.entries(d.files || {})) {
          if (!info?.path) continue;
          try {
            const res = await fetch(info.path);
            if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
            const blob = await res.blob();
            folder.file(`${safeName(d.title || d.id)}.${type}`, blob);
          } catch (e) {
            folder.file(
              `_${type}_FAILED.txt`,
              `Failed to fetch: ${info.path}\n${String(e)}`
            );
          }
        }
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `details_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bulk-bar" role="region" aria-label="一括ダウンロード">
      <div className="bulk-info">
        <span className="bulk-count">{selectedIds.length}件選択中</span>
        {error ? <span className="bulk-error">⚠ {error}</span> : null}
      </div>
      <div className="bulk-actions">
        <button
          type="button"
          className="bulk-btn bulk-btn-secondary"
          onClick={onClear}
          disabled={busy}
        >
          選択解除
        </button>
        <button
          type="button"
          className="bulk-btn bulk-btn-primary"
          onClick={handleDownload}
          disabled={busy}
        >
          {busy ? "ZIP作成中…" : "ZIPで一括ダウンロード"}
        </button>
      </div>
    </div>
  );
};

export default BulkDownloadBar;
