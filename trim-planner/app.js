let overhangLocked = false;

function createOpeningRow(defaultName) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
    <td><input type="text" value="${defaultName}" class="op-name" /></td>
    <td>
      <select class="op-type">
        <option value="window" selected>Window</option>
        <option value="interiorDoor">Interior Door</option>
        <option value="exteriorDoor">Exterior Door</option>
      </select>
    </td>
    <td><input type="number" step="0.1" class="op-width" /></td>
    <td><input type="number" step="0.1" class="op-height" /></td>
    <td>
      <select class="op-wall">
        <option value="2x4">2x4</option>
        <option value="2x6">2x6</option>
      </select>
    </td>
    <td style="text-align:center;">
      <input type="checkbox" class="op-interior" checked />
    </td>
    <td style="text-align:center;">
      <input type="checkbox" class="op-exterior" checked />
    </td>
    <td style="text-align:center;">
      <button type="button" class="btn-danger btn-remove">✕</button>
    </td>
  `;

    const typeSelect = tr.querySelector(".op-type");
    const interiorCheckbox = tr.querySelector(".op-interior");
    const exteriorCheckbox = tr.querySelector(".op-exterior");

    function updateForType() {
        const type = typeSelect.value;

        if (type === "window") {
            interiorCheckbox.checked = true;
            interiorCheckbox.disabled = false;
            exteriorCheckbox.checked = true;
            exteriorCheckbox.disabled = false;
        } else if (type === "interiorDoor") {
            interiorCheckbox.checked = true;
            interiorCheckbox.disabled = false;
            exteriorCheckbox.checked = false;
            exteriorCheckbox.disabled = true;
        } else if (type === "exteriorDoor") {
            interiorCheckbox.checked = true;
            interiorCheckbox.disabled = false;
            exteriorCheckbox.checked = false;
            exteriorCheckbox.disabled = false;
        }
    }

    typeSelect.addEventListener("change", updateForType);
    updateForType();

    tr.querySelector(".btn-remove").addEventListener("click", () => {
        tr.remove();
    });

    return tr;
}

function parseBoardLengths(str) {
    return str
        .split(",")
        .map(s => parseFloat(s.trim()))
        .filter(v => !isNaN(v) && v > 0)
        .sort((a, b) => a - b)
        .map(ft => ft * 12);
}

function collectSettings() {
    const interiorTrimWidth = parseFloat(document.getElementById("interiorTrimWidth").value) || 0;
    const exteriorTrimWidth = parseFloat(document.getElementById("exteriorTrimWidth").value) || 0;
    const topOverhang = parseFloat(document.getElementById("topOverhang").value) || 0;
    const bottomOverhang = parseFloat(document.getElementById("bottomOverhang").value) || 0;
    const headAngle = parseFloat(document.getElementById("headAngle").value) || 0;
    const trimThickness = parseFloat(document.getElementById("trimThickness").value) || 0.75;
    const wastePercent = parseFloat(document.getElementById("wastePercent").value) || 0;
    const kerfWidth = parseFloat(document.getElementById("kerfWidth").value) || 0;

    const interiorBoardLengthsStr = document.getElementById("interiorBoardLengths").value;
    const exteriorBoardLengthsStr = document.getElementById("exteriorBoardLengths").value;
    const exteriorHardie = document.getElementById("exteriorHardie").checked;

    const interiorBoardLengthsIn = parseBoardLengths(interiorBoardLengthsStr);
    let exteriorBoardLengthsIn = [];

    if (exteriorHardie) {
        exteriorBoardLengthsIn = [12 * 12];
    } else {
        exteriorBoardLengthsIn = parseBoardLengths(exteriorBoardLengthsStr);
    }

    return {
        interiorTrimWidthIn: interiorTrimWidth,
        exteriorTrimWidthIn: exteriorTrimWidth,
        topOverhangIn: topOverhang,
        bottomOverhangIn: bottomOverhang,
        headAngleDeg: headAngle,
        returnThicknessIn: trimThickness,
        extraPercent: wastePercent,
        kerfIn: kerfWidth,
        boardLengthsInteriorIn: interiorBoardLengthsIn,
        boardLengthsExteriorIn: exteriorBoardLengthsIn,
        exteriorHardie
    };
}

function collectOpenings() {
    const rows = Array.from(document.querySelectorAll("#opening-rows tr"));
    const openings = [];

    for (const [idx, row] of rows.entries()) {
        const name = row.querySelector(".op-name").value || `Opening ${idx + 1}`;
        const type = row.querySelector(".op-type").value;
        const widthIn = parseFloat(row.querySelector(".op-width").value);
        const heightIn = parseFloat(row.querySelector(".op-height").value);
        const wall = row.querySelector(".op-wall").value;
        const interior = row.querySelector(".op-interior").checked;
        const exterior = row.querySelector(".op-exterior").checked;

        if (!widthIn || !heightIn) {
            continue;
        }

        openings.push({
            id: idx,
            name,
            openingType: type,
            widthIn,
            heightIn,
            wallType: wall,
            useInterior: interior,
            useExterior: exterior
        });
    }

    return openings;
}

function getWallDepthIn(wallType) {
    return wallType === "2x6" ? 5.5 : 3.5;
}

// ---------- Trim piece calculations ----------
function getInteriorPiecesForOpening(opening, settings) {
    const pieces = [];
    const W = opening.widthIn;
    const H = opening.heightIn;
    const tw = settings.interiorTrimWidthIn;
    const ohTop = settings.topOverhangIn;
    const ohBottom = settings.bottomOverhangIn;
    const th = settings.returnThicknessIn;

    const isWindow = opening.openingType === "window";
    const isInteriorDoor = opening.openingType === "interiorDoor";
    const isExteriorDoor = opening.openingType === "exteriorDoor";
    const isDoor = isInteriorDoor || isExteriorDoor;

    const angleRad = (settings.headAngleDeg * Math.PI) / 180;
    const extraOverhangPerSideIn = tw * Math.tan(angleRad);

    const facePieces = [];

    // Side casings
    facePieces.push({
        openingId: opening.id,
        openingName: opening.name,
        type: "interior",
        role: "side casing left",
        lengthIn: H
    });
    facePieces.push({
        openingId: opening.id,
        openingName: opening.name,
        type: "interior",
        role: "side casing right",
        lengthIn: H
    });

    // Head casing
    const headBottomSpan = W + 2 * tw + 2 * ohTop;
    const headCutLen = headBottomSpan + 2 * extraOverhangPerSideIn;
    facePieces.push({
        openingId: opening.id,
        openingName: opening.name,
        type: "interior",
        role: "head casing",
        lengthIn: headCutLen,
        bottomSpanIn: headBottomSpan
    });

    // Bottom casing: windows only
    if (isWindow) {
        const bottomLen = W + 2 * tw + 2 * ohBottom;
        facePieces.push({
            openingId: opening.id,
            openingName: opening.name,
            type: "interior",
            role: "bottom casing",
            lengthIn: bottomLen
        });
    }

    // Returns: windows only
    if (isWindow) {
        facePieces.push({
            openingId: opening.id,
            openingName: opening.name,
            type: "interior",
            role: "bottom return",
            lengthIn: W
        });

        facePieces.push({
            openingId: opening.id,
            openingName: opening.name,
            type: "interior",
            role: "top return",
            lengthIn: W
        });

        const sideReturnLen = Math.max(0, H - 2 * th);
        facePieces.push({
            openingId: opening.id,
            openingName: opening.name,
            type: "interior",
            role: "side return left",
            lengthIn: sideReturnLen
        });
        facePieces.push({
            openingId: opening.id,
            openingName: opening.name,
            type: "interior",
            role: "side return right",
            lengthIn: sideReturnLen
        });
    }

    if (isInteriorDoor) {
        const secondSide = facePieces.map(p => ({
            ...p,
            role: p.role + " (2nd side)"
        }));
        pieces.push(...facePieces, ...secondSide);
    } else {
        pieces.push(...facePieces);
    }

    return pieces;
}

function getExteriorPiecesForOpening(opening, settings) {
    const pieces = [];
    const W = opening.widthIn;
    const H = opening.heightIn;
    const tw = settings.exteriorTrimWidthIn;
    const isWindow = opening.openingType === "window";
    const isDoor = opening.openingType === "interiorDoor" || opening.openingType === "exteriorDoor";

    // Head
    pieces.push({
        openingId: opening.id,
        openingName: opening.name,
        type: "exterior",
        role: "head",
        lengthIn: W + 2 * tw
    });

    // Bottom for windows only
    if (isWindow) {
        pieces.push({
            openingId: opening.id,
            openingName: opening.name,
            type: "exterior",
            role: "bottom",
            lengthIn: W
        });
    }

    const sideLen = isWindow ? H + tw : H;

    pieces.push({
        openingId: opening.id,
        openingName: opening.name,
        type: "exterior",
        role: "side left",
        lengthIn: sideLen
    });
    pieces.push({
        openingId: opening.id,
        openingName: opening.name,
        type: "exterior",
        role: "side right",
        lengthIn: sideLen
    });

    return pieces;
}

// ---------- Board optimization with kerf ----------
function optimizeBoards(pieces, boardLengthsIn, kerfIn) {
    const boards = [];
    if (!pieces.length || !boardLengthsIn.length) return boards;

    const remaining = [...pieces].sort((a, b) => b.lengthIn - a.lengthIn);
    boardLengthsIn = [...boardLengthsIn].sort((a, b) => a - b);

    while (remaining.length) {
        let best = null;

        for (const L of boardLengthsIn) {
            let rem = L;
            const usedPieces = [];

            for (const p of remaining) {
                if (!usedPieces.length) {
                    if (p.lengthIn <= rem) {
                        usedPieces.push(p);
                        rem -= p.lengthIn;
                    }
                } else {
                    if (p.lengthIn + kerfIn <= rem) {
                        usedPieces.push(p);
                        rem -= p.lengthIn + kerfIn;
                    }
                }
            }

            if (!usedPieces.length) continue;

            const waste = rem;
            if (
                !best ||
                waste < best.waste ||
                (waste === best.waste && L < best.length)
            ) {
                best = { length: L, waste, usedPieces };
            }
        }

        if (!best) break;

        const board = {
            sizeIn: best.length,
            cuts: best.usedPieces.map(p => ({
                piece: p,
                lengthIn: p.lengthIn
            }))
        };
        boards.push(board);

        for (const up of best.usedPieces) {
            const idx = remaining.indexOf(up);
            if (idx >= 0) remaining.splice(idx, 1);
        }
    }

    for (const p of remaining) {
        const suitable = boardLengthsIn.filter(L => L >= p.lengthIn);
        const size =
            suitable.length > 0
                ? Math.min(...suitable)
                : boardLengthsIn[boardLengthsIn.length - 1];
        boards.push({
            sizeIn: size,
            cuts: [{ piece: p, lengthIn: p.lengthIn }]
        });
    }

    return boards;
}

function summarizeBoardsWithExtra(boards, requiredTotalIn, extraPercent) {
    const summary = {};
    let totalPurchasedIn = 0;

    for (const b of boards) {
        totalPurchasedIn += b.sizeIn;
        const key = b.sizeIn;
        if (!summary[key]) {
            summary[key] = { sizeIn: b.sizeIn, count: 0 };
        }
        summary[key].count += 1;
    }

    const targetIn = requiredTotalIn * (1 + extraPercent / 100);

    if (boards.length) {
        const lengths = boards.map(b => b.sizeIn);
        const maxLen = Math.max(...lengths);
        while (totalPurchasedIn < targetIn) {
            totalPurchasedIn += maxLen;
            if (!summary[maxLen]) {
                summary[maxLen] = { sizeIn: maxLen, count: 0 };
            }
            summary[maxLen].count += 1;
        }
    }

    const totalWasteIn = totalPurchasedIn - requiredTotalIn;
    const wastePct = requiredTotalIn
        ? (totalWasteIn / requiredTotalIn) * 100
        : 0;

    return {
        summaryBySize: Object.values(summary).sort((a, b) => a.sizeIn - b.sizeIn),
        totalPurchasedIn,
        totalWasteIn,
        wastePct
    };
}

// ---------- SVG helpers ----------
function addText(svg, x, y, text, opts = {}) {
    const xmlns = "http://www.w3.org/2000/svg";
    const t = document.createElementNS(xmlns, "text");
    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.setAttribute("font-size", opts.fontSize || "8");
    t.setAttribute("fill", opts.fill || "#111");
    if (opts.anchor) t.setAttribute("text-anchor", opts.anchor);
    if (opts.rotate) t.setAttribute("transform", `rotate(${opts.rotate} ${x} ${y})`);
    t.textContent = text;
    svg.appendChild(t);
    return t;
}

function addDimLine(svg, x1, y1, x2, y2, label, opts = {}) {
    const xmlns = "http://www.w3.org/2000/svg";
    const line = document.createElementNS(xmlns, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", opts.stroke || "#000");
    line.setAttribute("stroke-width", opts.strokeWidth || "0.8");
    svg.appendChild(line);

    function tick(px, py, dx, dy) {
        const t = document.createElementNS(xmlns, "line");
        t.setAttribute("x1", px - dx);
        t.setAttribute("y1", py - dy);
        t.setAttribute("x2", px + dx);
        t.setAttribute("y2", py + dy);
        t.setAttribute("stroke", opts.stroke || "#000");
        t.setAttribute("stroke-width", opts.strokeWidth || "0.8");
        svg.appendChild(t);
    }

    if (x1 === x2) {
        tick(x1, y1, 4, 0);
        tick(x2, y2, 4, 0);
    } else if (y1 === y2) {
        tick(x1, y1, 0, 4);
        tick(x2, y2, 0, 4);
    }

    if (label) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - (opts.labelOffset ?? 2);
        addText(svg, mx, my, label, { anchor: "middle", fontSize: opts.fontSize || "8" });
    }
}

function addVerticalLabel(svg, dimX, midY, label) {
    const x = dimX - 2;
    addText(svg, x, midY, label, { fontSize: "7", anchor: "end" });
}

function getDiagramLayout(outerWidthIn, outerHeightIn) {
    const viewSize = 300;
    const marginLeft = 60;
    const marginRight = 20;
    const marginTop = 40;
    const marginBottom = 20;

    const innerWidthPx = viewSize - marginLeft - marginRight;
    const innerHeightPx = viewSize - marginTop - marginBottom;

    const maxSizeX = innerWidthPx;
    const maxSizeY = innerHeightPx;

    const scale = Math.min(
        maxSizeX / outerWidthIn,
        maxSizeY / outerHeightIn
    );

    const outerWpx = outerWidthIn * scale;
    const outerHpx = outerHeightIn * scale;

    const outerX = marginLeft + (innerWidthPx - outerWpx) / 2;
    const outerY = marginTop + (innerHeightPx - outerHpx) / 2;

    return {
        viewSize,
        marginLeft,
        marginRight,
        marginTop,
        marginBottom,
        scale,
        outerX,
        outerY,
        outerWpx,
        outerHpx
    };
}

// ---------- Interior trim SVG ----------
function createInteriorTrimSVG(opening, settings) {
    const W = opening.widthIn;
    const H = opening.heightIn;
    const tw = settings.interiorTrimWidthIn;
    const ohTop = settings.topOverhangIn;
    const ohBottom = settings.bottomOverhangIn;
    const angleDeg = settings.headAngleDeg;
    const isWindow = opening.openingType === "window";

    const angleRad = (angleDeg * Math.PI) / 180;
    const extraOverhangPerSideIn = tw * Math.tan(angleRad);

    const headBottomSpanIn = W + 2 * tw + 2 * ohTop;
    const headCutLenIn = headBottomSpanIn + 2 * extraOverhangPerSideIn;

    const maxOverhang = Math.max(ohTop + extraOverhangPerSideIn, isWindow ? ohBottom : 0);

    const outerWidthIn = W + 2 * tw + 2 * maxOverhang;
    const outerHeightIn = H + 2 * tw;

    const layout = getDiagramLayout(outerWidthIn, outerHeightIn);
    const {
        viewSize,
        marginLeft,
        marginTop,
        scale,
        outerX,
        outerY,
        outerWpx,
        outerHpx
    } = layout;

    const windowWpx = W * scale;
    const windowHpx = H * scale;
    const trimWpx = tw * scale;

    const xmlns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(xmlns, "svg");
    svg.setAttribute("viewBox", `0 0 ${viewSize} ${viewSize}`);
    svg.setAttribute("width", viewSize);
    svg.setAttribute("height", viewSize);

    const windowX = outerX + trimWpx + (maxOverhang - (ohTop + extraOverhangPerSideIn)) * scale;
    const windowY = outerY + trimWpx;

    const windowRect = document.createElementNS(xmlns, "rect");
    windowRect.setAttribute("x", windowX);
    windowRect.setAttribute("y", windowY);
    windowRect.setAttribute("width", windowWpx);
    windowRect.setAttribute("height", windowHpx);
    windowRect.setAttribute("fill", "#e5f2ff");
    windowRect.setAttribute("stroke", "#1e3a8a");
    windowRect.setAttribute("stroke-width", "1");
    svg.appendChild(windowRect);

    const leftTrim = document.createElementNS(xmlns, "rect");
    leftTrim.setAttribute("x", windowX - trimWpx);
    leftTrim.setAttribute("y", windowY);
    leftTrim.setAttribute("width", trimWpx);
    leftTrim.setAttribute("height", windowHpx);
    leftTrim.setAttribute("fill", "#f8fafc");
    leftTrim.setAttribute("stroke", "#0f172a");
    leftTrim.setAttribute("stroke-width", "0.8");
    svg.appendChild(leftTrim);

    const rightTrim = document.createElementNS(xmlns, "rect");
    rightTrim.setAttribute("x", windowX + windowWpx);
    rightTrim.setAttribute("y", windowY);
    rightTrim.setAttribute("width", trimWpx);
    rightTrim.setAttribute("height", windowHpx);
    rightTrim.setAttribute("fill", "#f8fafc");
    rightTrim.setAttribute("stroke", "#0f172a");
    rightTrim.setAttribute("stroke-width", "0.8");
    svg.appendChild(rightTrim);

    const headHpx = trimWpx;
    const bottomOverhangPx = ohTop * scale;
    const bevelPx = extraOverhangPerSideIn * scale;

    const bottomLeftX = windowX - trimWpx - bottomOverhangPx;
    const bottomRightX = bottomLeftX + headBottomSpanIn * scale;
    const headY = windowY - headHpx;

    const topLeftX = bottomLeftX - bevelPx;
    const topRightX = bottomRightX + bevelPx;

    const topHead = document.createElementNS(xmlns, "polygon");
    const points = [
        [topLeftX, headY],
        [topRightX, headY],
        [bottomRightX, headY + headHpx],
        [bottomLeftX, headY + headHpx]
    ]
        .map(p => p.join(","))
        .join(" ");

    topHead.setAttribute("points", points);
    topHead.setAttribute("fill", "#f8fafc");
    topHead.setAttribute("stroke", "#0f172a");
    topHead.setAttribute("stroke-width", "0.8");
    svg.appendChild(topHead);

    let bottomTrimX = null;
    let bottomTrimW = null;
    if (isWindow) {
        const bottomOverhangPx2 = ohBottom * scale;
        bottomTrimX = windowX - trimWpx - bottomOverhangPx2;
        const bottomTrimY = windowY + windowHpx;
        bottomTrimW = (W + 2 * tw + 2 * ohBottom) * scale;

        const bottomTrim = document.createElementNS(xmlns, "rect");
        bottomTrim.setAttribute("x", bottomTrimX);
        bottomTrim.setAttribute("y", bottomTrimY);
        bottomTrim.setAttribute("width", bottomTrimW);
        bottomTrim.setAttribute("height", trimWpx);
        bottomTrim.setAttribute("fill", "#f8fafc");
        bottomTrim.setAttribute("stroke", "#0f172a");
        bottomTrim.setAttribute("stroke-width", "0.8");
        svg.appendChild(bottomTrim);
    }

    const sideDimX = marginLeft - 10;
    addDimLine(
        svg,
        sideDimX,
        windowY,
        sideDimX,
        windowY + windowHpx,
        "",
        { fontSize: "7" }
    );
    addVerticalLabel(svg, sideDimX, windowY + windowHpx / 2, `${H.toFixed(1)}"`);

    const headDimY = marginTop - 10;
    addDimLine(
        svg,
        topLeftX,
        headDimY,
        topRightX,
        headDimY,
        `${headCutLenIn.toFixed(1)}"`,
        { fontSize: "7" }
    );

    if (isWindow && bottomTrimX !== null) {
        const bottomDimY = outerY + outerHpx + 10;
        addDimLine(
            svg,
            bottomTrimX,
            bottomDimY,
            bottomTrimX + bottomTrimW,
            bottomDimY,
            `${(W + 2 * tw + 2 * ohBottom).toFixed(1)}"`,
            { fontSize: "7" }
        );
    }

    addText(
        svg,
        topLeftX + 4,
        headY + 10,
        `${angleDeg.toFixed(1)}°`,
        { fontSize: "7" }
    );
    addText(
        svg,
        topRightX - 4,
        headY + 10,
        `${angleDeg.toFixed(1)}°`,
        { fontSize: "7", anchor: "end" }
    );

    return svg;
}

