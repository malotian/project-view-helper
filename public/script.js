document.addEventListener("DOMContentLoaded", function () {
    const yamlInput = document.getElementById("yamlInput");

    // --- Transformation Function (as provided) ---
    // Updated transform function remains unchanged.
    function transform(sprints) {
        // Process each sprint to separate effective items and a reserved last item.
        const processed = sprints.map(sprint => {
            const items = sprint.items;
            const totalItems = items.length;
            let reserved = null;
            let effectiveCount = totalItems;

            // If the last item is of a reserved type, separate it.
            if (totalItems > 0) {
                const lastItem = items[totalItems - 1];
                if (lastItem && (lastItem.type === "milestone" || lastItem.type === "implementation")) {
                    reserved = lastItem;
                    effectiveCount = totalItems - 1; // Reserve the last item.
                }
            }
            return { effectiveCount, reserved, items };
        });

        // Determine the maximum number of main rows (based on effective items).
        const maxRows = Math.max(...processed.map(p => p.effectiveCount));
        const rows = [];

        // Build main rows by bottom-aligning each sprint's effective items.
        for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
            const row = { id: rowIndex + 1 };

            processed.forEach((p, sprintIndex) => {
                // Calculate how many top cells should be empty for bottom alignment.
                const topPadding = maxRows - p.effectiveCount;
                let cell = null;
                // Only assign a cell if we've passed the padding rows.
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

        // Build the reserved row with the separated last items.
        const reservedRow = { id: maxRows + 1 };
        processed.forEach((p, sprintIndex) => {
            reservedRow['sprint-' + (sprintIndex + 1)] = p.reserved;
        });
        rows.push(reservedRow);

        return rows;
    }
    // --- End Transformation Function ---

    // Global Tabulator table instance
    let table = new Tabulator("#wbs-table", {
        data: [],
        headerVisible: false,
    });

    // Helper function to generate columns dynamically based on keys of the first row
    function generateColumns(rowObj) {
        let columns = [];
        for (let key in rowObj) {
            if (key === 'id') {
                // Optionally hide the id column
                columns.push({ title: "Row ID", field: key, visible: false });
            } else {
                columns.push({
                    title: key,
                    field: key,
                    formatter: function (cell) {
                        const cellData = cell.getValue();
                        // Define styling for each type
                        const colorMap = {
                            platform: {
                                topLabel: "Platform",
                                topBarColor: "#FFBE00",
                                backgroundColor: "#FFF0C2",
                            },
                            milestone: {
                                topLabel: "Milestone",
                                topBarColor: "#7CA948",
                                backgroundColor: "#E8F3E8",
                            },
                            type: {
                                topLabel: "Type",
                                topBarColor: "#4DA6BD",
                                backgroundColor: "#D6ECEE",
                            },
                            usecase: {
                                topLabel: "Use Case/Process",
                                topBarColor: "#F58220",
                                backgroundColor: "#FFE3CF",
                            },
                            feature: {
                                topLabel: "Feature",
                                topBarColor: "#B399C3",
                                backgroundColor: "#F2EDF6",
                            },
                            implementation: {
                                topLabel: "Implementation",
                                topBarColor: "#C1483C",
                                backgroundColor: "#FDE8E8",
                            },
                        };

                        if (!cellData) return "";

                        // Fallback style if type is not recognized
                        const fallback = {
                            topLabel: cellData.type || "",
                            topBarColor: "#999",
                            backgroundColor: "#f9f9f9",
                        };

                        const style = colorMap[cellData.type] || fallback;

                        // Build main text from label and contents
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

    // Update preview: parse YAML, transform data, and update Tabulator table
    function updatePreview() {
        const yamlText = yamlInput.value;
        try {
            //console.log(yamlText);
            const data = jsyaml.load(yamlText);
            if (data && data) {
                const transformedRows = transform(data);
                // Dynamically generate columns if data is available
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
            document.getElementById("wbs-table").innerHTML = "<p style='color: red;'>Invalid YAML: " + e.message + "</p>";
        }
    }

    // Listen for changes in the YAML textarea
    yamlInput.addEventListener("input", updatePreview);

    // --- Draggable Divider Functionality ---
    const divider = document.getElementById("divider");
    const leftPane = document.getElementById("leftPane");
    const rightPane = document.getElementById("rightPane");

    let isDragging = false;

    divider.addEventListener("mousedown", function () {
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
        rightPane.style.width = (100 - leftWidthPercent - 0.5) + "%";
    });

    document.addEventListener("mouseup", function () {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = "default";
        }
    });
});
