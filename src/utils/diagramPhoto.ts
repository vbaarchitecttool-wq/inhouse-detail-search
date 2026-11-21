import captions from "./diagramPhotoCaptions.json";

const photoCaptions: Readonly<Record<string, string>> = captions;
const SVG_ARIA_LABEL_PATTERN = /\baria-label="([^"]+)"/;
export const DIAGRAM_PHOTO_CACHE_REVISION = "20261121-1";

const hashLabel = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

/** 図解写真のURL。画面表示とオフライン一括保存で必ず同じ文字列になるよう、ここで一元化する */
export const diagramPhotoUrl = (hash: string): string =>
  `/diagrams/photo-${hash}.webp?v=${DIAGRAM_PHOTO_CACHE_REVISION}`;

export interface DiagramPhoto {
  caption: string;
  src: string;
}

export const getDiagramPhoto = (svg: string): DiagramPhoto | null => {
  const label = svg.match(SVG_ARIA_LABEL_PATTERN)?.[1]?.trim();
  if (!label) return null;

  const hash = hashLabel(label);
  const caption = photoCaptions[hash];
  if (!caption) return null;

  return {
    caption,
    src: diagramPhotoUrl(hash),
  };
};