// ---------- Interior returns SVG ----------
function createInteriorReturnsSVG(opening, settings) {
    const W = opening.widthIn;
    const H = opening.heightIn;
    const th = settings.returnThicknessIn;
    const sideReturnLen = Math.max(0, H - 2 * th);
    const isWindow = opening.openingType === "window";
    if (!isWindow) return null;

    const outerWidthIn = W;
    const outerHeightIn = sideReturnLen + 2 * th;

    const layout = getDiagramLayout(outerWidthIn, outerHeightIn);
    const {
        viewSize,
        marginLeft,
        marginTop,
        scale,
        outerX,
        outerY,
        outerWpx,
        outerHpx
    } = layout;

    const xmlns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(xmlns, "svg");
    svg.setAttribute("viewBox", `0 0 ${viewSize} ${viewSize}`);
    svg.setAttribute("width", viewSize);
    svg.setAttribute("height", viewSize);

    const retThPx = th * scale;
    const sideHeightPx = sideReturnLen * scale;

    const openingX = outerX;
    const openingY = outerY + retThPx;

    const openRect = document.createElementNS(xmlns, "rect");
    openRect.setAttribute("x", openingX);
    openRect.setAttribute("y", openingY);
    openRect.setAttribute("width", outerWpx);
    openRect.setAttribute("height", sideHeightPx);
    openRect.setAttribute("fill", "#e5f2ff");
    openRect.setAttribute("stroke", "#1e3a8a");
    openRect.setAttribute("stroke-width", "1");
    svg.appendChild(openRect);

    const topRet = document.createElementNS(xmlns, "rect");
    topRet.setAttribute("x", outerX);
    topRet.setAttribute("y", outerY);
    topRet.setAttribute("width", outerWpx);
    topRet.setAttribute("height", retThPx);
    topRet.setAttribute("fill", "#f8fafc");
    topRet.setAttribute("stroke", "#0f172a");
    topRet.setAttribute("stroke-width", "0.8");
    svg.appendChild(topRet);

    const botRet = document.createElementNS(xmlns, "rect");
    botRet.setAttribute("x", outerX);
    botRet.setAttribute("y", outerY + outerHpx - retThPx);
    botRet.setAttribute("width", outerWpx);
    botRet.setAttribute("height", retThPx);
    botRet.setAttribute("fill", "#f8fafc");
    botRet.setAttribute("stroke", "#0f172a");
    botRet.setAttribute("stroke-width", "0.8");
    svg.appendChild(botRet);

    const sideWidthPx = retThPx;
    const leftRet = document.createElementNS(xmlns, "rect");
    leftRet.setAttribute("x", outerX);
    leftRet.setAttribute("y", openingY);
    leftRet.setAttribute("width", sideWidthPx);
    leftRet.setAttribute("height", sideHeightPx);
    leftRet.setAttribute("fill", "#f8fafc");
    leftRet.setAttribute("stroke", "#0f172a");
    leftRet.setAttribute("stroke-width", "0.8");
    svg.appendChild(leftRet);

    const rightRet = document.createElementNS(xmlns, "rect");
    rightRet.setAttribute("x", outerX + outerWpx - sideWidthPx);
    rightRet.setAttribute("y", openingY);
    rightRet.setAttribute("width", sideWidthPx);
    rightRet.setAttribute("height", sideHeightPx);
    rightRet.setAttribute("fill", "#f8fafc");
    rightRet.setAttribute("stroke", "#0f172a");
    rightRet.setAttribute("stroke-width", "0.8");
    svg.appendChild(rightRet);

    const topDimY = marginTop - 10;
    addDimLine(
        svg,
        outerX,
        topDimY,
        outerX + outerWpx,
        topDimY,
        `${W.toFixed(1)}"`,
        { fontSize: "7" }
    );

    const sideDimX = marginLeft - 10;
    addDimLine(
        svg,
        sideDimX,
        openingY,
        sideDimX,
        openingY + sideHeightPx,
        "",
        { fontSize: "7" }
    );
    addVerticalLabel(svg, sideDimX, openingY + sideHeightPx / 2, `${sideReturnLen.toFixed(1)}"`);

    return svg;
}

