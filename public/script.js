document.addEventListener("DOMContentLoaded", function() {
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

  let table = new Tabulator("#wbs-table", {
    data: [],
    headerVisible: false,
    layout: "fitColumns",
    height: "100%",
  });

  function generateColumns(rowObj) {
    let columns = [];
    for (let key in rowObj) {
      if (key === 'id') {
        columns.push({ title: "Row ID", field: key, visible: false });
      } else {
        columns.push({
          title: key,
          field: key,
          formatter: function(cell) {
            const cellData = cell.getValue();
            const colorMap = {
              platform: { topLabel: "Platform", topBarColor: "#FFBE00", backgroundColor: "#FFF0C2" },
              milestone: { topLabel: "Milestone", topBarColor: "#7CA948", backgroundColor: "#E8F3E8" },
              type: { topLabel: "Type", topBarColor: "#4DA6BD", backgroundColor: "#D6ECEE" },
              usecase: { topLabel: "Use Case/Process", topBarColor: "#F58220", backgroundColor: "#FFE3CF" },
              feature: { topLabel: "Feature", topBarColor: "#B399C3", backgroundColor: "#F2EDF6" },
              implementation: { topLabel: "Implementation", topBarColor: "#C1483C", backgroundColor: "#FDE8E8" },
            };
            if (!cellData) return "";
            const fallback = {
              topLabel: cellData.type || "",
              topBarColor: "#999",
              backgroundColor: "#f9f9f9",
            };
            const style = colorMap[cellData.type] || fallback;
            let mainText = "";
            if (cellData.label) {
              mainText += `<div style="font-weight:bold;">${cellData.label}</div>`;
            }
            if (cellData.contents && Array.isArray(cellData.contents)) {
              mainText += `<div>${cellData.contents.join("</div><div>")}</div>`;
            }
            return `
              <div style="text-align:center; font-family: sans-serif;">
                <div style="color:${style.topBarColor}; font-weight:bold; margin-bottom:20px;">
                  ${style.topLabel}
                </div>
                <div style="display:inline-block; position:relative;">
                  <div style="background-color:${style.topBarColor};
                              width:100%;
                              height:20px;
                              border-top-left-radius:5px;
                              border-top-right-radius:5px;
                              position:relative;">
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
                              min-width:150px;">
                    ${mainText}
                  </div>
                </div>
              </div>
            `;
          }
        });
      }
    }
    return columns;
  }

  function updatePreview() {
    const yamlText = codeMirrorEditor.getValue();
    try {
      const data = jsyaml.load(yamlText);
      if (data) {
        const transformedRows = transform(data);
        if (transformedRows.length > 0) {
          const columns = generateColumns(transformedRows[0]);
          table.setColumns(columns);
        }
        table.setData(transformedRows);
      } else {
        table.clearData();
        document.getElementById("wbs-table").innerHTML = "<p>No 'sprints' key found in YAML data.</p>";
      }
    } catch (e) {
      table.clearData();
      document.getElementById("wbs-table").innerHTML = "<p class='text-danger'>Invalid YAML: " + e.message + "</p>";
    }
  }

  // Update preview when CodeMirror content changes (with debounce for performance)
  codeMirrorEditor.on("change", function() {
    updatePreview();
  });

  let isDragging = false;
  divider.addEventListener("mousedown", function(e) {
    if (leftPane.classList.contains("collapsed")) return;
    isDragging = true;
    document.body.style.cursor = "col-resize";
  });

  document.addEventListener("mousemove", function(e) {
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

  document.addEventListener("mouseup", function() {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = "default";
    }
  });

  // Toggle collapse/expand with arrow icons using Font Awesome
  toggleBtn.addEventListener("click", function() {
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
