# Construction Estimating Tools

> ## ⚠️ Important Notice
> This project is currently under active development and is not yet considered production-ready. Features, layouts, and estimators are still evolving. Feedback, testing, and contributions are welcome as the tool suite continues to grow.

In construction, one of the most valuable assets is not lumber, steel, or fasteners, but **accurate planning**. A mistake on paper can cost thousands on the jobsite. Construction Estimating Tools was created with one goal in mind:  
**to make material estimation fast, visual, accurate, and accessible anywhere a browser exists.**

This project is designed as a growing collection of focused estimating utilities. Each tool solves a specific real-world problem without unnecessary overhead, installs, servers, or build systems. Everything runs directly in the browser. Open it and go to work.

---

## Precision Through Simplicity

Modern estimating software often comes with steep learning curves, licensing costs, and bloated workflows. Construction Estimating Tools takes the opposite approach:

- No accounts
- No tracking
- No subscriptions
- No cloud lock-in
- No framework dependencies

Each estimator is a **single-purpose, self-contained web app** built for speed, clarity, and print-ready output. The emphasis is on **real jobsite math**, not abstract modeling.

---

## 🧰 Current Tools

### Window & Door Trim Planner

The Window & Door Trim Planner is the first estimator in the suite and serves as the foundation for future tools.

It is a **full material and cut-sheet generator** for:

- Windows
- Interior doors
- Exterior doors

#### Key Capabilities

- Interior and exterior trim separation
- Craftsman-style angled heads with:
  - Adjustable overhang
  - Adjustable angle
- Automatic boxed return generation for windows
- Optimized board usage based on:
  - Available stock lengths
  - Saw kerf width
  - Waste allowance
- Board-by-board cut layouts
- Piece-level labeling with board assignments
- Fully printable:
  - Material summaries
  - Cut sheets
  - Visual diagrams

This tool is designed to work equally well in the **shop, truck, office, or jobsite** with nothing more than a web browser.

---

## 📁 Project Structure

Each estimator lives in its own self-contained folder under the main `/estimators` directory.

```

estimators/
index.html          # Main landing page
main.js             # Tool registry and navigation logic
main.css            # Home page styles

trim-planner/       # Window & Door Trim Planner
index.html
app.js
styles.css

````

New estimators can be added without affecting existing tools.

---

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/brandonhenness/Construction-Estimating-Tools.git
````

### Launch the Tool Suite

Simply open:

```
/estimators/index.html
```

in any modern web browser.

No server, no Node.js, no build steps required.

---

## 🛠 Adding New Estimators

New tools can be added with a simple three-file structure:

```
/estimators/my-new-tool/
  index.html
  app.js
  styles.css
```

Then register the estimator inside:

```
/estimators/main.js
```

Example:

```js
tools.push({
  name: "My New Estimator",
  tag: "Category",
  description: "Short description of what it does",
  path: "./my-new-tool/index.html",
  enabled: true
});
```

The tool becomes instantly available on the main landing page.

---

## 🎯 Design Philosophy

* Fully client-side
* No backend dependencies
* No frameworks
* No vendor lock-in
* Print-first output
* Real-world jobsite math
* Rapid iteration
* Estimators built from real construction workflows

This project exists to **speed up planning**, **reduce mistakes**, and **eliminate guesswork**.

---

## License

Construction Estimating Tools is licensed under the [GNU General Public License v3.0](LICENSE).

---

Developed with ❤️ by [Brandon Henness](https://github.com/brandonhenness).