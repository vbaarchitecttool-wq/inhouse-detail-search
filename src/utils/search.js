// src/utils/search.js

// 文字列安全化
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));

// 正規化（全角半角・大文字小文字など、最低限の揺れを吸収）
const normalize = (s) => safeStr(s).toLowerCase().replace(/\s+/g, " ").trim();

// detail の全文検索用文字列を作る（searchText があればそれ優先）
const buildSearchBlob = (detail) => {
  const title = safeStr(detail?.title);
  const desc = safeStr(detail?.description);
  const tags = Array.isArray(detail?.tags) ? detail.tags.join(" ") : "";
  const category = Array.isArray(detail?.categoryPath)
    ? detail.categoryPath.join(" ")
    : "";
  const searchText = safeStr(detail?.searchText);

  // searchText が用意されているならそれを最優先（無い場合は合成）
  const blob =
    searchText.length > 0 ? searchText : `${title} ${desc} ${tags} ${category}`;
  return normalize(blob);
};

// detail のカテゴリパス（"外部/陸屋根/01_..."）を作る
const buildCategoryPathKey = (detail) => {
  if (!Array.isArray(detail?.categoryPath)) return "";
  return detail.categoryPath.join("/");
};

// selectedCategories の1要素が
// - "外部/陸屋根/01_..." のような「パス」
// - "陸屋根" のような「名前」
// どちらでも、detail とマッチできるようにする
const matchCategory = (detail, selectedCategories) => {
  if (!Array.isArray(selectedCategories) || selectedCategories.length === 0)
    return true;

  const detailPath = buildCategoryPathKey(detail); // "外部/陸屋根/01_..."
  const detailPathNorm = normalize(detailPath);

  const detailNames = Array.isArray(detail?.categoryPath)
    ? detail.categoryPath
    : [];
  const detailNamesNorm = detailNames.map((n) => normalize(n));

  // どれか1つでも一致したらOK（OR条件）
  return selectedCategories.some((selRaw) => {
    const sel = safeStr(selRaw);
    if (!sel) return false;

    // パス指定っぽいなら（"/" を含む）→ 前方一致もOKにする
    if (sel.includes("/")) {
      const selNorm = normalize(sel);
      // 完全一致 or 「親カテゴリ選択」で子も含めたいので startsWith
      return (
        detailPathNorm === selNorm || detailPathNorm.startsWith(selNorm + "/")
      );
    }

    // 名前指定なら、categoryPath のどこかに含まれるか
    const selNorm = normalize(sel);
    return detailNamesNorm.includes(selNorm);
  });
};

const matchFileType = (detail, selectedFileTypes) => {
  if (!Array.isArray(selectedFileTypes) || selectedFileTypes.length === 0)
    return true;

  const files = detail?.files || {};
  const hasPdf = !!files.pdf?.path;
  const hasDwg = !!files.dwg?.path;
  const hasDxf = !!files.dxf?.path;

  // どれか1つでも一致したらOK（OR条件）
  return selectedFileTypes.some((t) => {
    const key = safeStr(t).toLowerCase();
    if (key === "pdf") return hasPdf;
    if (key === "dwg") return hasDwg;
    if (key === "dxf") return hasDxf;
    return false;
  });
};

export const searchDetails = (
  details,
  query,
  selectedCategories,
  selectedFileTypes
) => {
  const list = Array.isArray(details) ? details : [];
  const q = normalize(query);

  return list.filter((detail) => {
    // 1) カテゴリ絞り込み
    if (!matchCategory(detail, selectedCategories)) return false;

    // 2) ファイル種別絞り込み
    if (!matchFileType(detail, selectedFileTypes)) return false;

    // 3) フリーワード（空なら通す）
    if (!q) return true;

    const blob = buildSearchBlob(detail);
    return blob.includes(q);
  });
};

export const sortDetails = (details, sortType) => {
  const list = Array.isArray(details) ? [...details] : [];
  const type = safeStr(sortType);

  if (type === "name-asc") {
    list.sort((a, b) =>
      safeStr(a?.title).localeCompare(safeStr(b?.title), "ja")
    );
    return list;
  }
  if (type === "name-desc") {
    list.sort((a, b) =>
      safeStr(b?.title).localeCompare(safeStr(a?.title), "ja")
    );
    return list;
  }
  if (type === "date-desc") {
    list.sort((a, b) =>
      safeStr(b?.updatedAt).localeCompare(safeStr(a?.updatedAt))
    );
    return list;
  }
  if (type === "date-asc") {
    list.sort((a, b) =>
      safeStr(a?.updatedAt).localeCompare(safeStr(b?.updatedAt))
    );
    return list;
  }

  // デフォルト：カテゴリ順（categoryPath を文字列化して並べる）
  list.sort((a, b) => {
    const ap = safeStr(buildCategoryPathKey(a));
    const bp = safeStr(buildCategoryPathKey(b));
    const c = ap.localeCompare(bp, "ja");
    if (c !== 0) return c;
    return safeStr(a?.title).localeCompare(safeStr(b?.title), "ja");
  });
  return list;
};
