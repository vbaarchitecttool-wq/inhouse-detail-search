import React, { useMemo } from "react";

// categories: indexData.categories のツリー
// selectedCategoryPaths: ["外部/陸屋根/00_陸屋根(仕様)", ...]
// onToggleCategoryPath: (string | string[]) => void
export default function CategoryFilter({
  categories,
  selectedCategoryPaths,
  onToggleCategoryPath,
}) {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const selectedSet = useMemo(
    () =>
      new Set(
        Array.isArray(selectedCategoryPaths) ? selectedCategoryPaths : []
      ),
    [selectedCategoryPaths]
  );

  const getChildren = (node) =>
    node && Array.isArray(node.children) ? node.children : [];
  const isLeaf = (node) => getChildren(node).length === 0;

  // ノード配下の「葉フルパス一覧」を収集
  const collectLeafPaths = (node, parentPathArr) => {
    const name = node?.name ?? "";
    const curPathArr = [...parentPathArr, name];

    if (isLeaf(node)) return [curPathArr.join("/")];

    const leaves = [];
    getChildren(node).forEach((ch) => {
      leaves.push(...collectLeafPaths(ch, curPathArr));
    });
    return leaves;
  };

  // ノード状態（親のチェック表示用）
  const getNodeCheckState = (node, parentPathArr) => {
    const leafPaths = collectLeafPaths(node, parentPathArr);
    const checkedCount = leafPaths.filter((p) => selectedSet.has(p)).length;

    return {
      leafPaths,
      checkedCount,
      allChecked: checkedCount > 0 && checkedCount === leafPaths.length,
      someChecked: checkedCount > 0 && checkedCount < leafPaths.length,
      noneChecked: checkedCount === 0,
    };
  };

  const renderNode = (node, parentPathArr, depth = 0) => {
    const name = node?.name ?? "";
    const id = node?.id ?? `${parentPathArr.join("/")}/${name}`;
    const children = getChildren(node);

    const state = getNodeCheckState(node, parentPathArr);

    // 親は「全チェック＝checked」「一部＝indeterminate」「なし＝unchecked」
    const checked = state.allChecked;

    const onChange = () => {
      // 葉は単体トグル（1件）
      if (isLeaf(node)) {
        const path = [...parentPathArr, name].join("/");
        onToggleCategoryPath(path);
        return;
      }
      // 親は配下の葉を一括トグル（配列）
      onToggleCategoryPath(state.leafPaths);
    };

    return (
      <div key={id} style={{ marginLeft: depth * 14, marginTop: 6 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={checked}
            ref={(el) => {
              if (el) el.indeterminate = state.someChecked;
            }}
            onChange={onChange}
          />
          <span style={{ userSelect: "none" }}>
            {name}{" "}
            {typeof node?.count === "number" ? (
              <span style={{ color: "#6b7280" }}>({node.count})</span>
            ) : null}
          </span>
        </label>

        {children.length > 0 ? (
          <div style={{ marginTop: 4 }}>
            {children.map((ch) =>
              renderNode(ch, [...parentPathArr, name], depth + 1)
            )}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div>
      <div
        style={{ fontWeight: 700, marginBottom: 8, display: "flex", gap: 6 }}
      >
        <span>📁</span>
        <span>カテゴリ</span>
      </div>

      {safeCategories.length > 0 ? (
        safeCategories.map((root) => renderNode(root, [], 0))
      ) : (
        <div style={{ color: "#6b7280", fontSize: 12 }}>
          カテゴリがありません
        </div>
      )}
    </div>
  );
}
