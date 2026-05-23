import React, { useEffect, useRef, useState } from "react";
import { getThumb, putThumb } from "../utils/thumbCache";

let pdfjsPromise: Promise<any> | null = null;
const loadPdfJs = (): Promise<any> => {
  if (!pdfjsPromise) {
    // @ts-ignore - dynamic import of .mjs lacks declared types in some setups
    pdfjsPromise = import("pdfjs-dist").then((mod: any) => {
      const pdfjs = mod;
      pdfjs.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
};

const generateThumb = async (path: string, width = 220): Promise<string> => {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument(path);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const scale = width / viewport.width;
  const scaled = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = scaled.width;
  canvas.height = scaled.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  await page.render({ canvasContext: ctx, viewport: scaled }).promise;
  return canvas.toDataURL("image/png");
};

interface Props {
  path?: string;
  cacheKey?: string;
  alt?: string;
}

type State = "idle" | "loading" | "done" | "error";

const PdfThumbnail: React.FC<Props> = ({ path, cacheKey, alt = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<State>("idle");
  const triedRef = useRef(false);

  useEffect(() => {
    if (!path) {
      setState("error");
      return;
    }
    let cancelled = false;
    const el = ref.current;
    if (!el) return;

    const tryLoad = async () => {
      if (triedRef.current) return;
      triedRef.current = true;

      const key = cacheKey || path;
      const cached = await getThumb(key);
      if (cached) {
        if (!cancelled) {
          setSrc(cached);
          setState("done");
        }
        return;
      }

      setState("loading");
      try {
        const dataUrl = await generateThumb(path, 220);
        if (cancelled) return;
        setSrc(dataUrl);
        setState("done");
        putThumb(key, dataUrl);
      } catch {
        if (cancelled) return;
        setState("error");
      }
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              io.disconnect();
              tryLoad();
              break;
            }
          }
        },
        { rootMargin: "200px 0px" }
      );
      io.observe(el);
      return () => {
        cancelled = true;
        io.disconnect();
      };
    }
    tryLoad();
    return () => {
      cancelled = true;
    };
  }, [path, cacheKey]);

  return (
    <div ref={ref} className="pdf-thumb-wrap" aria-hidden={!src}>
      {src ? (
        <img src={src} alt={alt} className="pdf-thumb-img" loading="lazy" />
      ) : state === "loading" ? (
        <div className="pdf-thumb-loading">
          <span className="spinner" />
        </div>
      ) : (
        <div className="pdf-thumb-fallback">
          <span className="thumb-text">PDF</span>
        </div>
      )}
    </div>
  );
};

export default PdfThumbnail;