// ---------- Exterior trim SVG ----------
function createExteriorTrimSVG(opening, settings) {
    const W = opening.widthIn;
    const H = opening.heightIn;
    const tw = settings.exteriorTrimWidthIn;
    const isWindow = opening.openingType === "window";
    const isDoor = opening.openingType === "interiorDoor" || opening.openingType === "exteriorDoor";

    const headLen = W + 2 * tw;
    const bottomLen = W;
    const sideLen = isWindow ? H + tw : H;

    const outerWidthIn = headLen;
    const outerHeightIn = H + 2 * tw;

    const layout = getDiagramLayout(outerWidthIn, outerHeightIn);
    const {
        viewSize,
        marginLeft,
        marginTop,
        scale,
        outerX,
        outerY,
        outerWpx,
        outerHpx
    } = layout;

    const windowWpx = W * scale;
    const windowHpx = H * scale;
    const trimWpx = tw * scale;

    const xmlns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(xmlns, "svg");
    svg.setAttribute("viewBox", `0 0 ${viewSize} ${viewSize}`);
    svg.setAttribute("width", viewSize);
    svg.setAttribute("height", viewSize);

    const windowX = outerX + trimWpx;
    const windowY = outerY + trimWpx;

    const windowRect = document.createElementNS(xmlns, "rect");
    windowRect.setAttribute("x", windowX);
    windowRect.setAttribute("y", windowY);
    windowRect.setAttribute("width", windowWpx);
    windowRect.setAttribute("height", windowHpx);
    windowRect.setAttribute("fill", "#e5f2ff");
    windowRect.setAttribute("stroke", "#1e3a8a");
    windowRect.setAttribute("stroke-width", "1");
    svg.appendChild(windowRect);

    const sideHeightPx = sideLen * scale;
    const left = document.createElementNS(xmlns, "rect");
    left.setAttribute("x", outerX);
    left.setAttribute("y", windowY);
    left.setAttribute("width", trimWpx);
    left.setAttribute("height", sideHeightPx);
    left.setAttribute("fill", "#f8fafc");
    left.setAttribute("stroke", "#0f172a");
    left.setAttribute("stroke-width", "0.8");
    svg.appendChild(left);

    const right = document.createElementNS(xmlns, "rect");
    right.setAttribute("x", windowX + windowWpx);
    right.setAttribute("y", windowY);
    right.setAttribute("width", trimWpx);
    right.setAttribute("height", sideHeightPx);
    right.setAttribute("fill", "#f8fafc");
    right.setAttribute("stroke", "#0f172a");
    right.setAttribute("stroke-width", "0.8");
    svg.appendChild(right);

    if (isWindow) {
        const bottom = document.createElementNS(xmlns, "rect");
        bottom.setAttribute("x", windowX);
        bottom.setAttribute("y", windowY + windowHpx);
        bottom.setAttribute("width", bottomLen * scale);
        bottom.setAttribute("height", trimWpx);
        bottom.setAttribute("fill", "#f8fafc");
        bottom.setAttribute("stroke", "#0f172a");
        bottom.setAttribute("stroke-width", "0.8");
        svg.appendChild(bottom);
    }

    const top = document.createElementNS(xmlns, "rect");
    top.setAttribute("x", outerX);
    top.setAttribute("y", outerY);
    top.setAttribute("width", headLen * scale);
    top.setAttribute("height", trimWpx);
    top.setAttribute("fill", "#f8fafc");
    top.setAttribute("stroke", "#0f172a");
    top.setAttribute("stroke-width", "0.8");
    svg.appendChild(top);

    const headDimY = marginTop - 10;
    addDimLine(
        svg,
        outerX,
        headDimY,
        outerX + headLen * scale,
        headDimY,
        `${headLen.toFixed(1)}"`,
        { fontSize: "7" }
    );

    if (isWindow) {
        const bottomDimY = outerY + outerHpx + 10;
        addDimLine(
            svg,
            windowX,
            bottomDimY,
            windowX + bottomLen * scale,
            bottomDimY,
            `${bottomLen.toFixed(1)}"`,
            { fontSize: "7" }
        );
    }

    const sideDimX = marginLeft - 10;
    addDimLine(
        svg,
        sideDimX,
        windowY,
        sideDimX,
        windowY + sideHeightPx,
        "",
        { fontSize: "7" }
    );
    addVerticalLabel(svg, sideDimX, windowY + sideHeightPx / 2, `${sideLen.toFixed(1)}"`);

    return svg;
}

