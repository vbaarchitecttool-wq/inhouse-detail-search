const SVG_ARIA_LABEL_PATTERN = /\baria-label="([^"]+)"/;

const hashLabel = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export interface DiagramPhoto {
  alt: string;
  src: string;
}

export const getDiagramPhoto = (svg: string): DiagramPhoto | null => {
  const label = svg.match(SVG_ARIA_LABEL_PATTERN)?.[1]?.trim();
  if (!label) return null;

  return {
    alt: `AI生成の施工イメージ。${label}`,
    src: `/diagrams/photo-${hashLabel(label)}.webp`,
  };
};
