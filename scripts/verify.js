import assert from "node:assert/strict";

const cases = [
  {
    name: "valid tree",
    data: ["A->B", "A->C", "B->D"],
    assert(payload) {
      assert.equal(payload.user_id, "utakarshjain_24042026");
      assert.equal(payload.email_id, "uj9789@srmist.edu.in");
      assert.equal(payload.college_roll_number, "RA2311030010054");
      assert.equal(payload.summary.total_trees, 1);
      assert.equal(payload.summary.total_cycles, 0);
      assert.equal(payload.hierarchies[0].depth, 3);
    }
  },
  {
    name: "duplicates, invalid, multi-parent",
    data: ["A->B", "A->B", "hello", "C->B", "D->E"],
    assert(payload) {
      assert.deepEqual(payload.invalid_entries, ["hello"]);
      assert.deepEqual(payload.duplicate_edges, ["A->B"]);
    }
  },
  {
    name: "cycle",
    data: ["A->B", "B->C", "C->A"],
    assert(payload) {
      assert.equal(payload.summary.total_cycles, 1);
      assert.equal(payload.hierarchies[0].has_cycle, true);
      assert.deepEqual(payload.hierarchies[0].tree, {});
    }
  }
];

async function run() {
  for (const testCase of cases) {
    const response = await fetch("http://127.0.0.1:3000/bfhl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data: testCase.data })
    });

    const payload = await response.json();
    assert.equal(response.status, 200);
    testCase.assert(payload);

    console.log(`\n[${testCase.name}]`);
    console.log(JSON.stringify(payload, null, 2));
  }

  console.log("\nVerification completed successfully.");
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
