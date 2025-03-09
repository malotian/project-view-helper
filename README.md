# Project View Helper

**Project View Helper** is a Node.js application that converts YAML data into interactive, visual representations resembling Visio diagrams. The app features an intuitive, web-based interface that combines a syntax-highlighted YAML editor with real-time visualization.

---

## Features

- **Interactive YAML Editor:** Utilizes CodeMirror to provide syntax highlighting, auto-indentation, and line numbering for a seamless editing experience.
- **Real-Time Visualization:** Immediately transforms YAML input into a clear and dynamic visual table view.
- **Dockerized:** Conveniently deploy and run the application using Docker or Docker Compose.
- **Built-in Test Data:** Includes a sample YAML file (`test/data.yaml`) for quick experimentation and validation.

---

## Getting Started

### Prerequisites

Ensure [Docker](https://www.docker.com/get-started) is installed on your machine.

### Running the Application

A Docker image is pre-built for easy setup. Run the container using:

```bash
docker run -d -p 3000:3000 malotian/project-view-helper:latest
```

---

## How to Use

1. **Open Your Browser:** Navigate to [http://localhost:3000/](http://localhost:3000/).
2. **Load Sample Data:** Click to load the provided sample file located at `test/data.yaml`.
3. **Or Enter Custom YAML:** Alternatively, paste your own YAML data into the editor.
4. **Visualize:** Watch the transformation into a visual table occur instantly!

### Sample YAML

Here's an example of YAML data you can visualize:

```yaml
sprints:
  - items:
      - label: "Task 1"
        type: "task"
        contents:
          - "Do this"
          - "And that"
      - label: "Milestone 1"
        type: "milestone"
        contents:
          - "Complete feature X"
  - items:
      - label: "Task A"
        type: "task"
        contents:
          - "Prepare report"
      - label: "Task B"
        type: "task"
        contents:
          - "Review code"
      - label: "Implementation A"
        type: "implementation"
        contents:
          - "Deploy update"
```

Enjoy visualizing your YAML workflows effortlessly!
