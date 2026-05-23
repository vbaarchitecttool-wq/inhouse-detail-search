import React, { useMemo } from "react";
import type { CategoryNode } from "../types";

interface Props {
  categories: CategoryNode[];
  selectedCategoryPaths: string[];
  onToggleCategoryPath: (payload: string | string[]) => void;
}

interface NodeState {
  leafPaths: string[];
  checkedCount: number;
  allChecked: boolean;
  someChecked: boolean;
  noneChecked: boolean;
}

const CategoryFilter: React.FC<Props> = ({
  categories,
  selectedCategoryPaths,
  onToggleCategoryPath,
}) => {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const selectedSet = useMemo(
    () =>
      new Set(
        Array.isArray(selectedCategoryPaths) ? selectedCategoryPaths : []
      ),
    [selectedCategoryPaths]
  );

  const getChildren = (node: CategoryNode | undefined): CategoryNode[] =>
    node && Array.isArray(node.children) ? node.children : [];
  const isLeaf = (node: CategoryNode | undefined) => getChildren(node).length === 0;

  const collectLeafPaths = (
    node: CategoryNode,
    parentPathArr: string[]
  ): string[] => {
    const name = node?.name ?? "";
    const curPathArr = [...parentPathArr, name];
    if (isLeaf(node)) return [curPathArr.join("/")];
    const leaves: string[] = [];
    getChildren(node).forEach((ch) => {
      leaves.push(...collectLeafPaths(ch, curPathArr));
    });
    return leaves;
  };

  const getNodeCheckState = (
    node: CategoryNode,
    parentPathArr: string[]
  ): NodeState => {
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

  const renderNode = (
    node: CategoryNode,
    parentPathArr: string[],
    depth = 0
  ): React.ReactNode => {
    const name = node?.name ?? "";
    const id = node?.id ?? `${parentPathArr.join("/")}/${name}`;
    const children = getChildren(node);
    const state = getNodeCheckState(node, parentPathArr);
    const checked = state.allChecked;

    const onChange = () => {
      if (isLeaf(node)) {
        const path = [...parentPathArr, name].join("/");
        onToggleCategoryPath(path);
        return;
      }
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
};

export default CategoryFilter;
