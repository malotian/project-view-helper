document.addEventListener("DOMContentLoaded", function () {
  // Initialize CodeMirror on the textarea for YAML editing
  const yamlTextarea = document.getElementById("yamlInput");
  const codeMirrorEditor = CodeMirror.fromTextArea(yamlTextarea, {
    mode: "text/x-yaml",
    theme: "eclipse",
    lineNumbers: true,
    lineWrapping: true,
  });

  const toggleBtn = document.getElementById("toggleBtn");
  const leftPane = document.getElementById("leftPane");
  const rightPane = document.getElementById("rightPane");
  const divider = document.getElementById("divider");

  // --- Transformation Function (as provided) ---
  function transform(sprints) {
    const processed = sprints.map(sprint => {
      const items = sprint.items;
      const totalItems = items.length;
      let reserved = null;
      let effectiveCount = totalItems;
      if (totalItems > 0) {
        const lastItem = items[totalItems - 1];
        if (lastItem && (lastItem.type === "milestone" || lastItem.type === "implementation")) {
          reserved = lastItem;
          effectiveCount = totalItems - 1;
        }
      }
      return { effectiveCount, reserved, items };
    });

    const maxRows = Math.max(...processed.map(p => p.effectiveCount));
    const rows = [];
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
      const row = { id: rowIndex + 1 };
      processed.forEach((p, sprintIndex) => {
        const topPadding = maxRows - p.effectiveCount;
        let cell = null;
        if (rowIndex >= topPadding) {
          const itemIndex = rowIndex - topPadding;
          if (itemIndex < p.effectiveCount) {
            cell = p.items[itemIndex];
          }
        }
        row['sprint-' + (sprintIndex + 1)] = cell;
      });
      rows.push(row);
    }
    const reservedRow = { id: maxRows + 1 };
    processed.forEach((p, sprintIndex) => {
      reservedRow['sprint-' + (sprintIndex + 1)] = p.reserved;
    });
    rows.push(reservedRow);
    return rows;
  }
  // --- End Transformation Function ---

  let table1 = new Tabulator("#wbs1-table", {
    data: [],
    headerVisible: false,
    layout: "fitColumns",
  });

  let table2 = new Tabulator("#wbs2-table", {
    data: [],
    headerVisible: false,
    layout: "fitColumns",
  })

  function formatCellContent(cellData) {
    const colorMap = {
      platform: { topLabel: "Platform", topBarColor: "#FFBE00", backgroundColor: "#FFF0C2" },
      milestone: { topLabel: "Milestone", topBarColor: "#7CA948", backgroundColor: "#E8F3E8" },
      type: { topLabel: "Type", topBarColor: "#4DA6BD", backgroundColor: "#D6ECEE" },
      usecase: { topLabel: "Use Case/Process", topBarColor: "#F58220", backgroundColor: "#FFE3CF" },
      feature: { topLabel: "Feature", topBarColor: "#B399C3", backgroundColor: "#F2EDF6" },
      implementation: { topLabel: "Implementation", topBarColor: "#C1483C", backgroundColor: "#FDE8E8" },
    };

    const fallback = {
      topLabel: cellData.type || "",
      topBarColor: "#999",
      backgroundColor: "#f9f9f9",
    };

    const style = colorMap[cellData.type] || fallback;

    // Mapping flag values to Font Awesome icon classes
    const flagIconMap = {
      in_progress: "fa-gear",
      completed: "fa-check",
      blocked_by_vendor: "fa-xmark",
      waiting_on_customer: "fa-stopwatch",
      scope_added: "fa-plus",
      scope_reduced: "fa-minus",
      completed_alternative: "fa-circle-check",
      verified: "fa-square-check",
      goal_achieved: "fa-bullseye",
    };

    let leftIconHTML = "";
    let rightIconHTML = "";

    // Arrays to hold flags for left (plus/minus) and right (all others)
    let leftArray = [];
    let rightArray = [];

    // Ensure cellData.flag exists and is an array
    if (cellData.flag && Array.isArray(cellData.flag)) {
      // Loop through the flags to partition them
      cellData.flag.forEach(flag => {
        if (flag === "scope_added" || flag === "scope_reduced") {
          leftArray.push(flag);
        } else {
          rightArray.push(flag);
        }
      });

      // Generate the left icon from the first element in leftArray (if exists)
      if (leftArray.length > 0) {
        const leftIconClass = flagIconMap[leftArray[0]] || "";
        if (leftIconClass) {
          leftIconHTML = `
        <span class="fa-stack"
              style="position: absolute;
                     top: 50%;
                     left: 8px;
                     transform: translate(0, -50%);
                     font-size: 1.5em;
                     z-index: 10;">
          <i class="fa-solid ${leftIconClass} fa-stack-2x"></i>
        </span>`;
        }
      }

      // Generate the right icon from the first element in rightArray (if exists)
      if (rightArray.length > 0) {
        const rightIconClass = flagIconMap[rightArray[0]] || "";
        if (rightIconClass) {
          rightIconHTML = `
        <span class="fa-stack"
              style="position: absolute;
                     top: 50%;
                     right: 8px;
                     transform: translate(0, -50%);
                     font-size: 1.5em;
                     z-index: 10;">
          <i class="fa-solid ${rightIconClass} fa-stack-2x"></i>
        </span>`;
        }
      }
    }


    let mainText = "";
    if (cellData.label) {
      mainText += `<div style="font-weight:bold;">${cellData.label}</div>`;
    }
    if (cellData.contents && Array.isArray(cellData.contents)) {
      mainText += `<div>${cellData.contents.join("</div><div>")}</div>`;
    }

    return `
      <div style="position: relative; text-align:center; font-family: sans-serif; width: 100%; height: 100%;">
        <div style="color:${style.topBarColor}; font-weight:bold; margin-bottom:20px;">
          ${style.topLabel}
        </div>
        <div style="display:block; position:relative; width:100%;">
          <!-- Dark header bar with overflow: visible to avoid icon clipping -->
          <div style="background-color:${style.topBarColor};
                      width:100%;
                      height:24px; /* Increased height to accommodate icons */
                      border-top-left-radius:5px;
                      border-top-right-radius:5px;
                      position:relative;
                      overflow: visible;">
            ${leftIconHTML}
            ${rightIconHTML}
            <div style="width:0;
                        height:0;
                        border-left:10px solid transparent;
                        border-right:10px solid transparent;
                        border-bottom:10px solid ${style.topBarColor};
                        position:absolute;
                        top:-10px;
                        left:calc(50% - 10px);">
            </div>
          </div>
          <div style="background-color:${style.backgroundColor};
                      padding:10px;
                      border:1px solid ${style.topBarColor};
                      border-bottom-left-radius:5px;
                      border-bottom-right-radius:5px;
                      width:100%;
                      box-sizing: border-box;">
            ${mainText}
          </div>
        </div>
      </div>
    `;
  }



  function generateColumns(rowObj) {
    let columns = [];
    for (let key in rowObj) {
      if (key === 'id') {
        columns.push({ title: "Row ID", field: key, visible: false });
      } else {
        columns.push({
          title: key,
          field: key,
          formatter: function (cell) {
            const cellData = cell.getValue();
            if (!cellData) return "";
            return formatCellContent(cellData);
          },
          // Using Tabulator's tooltip callback to return a custom HTML tooltip
          tooltip: function (e, cell, onRendered) {
            const cellData = cell.getValue();
            if (!cellData) return "";
            // Wrap the formatted content in a container that scales the font size to 150%
            return `<div style="font-size:300%; width:100%;">${formatCellContent(cellData)}</div>`;
          }
        });
      }
    }
    return columns;
  }


  function updatePreview() {
    const yamlText = codeMirrorEditor.getValue();
    // Get error container element
    const errorElem = document.getElementById("errorMessage");
    try {
      const data = jsyaml.load(yamlText);
      if (data) {
        const transformedRows = transform(data);
        if (transformedRows.length > 0) {
          const columns = generateColumns(transformedRows[0]);
          table1.setColumns(columns);
          table2.setColumns(columns);
        }

        const dataForTable1 = transformedRows.slice(0, -1);
        // Only the last row for table2 (wrapped in an array):
        const dataForTable2 = [transformedRows[transformedRows.length - 1]];

        table1.setData(dataForTable1);
        table2.setData(dataForTable2);
        // Clear any previous error messages
        if (errorElem) errorElem.innerHTML = "";
      } else {
        table1.clearData();
        table2.clearData();
        if (errorElem) errorElem.textContent = "No 'sprint' found in YAML data.";
      }
    } catch (e) {
      table1.clearData();
      table2.clearData();
      if (errorElem) errorElem.innerHTML = "<p class='text-danger'>Invalid YAML: " + e.message + "</p>";
    }
  }

  // Update preview when CodeMirror content changes (with debounce for performance)
  codeMirrorEditor.on("change", function () {
    updatePreview();
  });

  // Load sample YAML from data.yaml and set it in the CodeMirror editor
  fetch("test/data.yaml")
    .then(response => response.text())
    .then(text => {
      codeMirrorEditor.setValue(text);
      updatePreview();
    })
    .catch(error => console.error("Error loading sample YAML:", error));

  let isDragging = false;
  divider.addEventListener("mousedown", function (e) {
    if (leftPane.classList.contains("collapsed")) return;
    isDragging = true;
    document.body.style.cursor = "col-resize";
  });

  document.addEventListener("mousemove", function (e) {
    if (!isDragging) return;
    let containerOffsetLeft = document.getElementById("container").offsetLeft;
    let pointerRelativeXpos = e.clientX - containerOffsetLeft;
    let containerWidth = document.getElementById("container").clientWidth;
    let leftWidthPercent = (pointerRelativeXpos / containerWidth) * 100;
    if (leftWidthPercent < 10) leftWidthPercent = 10;
    if (leftWidthPercent > 90) leftWidthPercent = 90;
    leftPane.style.width = leftWidthPercent + "%";
    rightPane.style.width = (100 - leftWidthPercent - 4) + "%"; // account for divider width
  });

  document.addEventListener("mouseup", function () {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = "default";
    }
  });

  // Toggle collapse/expand with arrow icons using Font Awesome
  toggleBtn.addEventListener("click", function () {
    if (leftPane.classList.contains("collapsed")) {
      // Expand left pane
      leftPane.classList.remove("collapsed");
      leftPane.style.width = "50%";
      rightPane.style.width = "50%";
      toggleBtn.innerHTML = '<i class="fas fa-angle-left"></i>';
      divider.style.cursor = "col-resize";
    } else {
      // Collapse left pane
      leftPane.classList.add("collapsed");
      leftPane.style.width = "0";
      rightPane.style.width = "calc(100% - 40px)"; // full width minus divider
      toggleBtn.innerHTML = '<i class="fas fa-angle-right"></i>';
      divider.style.cursor = "pointer";
    }
  });
});