// ---------- Board SVG ----------
function createBoardSVG(board, maxBoardLenIn) {
    const xmlns = "http://www.w3.org/2000/svg";
    const widthPx = 520;
    const heightPx = 100;
    const padX = 20;
    const boardY = heightPx / 2;

    const svg = document.createElementNS(xmlns, "svg");
    svg.setAttribute("viewBox", `0 0 ${widthPx} ${heightPx}`);
    svg.setAttribute("width", widthPx);
    svg.setAttribute("height", heightPx);

    const boardLengthIn = board.sizeIn;
    const usableWidth = widthPx - 2 * padX;

    const scale = usableWidth / maxBoardLenIn;
    const boardW = boardLengthIn * scale;

    const boardX = padX;

    // Row 1: full board dimension
    const dimY1 = boardY - 28;
    const feet = Math.floor(boardLengthIn / 12);
    const inches = boardLengthIn - feet * 12;
    let fullLabel;
    if (Math.abs(inches) < 0.01) {
        fullLabel = `${feet}'`;
    } else {
        fullLabel = `${feet}' ${inches.toFixed(1)}"`;
    }
    addDimLine(
        svg,
        boardX,
        dimY1,
        boardX + boardW,
        dimY1,
        fullLabel,
        { fontSize: "8" }
    );

    // Row 2: per cut dimensions
    const dimY2 = boardY - 14;

    let xCursor = boardX;
    const cutsWithPos = [];
    let totalCutWidthPx = 0;

    for (let i = 0; i < board.cuts.length; i++) {
        const cut = board.cuts[i];
        const cutW = cut.lengthIn * scale;
        cutsWithPos.push({
            cut,
            x: xCursor,
            widthPx: cutW
        });
        xCursor += cutW;
        totalCutWidthPx += cutW;
    }

    cutsWithPos.forEach(info => {
        const x1 = info.x;
        const x2 = info.x + info.widthPx;
        addDimLine(
            svg,
            x1,
            dimY2,
            x2,
            dimY2,
            `${info.cut.lengthIn.toFixed(1)}"`,
            { fontSize: "7" }
        );
    });

    // Row 3: board and cuts
    const boardRect = document.createElementNS(xmlns, "rect");
    boardRect.setAttribute("x", boardX);
    boardRect.setAttribute("y", boardY);
    boardRect.setAttribute("width", boardW);
    boardRect.setAttribute("height", 20);
    boardRect.setAttribute("fill", "#f1f5f9");
    boardRect.setAttribute("stroke", "#0f172a");
    boardRect.setAttribute("stroke-width", "1");
    svg.appendChild(boardRect);

    cutsWithPos.forEach(info => {
        const cutRect = document.createElementNS(xmlns, "rect");
        cutRect.setAttribute("x", info.x);
        cutRect.setAttribute("y", boardY);
        cutRect.setAttribute("width", info.widthPx);
        cutRect.setAttribute("height", 20);
        cutRect.setAttribute("fill", "#e2e8f0");
        cutRect.setAttribute("stroke", "#1e293b");
        cutRect.setAttribute("stroke-width", "0.8");
        svg.appendChild(cutRect);

        const labelX = info.x + info.widthPx / 2;
        const labelY = boardY + 14;
        addText(svg, labelX, labelY, `#${info.cut.piece.pieceId}`, {
            anchor: "middle",
            fontSize: "9"
        });
    });

    // Offcut
    const offcutWidthPx = boardW - totalCutWidthPx;
    if (offcutWidthPx > 4) {
        const offcutX = boardX + totalCutWidthPx;
        const offcutY = boardY;
        const offcut = document.createElementNS(xmlns, "rect");
        offcut.setAttribute("x", offcutX);
        offcut.setAttribute("y", offcutY);
        offcut.setAttribute("width", offcutWidthPx);
        offcut.setAttribute("height", 20);
        offcut.setAttribute("fill", "#fee2e2");
        offcut.setAttribute("stroke", "#b91c1c");
        offcut.setAttribute("stroke-width", "0.8");
        svg.appendChild(offcut);

        const step = 6;
        const xEnd = offcutX + offcutWidthPx;
        const baseY1 = boardY + 20;
        const baseY2 = boardY;

        for (let x0 = offcutX - 10; x0 <= xEnd; x0 += step) {
            const baseX1 = x0;
            const baseX2 = x0 + 10;

            const clipX1 = Math.max(baseX1, offcutX);
            const clipX2 = Math.min(baseX2, xEnd);

            if (clipX2 - clipX1 < 2) continue;

            const t1 = (clipX1 - baseX1) / 10;
            const t2 = (clipX2 - baseX1) / 10;

            const clipY1 = baseY1 + (baseY2 - baseY1) * t1;
            const clipY2 = baseY1 + (baseY2 - baseY1) * t2;

            const line = document.createElementNS(xmlns, "line");
            line.setAttribute("x1", clipX1);
            line.setAttribute("y1", clipY1);
            line.setAttribute("x2", clipX2);
            line.setAttribute("y2", clipY2);
            line.setAttribute("stroke", "#b91c1c");
            line.setAttribute("stroke-width", "0.6");
            svg.appendChild(line);
        }
    }

    return svg;
}

