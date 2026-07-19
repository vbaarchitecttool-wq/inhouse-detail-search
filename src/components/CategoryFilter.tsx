import React, { useMemo, useState } from "react";
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

  // 展開中のノードid（既定は空＝章のみ表示。章をクリックすると節が開く）
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getChildren = (node: CategoryNode | undefined): CategoryNode[] =>
    node && Array.isArray(node.children) ? node.children : [];
  const isLeaf = (node: CategoryNode | undefined) =>
    getChildren(node).length === 0;

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
    const hasChildren = children.length > 0;
    const isOpen = expanded.has(id);
    const state = getNodeCheckState(node, parentPathArr);
    const checked = state.allChecked;
    const countLabel =
      typeof node?.count === "number" ? (
        <span className="cat-count">({node.count})</span>
      ) : null;

    const onChange = () => {
      if (isLeaf(node)) {
        const path = [...parentPathArr, name].join("/");
        onToggleCategoryPath(path);
        return;
      }
      onToggleCategoryPath(state.leafPaths);
    };

    return (
      <div key={id} className="cat-node" style={{ marginLeft: depth * 14 }}>
        <div className="cat-row">
          {hasChildren ? (
            <button
              type="button"
              className="cat-caret"
              aria-expanded={isOpen}
              aria-label={isOpen ? `${name} を閉じる` : `${name} を開く`}
              onClick={() => toggleExpand(id)}
            >
              <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
            </button>
          ) : (
            <span className="cat-caret-spacer" aria-hidden="true" />
          )}

          {hasChildren ? (
            <>
              <input
                type="checkbox"
                className="cat-checkbox"
                checked={checked}
                ref={(el) => {
                  if (el) el.indeterminate = state.someChecked;
                }}
                onChange={onChange}
                aria-label={`${name} をすべて選択`}
              />
              <button
                type="button"
                className="cat-name cat-name-parent"
                aria-expanded={isOpen}
                onClick={() => toggleExpand(id)}
              >
                {name} {countLabel}
              </button>
            </>
          ) : (
            <label className="cat-leaf-label">
              <input
                type="checkbox"
                className="cat-checkbox"
                checked={checked}
                onChange={onChange}
              />
              <span className="cat-name">
                {name} {countLabel}
              </span>
            </label>
          )}
        </div>

        {hasChildren && isOpen ? (
          <div className="cat-children">
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
      <div className="cat-heading">
        <span>📁</span>
        <span>カテゴリ</span>
      </div>

      {safeCategories.length > 0 ? (
        safeCategories.map((root) => renderNode(root, [], 0))
      ) : (
        <div className="cat-empty">カテゴリがありません</div>
      )}
    </div>
  );
};

export default CategoryFilter;
