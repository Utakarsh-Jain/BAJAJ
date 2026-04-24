const EDGE_PATTERN = /^([A-Z])->([A-Z])$/;

function createNodeRecord(label) {
  return {
    label,
    children: [],
    parent: null
  };
}

function getOrCreateNode(nodeMap, label) {
  if (!nodeMap.has(label)) {
    nodeMap.set(label, createNodeRecord(label));
  }

  return nodeMap.get(label);
}

function createChildMap(nodeLabels, nodeMap) {
  return new Map(nodeLabels.map((label) => [label, [...nodeMap.get(label).children]]));
}

function buildTree(nodeLabel, childMap) {
  const tree = {};
  const children = childMap.get(nodeLabel) ?? [];

  // Recursively expand the accepted edges so the response mirrors the hierarchy.
  for (const childLabel of children) {
    tree[childLabel] = buildTree(childLabel, childMap);
  }

  return tree;
}

function getDepth(nodeLabel, childMap) {
  const children = childMap.get(nodeLabel) ?? [];

  if (children.length === 0) {
    return 1;
  }

  let longestChildPath = 0;

  for (const childLabel of children) {
    longestChildPath = Math.max(longestChildPath, getDepth(childLabel, childMap));
  }

  return longestChildPath + 1;
}

function hasCycle(rootLabel, childMap) {
  const visited = new Set();
  const activePath = new Set();

  function dfs(nodeLabel) {
    // Revisiting a node on the current DFS path confirms a directed cycle.
    if (activePath.has(nodeLabel)) {
      return true;
    }

    if (visited.has(nodeLabel)) {
      return false;
    }

    visited.add(nodeLabel);
    activePath.add(nodeLabel);

    for (const childLabel of childMap.get(nodeLabel) ?? []) {
      if (dfs(childLabel)) {
        return true;
      }
    }

    activePath.delete(nodeLabel);
    return false;
  }

  return dfs(rootLabel);
}

function collectComponents(nodeMap) {
  const visited = new Set();
  const components = [];

  for (const node of nodeMap.values()) {
    if (visited.has(node.label)) {
      continue;
    }

    const component = [];
    const stack = [node.label];

    while (stack.length > 0) {
      const currentLabel = stack.pop();

      if (visited.has(currentLabel)) {
        continue;
      }

      visited.add(currentLabel);
      component.push(currentLabel);

      const currentNode = nodeMap.get(currentLabel);

      for (const childLabel of currentNode.children) {
        if (!visited.has(childLabel)) {
          stack.push(childLabel);
        }
      }

      if (currentNode.parent && !visited.has(currentNode.parent)) {
        stack.push(currentNode.parent);
      }
    }

    component.sort();
    components.push(component);
  }

  return components;
}

function parseEdges(data) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const duplicateEdgeSet = new Set();
  const multiParentEdges = [];
  const seenEdges = new Set();
  const parentByChild = new Map();
  const nodeMap = new Map();

  for (const rawEntry of data) {
    const entry = String(rawEntry ?? "").trim();
    const match = entry.match(EDGE_PATTERN);

    if (!match || match[1] === match[2]) {
      invalidEntries.push(entry);
      continue;
    }

    if (seenEdges.has(entry)) {
      if (!duplicateEdgeSet.has(entry)) {
        duplicateEdges.push(entry);
        duplicateEdgeSet.add(entry);
      }
      continue;
    }

    seenEdges.add(entry);

    const [, parentLabel, childLabel] = match;

    if (parentByChild.has(childLabel)) {
      multiParentEdges.push(entry);
      continue;
    }

    const parentNode = getOrCreateNode(nodeMap, parentLabel);
    const childNode = getOrCreateNode(nodeMap, childLabel);

    parentByChild.set(childLabel, parentLabel);
    childNode.parent = parentLabel;
    parentNode.children.push(childLabel);
  }

  for (const node of nodeMap.values()) {
    node.children.sort();
  }

  return {
    invalidEntries,
    duplicateEdges,
    multiParentEdges,
    nodeMap
  };
}

function createSummary(trees) {
  const validTrees = trees.filter((tree) => !tree.has_cycle);
  let largestTreeRoot = null;
  let largestDepth = -1;

  for (const tree of validTrees) {
    if (
      tree.depth > largestDepth ||
      (tree.depth === largestDepth && (largestTreeRoot === null || tree.root < largestTreeRoot))
    ) {
      largestDepth = tree.depth;
      largestTreeRoot = tree.root;
    }
  }

  return {
    total_trees: validTrees.length,
    total_cycles: trees.length - validTrees.length,
    largest_tree_root: largestTreeRoot
  };
}

function buildTreeGroups(nodeMap) {
  const components = collectComponents(nodeMap);
  const trees = [];

  for (const componentNodes of components) {
    const componentSet = new Set(componentNodes);
    const rootCandidates = componentNodes.filter((label) => {
      const parentLabel = nodeMap.get(label).parent;
      return !parentLabel || !componentSet.has(parentLabel);
    });
    const root = rootCandidates.length > 0 ? rootCandidates[0] : componentNodes[0];
    const childMap = createChildMap(componentNodes, nodeMap);

    if (hasCycle(root, childMap)) {
      trees.push({
        root,
        has_cycle: true,
        tree: {}
      });
      continue;
    }

    trees.push({
      root,
      tree: {
        [root]: buildTree(root, childMap)
      },
      depth: getDepth(root, childMap)
    });
  }

  return trees;
}

export function processHierarchy(data) {
  if (!Array.isArray(data)) {
    return {
      error: "The request body must contain a data array of strings."
    };
  }

  const { invalidEntries, duplicateEdges, multiParentEdges, nodeMap } = parseEdges(data);
  const trees = buildTreeGroups(nodeMap);

  return {
    hierarchies: trees,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: createSummary(trees)
  };
}
