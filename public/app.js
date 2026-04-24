const form = document.querySelector("#hierarchy-form");
const edgeInput = document.querySelector("#edge-input");
const submitButton = document.querySelector("#submit-button");
const sampleButton = document.querySelector("#sample-button");
const clearButton = document.querySelector("#clear-button");
const copyButton = document.querySelector("#copy-button");
const edgeCount = document.querySelector("#edge-count");
const statusText = document.querySelector("#status-text");
const statusPill = document.querySelector("#status-pill");
const statTrees = document.querySelector("#stat-trees");
const statCycles = document.querySelector("#stat-cycles");
const statRoot = document.querySelector("#stat-root");
const insightsEmpty = document.querySelector("#insights-empty");
const insightsContent = document.querySelector("#insights-content");
const treeGrid = document.querySelector("#tree-grid");
const invalidCount = document.querySelector("#invalid-count");
const duplicateCount = document.querySelector("#duplicate-count");
const invalidList = document.querySelector("#invalid-list");
const duplicateList = document.querySelector("#duplicate-list");
const jsonOutput = document.querySelector("#json-output");

const sampleEdges = [
  "A->B",
  "A->C",
  "B->D",
  "E->F",
  "G->H",
  "H->I",
  "I->G",
  "A->B",
  "Q->R",
  "S->R",
  "AB->C"
];

function parseInput(value) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function updateEdgeCount() {
  const edges = parseInput(edgeInput.value);
  edgeCount.textContent = `${edges.length} ${edges.length === 1 ? "edge" : "edges"}`;
}

function setStatus(state, message) {
  statusPill.dataset.state = state;
  statusPill.textContent = state === "loading" ? "Processing" : state === "error" ? "Error" : "Ready";
  statusText.textContent = message;
}

function renderSummary(summary = {}) {
  statTrees.textContent = summary.total_trees ?? "0";
  statCycles.textContent = summary.total_cycles ?? "0";
  statRoot.textContent = summary.largest_tree_root ?? "-";
}

function renderIssueList(listElement, values) {
  if (values.length === 0) {
    listElement.innerHTML = '<li class="issue-empty">None</li>';
    return;
  }

  listElement.innerHTML = values.map((value) => `<li><code>${value}</code></li>`).join("");
}

function renderIssues(payload) {
  const invalidEntries = payload.invalid_entries ?? [];
  const duplicateEdges = payload.duplicate_edges ?? [];

  invalidCount.textContent = String(invalidEntries.length);
  duplicateCount.textContent = String(duplicateEdges.length);

  renderIssueList(invalidList, invalidEntries);
  renderIssueList(duplicateList, duplicateEdges);
}

function renderTreeCards(trees = []) {
  if (trees.length === 0) {
    treeGrid.innerHTML = `
      <article class="tree-card tree-card-empty">
        <h4>No accepted trees</h4>
        <p>Only cyclic groups or invalid edges were found in this request.</p>
      </article>
    `;
    return;
  }

  treeGrid.innerHTML = trees
    .map((tree) => {
      const isCycle = tree.has_cycle === true;
      const stateClass = isCycle ? "tree-card-cycle" : "tree-card-valid";
      const stateLabel = isCycle ? "Cycle detected" : "Valid tree";
      const meta = isCycle ? "Depth omitted for cyclic groups." : `Depth: ${tree.depth}`;

      return `
        <article class="tree-card ${stateClass}">
          <div class="tree-card-top">
            <div>
              <p class="tree-state">${stateLabel}</p>
              <h4>Root ${tree.root}</h4>
            </div>
            <span class="tree-meta">${meta}</span>
          </div>
          <pre class="tree-json">${JSON.stringify(tree.tree, null, 2)}</pre>
        </article>
      `;
    })
    .join("");
}

function showResults(payload) {
  insightsEmpty.classList.add("hidden");
  insightsContent.classList.remove("hidden");
  renderSummary(payload.summary);
  renderTreeCards(payload.hierarchies);
  renderIssues(payload);
  jsonOutput.textContent = JSON.stringify(payload, null, 2);
}

function showEmptyResults() {
  insightsEmpty.classList.remove("hidden");
  insightsContent.classList.add("hidden");
  renderSummary();
  jsonOutput.textContent = "";
}

async function submitHierarchy(event) {
  event.preventDefault();

  const data = parseInput(edgeInput.value);

  if (data.length === 0) {
    showEmptyResults();
    setStatus("error", "Add at least one edge before submitting.");
    return;
  }

  submitButton.disabled = true;
  setStatus("loading", "Validating and processing the submitted graph.");

  try {
    const response = await fetch("/bfhl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data })
    });
    const responseText = await response.text();
    let payload;

    try {
      payload = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error("The API returned HTML or invalid JSON. Check the deployed /bfhl route.");
    }

    if (!response.ok) {
      throw new Error(payload.error || "The API request failed.");
    }

    showResults(payload);
    setStatus("ready", "Analysis completed successfully.");
  } catch (error) {
    showEmptyResults();
    jsonOutput.textContent = JSON.stringify({ error: error.message }, null, 2);
    insightsEmpty.classList.add("hidden");
    insightsContent.classList.remove("hidden");
    treeGrid.innerHTML = `
      <article class="tree-card tree-card-empty">
        <h4>Request failed</h4>
        <p>${error.message}</p>
      </article>
    `;
    renderIssues({
      invalid_entries: [],
      duplicate_edges: []
    });
    setStatus("error", "The API could not be reached or returned an invalid response.");
  } finally {
    submitButton.disabled = false;
  }
}

function loadSample() {
  edgeInput.value = sampleEdges.join("\n");
  updateEdgeCount();
  setStatus("ready", "Sample input loaded. Submit to inspect trees and rejected edges.");
}

function clearInput() {
  edgeInput.value = "";
  updateEdgeCount();
  showEmptyResults();
  setStatus("ready", "Composer cleared.");
}

async function copyJson() {
  const text = jsonOutput.textContent.trim();

  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    const originalLabel = copyButton.textContent;
    copyButton.textContent = "Copied";
    window.setTimeout(() => {
      copyButton.textContent = originalLabel;
    }, 1500);
  } catch {
    setStatus("error", "Clipboard access was blocked by the browser.");
  }
}

form.addEventListener("submit", submitHierarchy);
sampleButton.addEventListener("click", loadSample);
clearButton.addEventListener("click", clearInput);
copyButton.addEventListener("click", copyJson);
edgeInput.addEventListener("input", updateEdgeCount);

updateEdgeCount();
showEmptyResults();
setStatus("ready", "Enter edges and submit a request to inspect the response.");
