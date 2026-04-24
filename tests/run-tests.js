import assert from "node:assert/strict";
import { processHierarchy } from "../src/services/hierarchyService.js";

const testCases = [
  {
    name: "builds a valid tree and computes depth",
    run() {
      const result = processHierarchy(["A->B", "A->C", "B->D"]);

      assert.deepEqual(result.hierarchies, [
        {
          root: "A",
          tree: {
            A: {
              B: {
                D: {}
              },
              C: {}
            }
          },
          depth: 3
        }
      ]);
      assert.deepEqual(result.summary, {
        total_trees: 1,
        total_cycles: 0,
        largest_tree_root: "A"
      });
    }
  },
  {
    name: "tracks invalid, duplicate, and multi-parent edges separately",
    run() {
      const result = processHierarchy(["A->B", "A->B", "hello", "C->B", "D->E"]);

      assert.deepEqual(result.invalid_entries, ["hello"]);
      assert.deepEqual(result.duplicate_edges, ["A->B"]);
      assert.equal(result.summary.total_trees, 2);
    }
  },
  {
    name: "marks cyclic components and omits depth",
    run() {
      const result = processHierarchy(["A->B", "B->C", "C->A"]);

      assert.deepEqual(result.hierarchies, [
        {
          root: "A",
          has_cycle: true,
          tree: {}
        }
      ]);
      assert.deepEqual(result.summary, {
        total_trees: 0,
        total_cycles: 1,
        largest_tree_root: null
      });
    }
  },
  {
    name: "uses lexicographical root for pure cycles",
    run() {
      const result = processHierarchy(["D->E", "E->F", "F->D"]);

      assert.equal(result.hierarchies[0].root, "D");
    }
  },
  {
    name: "breaks largest-tree ties lexicographically",
    run() {
      const result = processHierarchy(["A->B", "C->D"]);

      assert.equal(result.summary.largest_tree_root, "A");
    }
  },
  {
    name: "stores repeated duplicates only once",
    run() {
      const result = processHierarchy(["A->B", "A->B", "A->B"]);

      assert.deepEqual(result.duplicate_edges, ["A->B"]);
    }
  },
  {
    name: "rejects non-array input",
    run() {
      const result = processHierarchy("A->B");

      assert.deepEqual(result, {
        error: "The request body must contain a data array of strings."
      });
    }
  }
];

let passedCount = 0;

for (const testCase of testCases) {
  try {
    testCase.run();
    passedCount += 1;
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    console.error(`FAIL ${testCase.name}`);
    console.error(error);
    process.exit(1);
  }
}

console.log(`\n${passedCount}/${testCases.length} tests passed.`);