// ---------- Render output ----------
function renderMaterialsAndCutSheets(openings, settings) {
    const materialsDiv = document.getElementById("materials-section");
    const cutSheetsDiv = document.getElementById("cut-sheets-section");
    materialsDiv.innerHTML = "";
    cutSheetsDiv.innerHTML = "";

    const allPieces = [];

    for (const op of openings) {
        if (op.useInterior) {
            allPieces.push(...getInteriorPiecesForOpening(op, settings));
        }
        if (op.useExterior) {
            allPieces.push(...getExteriorPiecesForOpening(op, settings));
        }
    }

    if (!allPieces.length) {
        materialsDiv.innerHTML = "<p>No valid openings entered.</p>";
        return;
    }

    allPieces.forEach((p, idx) => {
        p.pieceId = idx + 1;
    });

    const interiorPieces = allPieces.filter(p => p.type === "interior");
    const exteriorPieces = allPieces.filter(p => p.type === "exterior");

    const interiorRequiredIn = interiorPieces.reduce((sum, p) => sum + p.lengthIn, 0);
    const exteriorRequiredIn = exteriorPieces.reduce((sum, p) => sum + p.lengthIn, 0);

    const interiorBoards = optimizeBoards(
        interiorPieces,
        settings.boardLengthsInteriorIn,
        settings.kerfIn
    );
    const exteriorBoards = optimizeBoards(
        exteriorPieces,
        settings.boardLengthsExteriorIn,
        settings.kerfIn
    );

    // Assign board numbers to pieces
    interiorBoards.forEach((board, idx) => {
        const num = idx + 1;
        board.boardNumber = num;
        board.cuts.forEach(c => {
            c.piece.boardNumber = num;
            c.piece.boardGroup = "interior";
        });
    });
    exteriorBoards.forEach((board, idx) => {
        const num = idx + 1;
        board.boardNumber = num;
        board.cuts.forEach(c => {
            c.piece.boardNumber = num;
            c.piece.boardGroup = "exterior";
        });
    });

    const interiorSummary = summarizeBoardsWithExtra(
        interiorBoards,
        interiorRequiredIn,
        settings.extraPercent
    );
    const exteriorSummary = summarizeBoardsWithExtra(
        exteriorBoards,
        exteriorRequiredIn,
        settings.extraPercent
    );

    const matHtmlParts = [];
    matHtmlParts.push("<h2>Materials Summary</h2>");

    if (interiorPieces.length) {
        matHtmlParts.push("<h3>Interior boards to purchase</h3>");
        matHtmlParts.push(
            "<table><thead><tr><th>Board length (ft)</th><th>Count</th><th>Total lf</th></tr></thead><tbody>"
        );
        for (const item of interiorSummary.summaryBySize) {
            const ft = item.sizeIn / 12;
            const totalLf = (item.sizeIn * item.count) / 12;
            matHtmlParts.push(
                `<tr><td>${ft.toFixed(1)}</td><td>${item.count}</td><td>${totalLf.toFixed(1)}</td></tr>`
            );
        }
        matHtmlParts.push("</tbody></table>");

        matHtmlParts.push("<h4>Interior linear footage and allowance</h4>");
        matHtmlParts.push("<table><tbody>");
        matHtmlParts.push(
            `<tr><th>Required total (lf)</th><td>${(interiorRequiredIn / 12).toFixed(2)}</td></tr>`
        );
        matHtmlParts.push(
            `<tr><th>Purchased total (lf)</th><td>${(interiorSummary.totalPurchasedIn / 12).toFixed(2)}</td></tr>`
        );
        matHtmlParts.push(
            `<tr><th>Extra over required (lf)</th><td>${(interiorSummary.totalWasteIn / 12).toFixed(2)}</td></tr>`
        );
        matHtmlParts.push(
            `<tr><th>Extra over required (%)</th><td>${interiorSummary.wastePct.toFixed(1)}%</td></tr>`
        );
        matHtmlParts.push("</tbody></table>");
    }

    if (exteriorPieces.length) {
        matHtmlParts.push("<h3>Exterior boards to purchase</h3>");
        const extLabel = settings.exteriorHardie
            ? "Hardie (12 ft only)"
            : "Exterior trim boards";
        matHtmlParts.push(`<p class="muted">${extLabel}</p>`);
        matHtmlParts.push(
            "<table><thead><tr><th>Board length (ft)</th><th>Count</th><th>Total lf</th></tr></thead><tbody>"
        );
        for (const item of exteriorSummary.summaryBySize) {
            const ft = item.sizeIn / 12;
            const totalLf = (item.sizeIn * item.count) / 12;
            matHtmlParts.push(
                `<tr><td>${ft.toFixed(1)}</td><td>${item.count}</td><td>${totalLf.toFixed(1)}</td></tr>`
            );
        }
        matHtmlParts.push("</tbody></table>");

        matHtmlParts.push("<h4>Exterior linear footage and allowance</h4>");
        matHtmlParts.push("<table><tbody>");
        matHtmlParts.push(
            `<tr><th>Required total (lf)</th><td>${(exteriorRequiredIn / 12).toFixed(2)}</td></tr>`
        );
        matHtmlParts.push(
            `<tr><th>Purchased total (lf)</th><td>${(exteriorSummary.totalPurchasedIn / 12).toFixed(2)}</td></tr>`
        );
        matHtmlParts.push(
            `<tr><th>Extra over required (lf)</th><td>${(exteriorSummary.totalWasteIn / 12).toFixed(2)}</td></tr>`
        );
        matHtmlParts.push(
            `<tr><th>Extra over required (%)</th><td>${exteriorSummary.wastePct.toFixed(1)}%</td></tr>`
        );
        matHtmlParts.push("</tbody></table>");
    }

    materialsDiv.innerHTML = matHtmlParts.join("");

    function renderBoardGroupDiagrams(boards, labelPrefix) {
        if (!boards.length) return;
        const groupDiv = document.createElement("div");
        groupDiv.className = "section";
        const title = document.createElement("h3");
        title.textContent = `${labelPrefix} board cut layouts`;
        groupDiv.appendChild(title);

        const legend = document.createElement("p");
        legend.className = "muted";
        legend.textContent =
            "Row 1: board length. Row 2: cut lengths. Row 3: cut positions. Red hatched area is offcut waste.";
        groupDiv.appendChild(legend);

        const sortedBoards = [...boards].sort((a, b) => a.sizeIn - b.sizeIn);
        const maxLenIn = Math.max(...sortedBoards.map(b => b.sizeIn));

        sortedBoards.forEach((board, index) => {
            const wrapper = document.createElement("div");
            wrapper.className = "board-diagram";

            const label = document.createElement("div");
            label.textContent = `${labelPrefix} board ${board.boardNumber} – ${(board.sizeIn / 12).toFixed(
                1
            )} ft`;
            wrapper.appendChild(label);

            const svg = createBoardSVG(board, maxLenIn);
            wrapper.appendChild(svg);

            groupDiv.appendChild(wrapper);
        });

        materialsDiv.appendChild(groupDiv);
    }

    if (interiorBoards.length) {
        renderBoardGroupDiagrams(interiorBoards, "Interior");
    }
    if (exteriorBoards.length) {
        renderBoardGroupDiagrams(exteriorBoards, "Exterior");
    }

    const piecesByOpening = {};
    for (const p of allPieces) {
        if (!piecesByOpening[p.openingId]) {
            piecesByOpening[p.openingId] = [];
        }
        piecesByOpening[p.openingId].push(p);
    }

    const openingOrder = openings.map(o => o.id);

    function friendlyType(t) {
        if (t === "window") return "window";
        if (t === "interiorDoor") return "interior door";
        if (t === "exteriorDoor") return "exterior door";
        return t;
    }

    openingOrder.forEach(id => {
        const opening = openings.find(o => o.id === id);
        const pieces = (piecesByOpening[id] || []).slice();
        if (!pieces.length) return;

        const wrapper = document.createElement("div");
        wrapper.className = "opening-card page-break";

        const title = document.createElement("h2");
        title.textContent = `Cut sheets – ${opening.name} (${friendlyType(opening.openingType)})`;
        wrapper.appendChild(title);

        const meta = document.createElement("p");
        meta.className = "muted";
        meta.textContent =
            `Width: ${opening.widthIn}" | Height: ${opening.heightIn}" | Wall: ${opening.wallType}`;
        wrapper.appendChild(meta);

        const interiorTrimPieces = pieces.filter(
            p => p.type === "interior" && p.role.includes("casing")
        );
        const interiorReturnPieces = opening.openingType === "window"
            ? pieces.filter(p => p.type === "interior" && p.role.includes("return"))
            : [];
        const exteriorTrimPieces = pieces.filter(p => p.type === "exterior");

        function addSection(heading, tablePieces, diagramNode, note) {
            if (!tablePieces.length && !diagramNode) return;

            const sectionDiv = document.createElement("div");
            sectionDiv.className = "subsection";

            const h3 = document.createElement("h3");
            h3.textContent = heading;
            sectionDiv.appendChild(h3);
            if (note) {
                const p = document.createElement("p");
                p.className = "muted";
                p.textContent = note;
                sectionDiv.appendChild(p);
            }

            const flex = document.createElement("div");
            flex.className = "flex";
            sectionDiv.appendChild(flex);

            if (tablePieces.length) {
                const tableContainer = document.createElement("div");
                tableContainer.style.flex = "1 1 260px";
                const table = document.createElement("table");
                table.innerHTML =
                    "<thead><tr><th>ID</th><th>Board #</th><th>Type</th><th>Role</th><th>Length (in)</th><th>Length (ft)</th></tr></thead>";
                const tbody = document.createElement("tbody");

                tablePieces
                    .slice()
                    .sort((a, b) => b.lengthIn - a.lengthIn)
                    .forEach(p => {
                        const tr = document.createElement("tr");
                        const boardNum = p.boardNumber ? p.boardNumber : "";
                        tr.innerHTML = `
              <td>#${p.pieceId}</td>
              <td>${boardNum}</td>
              <td>${p.type}</td>
              <td>${p.role}</td>
              <td>${p.lengthIn.toFixed(1)}</td>
              <td>${(p.lengthIn / 12).toFixed(2)}</td>
            `;
                        tbody.appendChild(tr);
                    });

                table.appendChild(tbody);
                tableContainer.appendChild(table);
                flex.appendChild(tableContainer);
            }

            if (diagramNode) {
                const diagramContainer = document.createElement("div");
                diagramContainer.className = "svg-wrapper";
                const diagramTitle = document.createElement("div");
                diagramTitle.className = "muted";
                diagramTitle.textContent = "Diagram (schematic)";
                diagramContainer.appendChild(diagramTitle);
                diagramContainer.appendChild(diagramNode);
                flex.appendChild(diagramContainer);
            }

            wrapper.appendChild(sectionDiv);
        }

        if (opening.useInterior) {
            addSection(
                "Interior trim",
                interiorTrimPieces,
                createInteriorTrimSVG(opening, settings),
                "Craftsman head with overhang and angle. Head dimension is cut length; bottom casing is measured span (windows only)."
            );
            if (opening.openingType === "window") {
                const returnsSvg = createInteriorReturnsSVG(opening, settings);
                addSection(
                    "Interior returns",
                    interiorReturnPieces,
                    returnsSvg,
                    "Boxed returns: top and bottom equal to window width; side returns equal to opening height minus two times trim thickness."
                );
            }
        }

        if (opening.useExterior) {
            addSection(
                "Exterior trim",
                exteriorTrimPieces,
                createExteriorTrimSVG(opening, settings),
                "Simple exterior trim. Head over side boards; bottom between sides (windows only). For doors, side trim stops at the door bottom."
            );
        }

        document.getElementById("cut-sheets-section").appendChild(wrapper);
    });
}

