const tools = [
    {
        name: "Window & Door Trim Planner",
        tag: "Carpentry",
        description:
            "Calculates interior and exterior trim, boxed returns, and optimized cut layouts from stock board lengths. Includes printable cut sheets and diagrams.",
        path: "./trim-planner/index.html",
        enabled: true
    },
    {
        name: "Future Tool Slot",
        tag: "Coming Soon",
        description:
            "Add another estimator here later (materials, flooring, siding, etc.).",
        path: "#",
        enabled: false
    }
];

function createToolCard(tool) {
    const article = document.createElement("article");
    article.className = "card";

    const title = document.createElement("h2");
    title.textContent = tool.name;

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = tool.tag;

    const desc = document.createElement("p");
    desc.textContent = tool.description;

    const footer = document.createElement("div");
    footer.className = "card-footer";

    let button;
    if (tool.enabled) {
        button = document.createElement("a");
        button.href = tool.path;
    } else {
        button = document.createElement("button");
        button.disabled = true;
    }

    button.className = "btn";
    button.textContent = tool.enabled ? "Open Tool" : "Not Available";

    footer.appendChild(button);

    article.appendChild(title);
    article.appendChild(tag);
    article.appendChild(desc);
    article.appendChild(footer);

    return article;
}

function renderToolGrid() {
    const grid = document.getElementById("tool-grid");
    grid.innerHTML = "";

    tools.forEach(tool => {
        grid.appendChild(createToolCard(tool));
    });
}

renderToolGrid();