// ---------- Events ----------
document.getElementById("add-opening").addEventListener("click", () => {
    const tbody = document.getElementById("opening-rows");
    const idx = tbody.querySelectorAll("tr").length + 1;
    const row = createOpeningRow("Opening " + idx);
    tbody.appendChild(row);
});

(function setupSettingsCollapse() {
    const fieldset = document.getElementById("settings-fieldset");
    const toggleBtn = document.getElementById("toggle-settings");
    const updateLabel = () => {
        const collapsed = fieldset.classList.contains("collapsed");
        toggleBtn.textContent = collapsed ? "▶ Settings" : "▼ Settings";
    };
    toggleBtn.addEventListener("click", () => {
        fieldset.classList.toggle("collapsed");
        updateLabel();
    });
    updateLabel();
})();

(function setupOverhangLock() {
    const lockBtn = document.getElementById("overhangLockBtn");
    const topInput = document.getElementById("topOverhang");
    const bottomInput = document.getElementById("bottomOverhang");

    function setLocked(locked) {
        overhangLocked = locked;
        lockBtn.classList.toggle("locked", locked);
        lockBtn.textContent = locked ? "🔒" : "🔓";
        lockBtn.setAttribute("aria-pressed", locked ? "true" : "false");
        if (locked) {
            bottomInput.value = topInput.value;
        }
    }

    lockBtn.addEventListener("click", () => {
        setLocked(!overhangLocked);
    });

    topInput.addEventListener("input", (e) => {
        if (overhangLocked) {
            bottomInput.value = e.target.value;
        }
    });

    bottomInput.addEventListener("input", (e) => {
        if (overhangLocked) {
            topInput.value = e.target.value;
        }
    });

    setLocked(false);
})();

document.getElementById("exteriorHardie").addEventListener("change", e => {
    const extLengths = document.getElementById("exteriorBoardLengths");
    extLengths.disabled = e.target.checked;
});

document.getElementById("generate").addEventListener("click", () => {
    const settings = collectSettings();
    const openings = collectOpenings();
    renderMaterialsAndCutSheets(openings, settings);
    if (document.getElementById("materials-section")) {
        window.scrollTo({
            top: document.getElementById("materials-section").offsetTop,
            behavior: "smooth"
        });
    }
});

(function init() {
    const tbody = document.getElementById("opening-rows");
    tbody.appendChild(createOpeningRow("Opening 1"));
    document.getElementById("exteriorBoardLengths").disabled =
        document.getElementById("exteriorHardie").checked;
})();
