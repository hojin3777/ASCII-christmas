(() => {
  'use strict';

  // =========================================================================
  // Configuration & Timeline (1080x2316 Single Unified Terminal Grid)
  // Balanced 106x142 grid so individual ASCII glyphs read clearly on mobile!
  // =========================================================================
  const BASE_WIDTH = 1080;
  const BASE_HEIGHT = 2316;
  const COLS = 106;
  const ROWS = 142;

  const TIMELINE = {
    SNOW_GROUND_START: 0.15,
    SNOW_GROUND_END: 3.2,
    TRUNK_START: 1.9,
    TRUNK_END: 2.9,
    // 4 tiers grow bottom -> top (한단씩)
    TIER_WINDOWS: [
      [6.9, 8.3], // Tier 0 (top peak)
      [5.5, 7.0], // Tier 1 (upper-mid)
      [4.1, 5.6], // Tier 2 (lower-mid)
      [2.7, 4.2], // Tier 3 (bottom skirt)
    ],
    GARLAND_START: 8.4,
    GARLAND_END: 11.3,
    ORN_START: 11.4,
    ORN_END: 13.9,
    STAR_START: 14.3,
    STAR_END: 15.5,
    MERRY_START: 15.7,
    MERRY_END: 16.65,
    CHRISTMAS_START: 16.55,
    CHRISTMAS_END: 17.75,
    // Integrated terminal countdown below accumulated snow (no global dimming)
    COUNTDOWN_CAPTION_START: 18.0,
    COUNTDOWN_CAPTION_END: 18.8,
    COUNTDOWN_DIGITS_START: 18.9,
    COUNTDOWN_DIGITS_END: 19.85,
    DDAY_START: 20.05,
    DDAY_END: 20.85,
  };

  // Tree geometry: 4 overlapping tiers (top -> bottom)
  const TIERS = [
    { top: 0.00, bot: 0.30, r0: 0.00, rmax: 0.25 },
    { top: 0.20, bot: 0.54, r0: 0.27, rmax: 0.40 },
    { top: 0.43, bot: 0.78, r0: 0.33, rmax: 0.54 },
    { top: 0.66, bot: 1.00, r0: 0.36, rmax: 0.68 },
  ];

  // Vertical layout in unified 106x142 single-font terminal grid
  const LAYOUT = {
    CENTER_COL: (COLS - 1) / 2, // 52.5
    STAR_ROW: 13.5,
    TREE_TOP_ROW: 19.0,
    TREE_BOT_ROW: 92.0, // 73 rows tall
    TRUNK_TOP_ROW: 91.0,
    TRUNK_BOT_ROW: 100.0,
    GROUND_CENTER_ROW: 106.5,
    GROUND_RX: 47.0, // wide, dense circular snow mound
    GROUND_RY: 10.5, // spans rows 96..117
    TREE_SCALE_X: 60.5, // maps normalized radius 0.68 -> ~41.1 cols
    // Integrated terminal countdown positioned cleanly BELOW accumulated snow
    BOX_LEFT_COL: 14,
    BOX_RIGHT_COL: 91,
    CAPTION_TOP_ROW: 120, // 2-row ASCII header: rows 120..121
    COUNTDOWN_TOP_ROW: 124, // 7-row ASCII digits: rows 124..130
    DDAY_TOP_ROW: 133, // 3-row ASCII 'JINBIN ♥ D+1257': rows 133..135
  };

  const ROT_SPEED = 0.19;
  const WORD = 'MERRYCHRISTMAS';
  const FONT_FAMILY = "'D2Coding', 'Cascadia Code', monospace";
  const CURSIVE_FONT = "'Lobster', 'Brush Script MT', cursive";

  // =========================================================================
  // Terminal Boot Screen Configuration (Green on Black -> Hard Cut -> Scene)
  // =========================================================================
  const BOOT_HOLD_END = 3.35;   // Boot log ends + brief hold on "Final decoding ... OK"
  const BOOT_CUT_END = 3.75;    // Hard cut pure black beat (no fade/transition)
  const SECRET_CODE = '0522';
  let secretState = 0;          // 0 = default (D-Day hidden), 1 = unlocked via code 0522

  function formatKstTimestamp(ms) {
    const kst = new Date(ms + 9 * 60 * 60 * 1000);
    const y = kst.getUTCFullYear();
    const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const d = String(kst.getUTCDate()).padStart(2, '0');
    const h = String(kst.getUTCHours()).padStart(2, '0');
    const mi = String(kst.getUTCMinutes()).padStart(2, '0');
    const s = String(kst.getUTCSeconds()).padStart(2, '0');
    return `${y}-${mo}-${d} ${h}:${mi}:${s} KST`;
  }

  function createBootLines(nowMs) {
    const dateStr = formatKstTimestamp(nowMs);
    const dDay = getKstAnniversaryDays();
    const secretLine =
      secretState === 1
        ? { at: 1.78, text: `[ 0.940] Secret mode :: JINBIN (D+${dDay}) . OK`, tone: 'bright' }
        : { at: 1.78, text: '[ 0.940] Verifying holiday archive ........ OK', tone: 'normal' };

    return [
      { at: 0.05, text: 'ASCII-CHRISTMAS TERMINAL BIOS v2.6.1225', tone: 'bright' },
      { at: 0.14, text: '================================================', tone: 'dim' },
      { at: 0.24, text: `DATE      : ${dateStr}`, tone: 'normal' },
      { at: 0.34, text: 'VERSION   : v2.6.1225  (1080x2316 / 106x142)', tone: 'normal' },
      { at: 0.44, text: 'AUTHOR    : hojin3777', tone: 'normal' },
      { at: 0.54, text: '------------------------------------------------', tone: 'dim' },
      { at: 0.66, text: '[ 0.042] Mounting terminal grid buffer .... OK', tone: 'normal' },
      { at: 0.80, text: '[ 0.118] Loading D2Coding / Cascadia font . OK', tone: 'normal' },
      { at: 0.94, text: '[ 0.215] Starting ASCII 3D renderer ....... OK', tone: 'normal' },
      { at: 1.08, text: '[ 0.334] Initializing snowfall (560) ...... OK', tone: 'normal' },
      { at: 1.22, text: '[ 0.461] Building 4-tier tree geometry .... OK', tone: 'normal' },
      { at: 1.36, text: '[ 0.588] Linking dual-helix garland ....... OK', tone: 'normal' },
      { at: 1.50, text: '[ 0.702] Starting text renderer ........... OK', tone: 'normal' },
      { at: 1.64, text: '[ 0.819] Syncing KST countdown timer ...... OK', tone: 'normal' },
      secretLine,
      { at: 1.92, text: '[ 1.042] Starting WebAudio beep synth ..... OK', tone: 'normal' },
      { at: 2.04, text: '[ 1.150] Calibrating phosphor bloom ....... OK', tone: 'normal' },
      { at: 2.18, text: '...', tone: 'dim' },
      { at: 2.32, text: '...', tone: 'dim' },
      { at: 2.46, text: '...', tone: 'dim' },
      { at: 2.60, text: '...', tone: 'dim' },
      { at: 2.76, text: 'Final decoding ... ', okAt: 2.98, okText: 'OK', tone: 'bright' },
    ];
  }

  let bootLines = [];

  function renderBootScreen(t) {
    // Hard black cut window (no transition/fade) before main sequence begins
    if (t >= BOOT_HOLD_END) {
      stageCtx.fillStyle = '#000000';
      stageCtx.fillRect(0, 0, renderW, renderH);
      return;
    }

    sharpCtx.clearRect(0, 0, renderW, renderH);

    const bootFontPx = clamp(renderW * 0.026, 22, 36);
    const lineH = bootFontPx * 1.62;
    const padX = Math.round(renderW * 0.055);
    const startY = Math.round(renderH * 0.095);

    sharpCtx.font = `700 ${bootFontPx.toFixed(1)}px ${FONT_FAMILY}`;
    sharpCtx.textAlign = 'left';
    sharpCtx.textBaseline = 'top';

    let lastLineText = '';
    let lastLineY = startY;

    for (let i = 0; i < bootLines.length; i++) {
      const line = bootLines[i];
      if (t < line.at) break;

      const y = startY + i * lineH;
      let displayText = line.text;
      let hasOkSuffix = false;

      if (line.okAt !== undefined) {
        if (t >= line.okAt) {
          displayText = line.text + line.okText;
          hasOkSuffix = true;
        }
      } else if (displayText.endsWith(' OK')) {
        hasOkSuffix = true;
      }

      if (hasOkSuffix) {
        const prefix = displayText.slice(0, -2);
        const okPart = displayText.slice(-2);
        sharpCtx.fillStyle =
          line.tone === 'bright'
            ? '#64ff9e'
            : line.tone === 'dim'
              ? '#1e8a48'
              : '#32e074';
        sharpCtx.fillText(prefix, padX, y);
        const prefixW = sharpCtx.measureText(prefix).width;
        sharpCtx.fillStyle = '#9dffbe';
        sharpCtx.fillText(okPart, padX + prefixW, y);
      } else {
        sharpCtx.fillStyle =
          line.tone === 'bright'
            ? '#64ff9e'
            : line.tone === 'dim'
              ? '#1e8a48'
              : '#32e074';
        sharpCtx.fillText(displayText, padX, y);
      }

      lastLineText = displayText;
      lastLineY = y;
    }

    // Crisp blinking green terminal block cursor at end of active boot line
    if (Math.floor(t * 7) % 2 === 0) {
      const cursorX = padX + sharpCtx.measureText(lastLineText).width + bootFontPx * 0.15;
      sharpCtx.fillStyle = '#64ff9e';
      sharpCtx.fillText('█', cursorX, lastLineY);
    }

    // Pure black background + subtle green phosphor bloom
    stageCtx.fillStyle = '#000000';
    stageCtx.fillRect(0, 0, renderW, renderH);
    stageCtx.drawImage(sharpCanvas, 0, 0, renderW, renderH);

    bloomCtxA.clearRect(0, 0, bloomCanvasA.width, bloomCanvasA.height);
    bloomCtxA.drawImage(sharpCanvas, 0, 0, bloomCanvasA.width, bloomCanvasA.height);

    stageCtx.save();
    stageCtx.globalCompositeOperation = 'lighter';
    stageCtx.globalAlpha = 0.28;
    stageCtx.drawImage(bloomCanvasA, 0, 0, renderW, renderH);
    stageCtx.restore();
  }

  // =========================================================================
  // 2-Row ASCII Font for KST · UNTIL CHRISTMAS Header (Same Single Grid!)
  // =========================================================================
  const CAPTION_2ROW_FONT = {
    K: ['| /', '| \\'],
    S: [",-'", "--'"],
    T: ['---', ' | '],
    U: ['| |', '\\_/'],
    N: ['|\\ |', '| \\|'],
    I: ['|', '|'],
    L: ['|  ', '|__'],
    C: [",-'", '`-.'],
    H: ['|_|', '| |'],
    R: ['|-.', '| \\'],
    M: ['|\\ /|', '| V |'],
    A: [' /\\ ', '/--\\'],
    E: ['|--', '|__'],
    Y: ['\\_/', ' | '],
    '·': ['.', "'"],
    ' ': ['  ', '  '],
  };

  // =========================================================================
  // 7-Row ASCII Digit Font for KST DD:HH:MM:SS (Same Single Grid!)
  // =========================================================================
  const DIGIT_7ROW_FONT = {
    '0': ['.####.', '##..##', '##..##', '##..##', '##..##', '##..##', '.####.'],
    '1': ['...##.', '..###.', '...##.', '...##.', '...##.', '...##.', '.#####'],
    '2': ['.####.', '##..##', '....##', '..###.', '.##...', '##....', '######'],
    '3': ['.####.', '##..##', '....##', '..###.', '....##', '##..##', '.####.'],
    '4': ['##..##', '##..##', '##..##', '######', '....##', '....##', '....##'],
    '5': ['######', '##....', '#####.', '....##', '....##', '##..##', '.####.'],
    '6': ['.####.', '##....', '#####.', '##..##', '##..##', '##..##', '.####.'],
    '7': ['######', '....##', '...##.', '..##..', '.##...', '.##...', '.##...'],
    '8': ['.####.', '##..##', '##..##', '.####.', '##..##', '##..##', '.####.'],
    '9': ['.####.', '##..##', '##..##', '.#####', '....##', '....##', '.####.'],
    ':': ['..', '**', '**', '..', '**', '**', '..'],
  };

  // =========================================================================
  // 3-Row ASCII Font for 'JINBIN ♥ D+XXXX' Anniversary D-Day (Same Single Grid!)
  // =========================================================================
  const DDAY_3ROW_FONT = {
    J: ['--|', '  |', '\\_/'],
    I: ['|', '|', '|'],
    N: ['|\\ |', '| \\|', '|  |'],
    B: ['|-.', '|-<', "|-'"],
    D: ['|-.', '| |', "|-'"],
    '+': [' | ', '-+-', ' | '],
    '♥': ['.#.#.', '#####', " '#' "],
    '0': ['.-.', '| |', "'-'"],
    '1': ['/| ', ' | ', '---'],
    '2': ['.-.', " -'", "'--"],
    '3': ['.-.', ' -|', "'-'"],
    '4': ['| |', "'-|", '  |'],
    '5': ['.--', "'-.", "'-'"],
    '6': ['.-.', '|-.', "'-'"],
    '7': ['---', ' / ', '/  '],
    '8': ['.-.', '|-|', "'-'"],
    '9': ['.-.', "'-|", "'-'"],
    ' ': ['  ', '  ', '  '],
  };

  // =========================================================================
  // Utilities
  // =========================================================================
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function ramp(t, a, b) {
    return clamp((t - a) / (b - a), 0, 1);
  }

  function easeOutCubic(x) {
    const inv = 1 - clamp(x, 0, 1);
    return 1 - inv * inv * inv;
  }

  // Condition 1: Every generation animation starts pure white -> target color
  function whiteToColor(target, age, duration = 0.8) {
    const p = easeOutCubic(clamp(age / duration, 0, 1));
    return [
      255 + (target[0] - 255) * p,
      255 + (target[1] - 255) * p,
      255 + (target[2] - 255) * p,
    ];
  }

  // Stepped terminal color transition (crisp quantized steps)
  function whiteToColorStepped(target, age, duration = 0.55, steps = 4) {
    const raw = clamp(age / duration, 0, 1);
    const p = Math.floor(raw * steps) / steps;
    return [
      255 + (target[0] - 255) * p,
      255 + (target[1] - 255) * p,
      255 + (target[2] - 255) * p,
    ];
  }

  function tierRadius(k, u) {
    const t = TIERS[k];
    const exp = k === 0 ? 1.12 : 1.0;
    return t.rmax * (t.r0 + (1 - t.r0) * Math.pow(u, exp));
  }

  function maxTreeRadiusAtH(h) {
    let r = 0;
    for (let k = 0; k < TIERS.length; k++) {
      const t = TIERS[k];
      if (h >= t.top && h <= t.bot) {
        const u = (h - t.top) / (t.bot - t.top);
        const rk = tierRadius(k, u);
        if (rk > r) r = rk;
      }
    }
    return r;
  }

  // =========================================================================
  // Thick Cursive Brush-Script -> 1x UNIFORM Terminal Grid Rasterizer
  // Uses the EXACT same single 106x142 grid & font size as everything else!
  // =========================================================================
  function rasterizeCursiveToUniformGrid(text, targetCol, targetRow, boxCols, boxRows, tiltDeg, threshold) {
    // Match 1080x2316 / (106x142) cell aspect ratio (10.19 / 16.31 ≈ 0.625)
    const sampleCellW = 10;
    const sampleCellH = 16;
    const cw = boxCols * sampleCellW;
    const ch = boxRows * sampleCellH;

    const off = document.createElement('canvas');
    off.width = cw;
    off.height = ch;
    const ctx = off.getContext('2d', { willReadFrequently: true });

    let fontSize = Math.round(ch * 0.72);
    ctx.font = `400 ${fontSize}px ${CURSIVE_FONT}`;
    const measuredW = ctx.measureText(text).width;
    const maxAllowedW = cw * 0.95;
    if (measuredW > maxAllowedW) {
      fontSize = Math.floor(fontSize * (maxAllowedW / measuredW));
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.translate(cw * 0.5, ch * 0.54);
    ctx.rotate((tiltDeg * Math.PI) / 180);
    ctx.font = `400 ${fontSize}px ${CURSIVE_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, 0);
    ctx.restore();

    const img = ctx.getImageData(0, 0, cw, ch).data;
    const cells = [];
    let minDx = boxCols;
    let maxDx = 0;

    for (let dy = 0; dy < boxRows; dy++) {
      for (let dx = 0; dx < boxCols; dx++) {
        let sumAlpha = 0;
        const x0 = dx * sampleCellW;
        const y0 = dy * sampleCellH;
        for (let py = y0; py < y0 + sampleCellH; py++) {
          let rowPtr = (py * cw + x0) * 4 + 3;
          for (let px = 0; px < sampleCellW; px++) {
            sumAlpha += img[rowPtr];
            rowPtr += 4;
          }
        }
        const cov = sumAlpha / (sampleCellW * sampleCellH * 255);
        if (cov < threshold) continue;

        let glyph;
        if (cov > 0.80) glyph = (dx + dy) % 3 === 0 ? '@' : '#';
        else if (cov > 0.56) glyph = '#';
        else glyph = '%';

        if (dx < minDx) minDx = dx;
        if (dx > maxDx) maxDx = dx;

        cells.push({
          col: targetCol + dx,
          row: targetRow + dy,
          dx,
          cov,
          ch: glyph,
        });
      }
    }

    const spanX = Math.max(1, maxDx - minDx);
    for (let i = 0; i < cells.length; i++) {
      cells[i].progressX = (cells[i].dx - minDx) / spanX;
    }

    return cells;
  }

  let merryAsciiCells = [];
  let christmasAsciiCells = [];

  function buildCursiveGreetings() {
    // 1x uniform terminal cells flanking upper-left & upper-right of the tree peak
    // Cleanly separated from the tree tip with solid, unbroken cursive strokes!
    merryAsciiCells = rasterizeCursiveToUniformGrid('Merry', 2, 11, 45, 15, -6.0, 0.28);
    christmasAsciiCells = rasterizeCursiveToUniformGrid('christmas', 57, 11, 48, 14, -5.0, 0.27);
  }

  // =========================================================================
  // Procedural 3D Scene Geometry Builders (Deterministic)
  // =========================================================================
  const rng = mulberry32(20261225);

  // 1. Background Ambient Stars
  const bgStars = [];
  for (let i = 0; i < 100; i++) {
    bgStars.push({
      col: Math.floor(rng() * COLS),
      row: Math.floor(rng() * (ROWS * 0.82)),
      ch: rng() < 0.72 ? '.' : rng() < 0.88 ? '·' : '+',
      phase: rng() * Math.PI * 2,
      speed: 1.0 + rng() * 1.6,
      baseAlpha: 0.14 + rng() * 0.22,
    });
  }

  // 2. Dense, Slow Grid-Integrated Snowflakes (+, *, 일본식 온점 '。', ., ·, ,)
  // 3 depth layers:
  //   - Far sky (z = -50): behind tree & text
  //   - Mid foreground (z = 25): in front of tree (replaces tree glyphs)
  //   - Near foreground (z = 38): in front of Merry/christmas & tree (replaces glyphs!)
  const SNOW_GLYPHS_FAR = ['.', '·', ',', '.', '。'];
  const SNOW_GLYPHS_MID = ['+', '*', '。', '.', '+'];
  const SNOW_GLYPHS_NEAR = ['*', '+', '。', '.', '*'];

  const snowflakes = [];
  const SNOW_COUNT = 560;
  for (let i = 0; i < SNOW_COUNT; i++) {
    const depth = rng();
    const snowLayer = depth > 0.64 ? 2 : depth > 0.36 ? 1 : 0;
    let glyphPool = SNOW_GLYPHS_FAR;
    if (snowLayer === 2) glyphPool = SNOW_GLYPHS_NEAR;
    else if (snowLayer === 1) glyphPool = SNOW_GLYPHS_MID;

    const ch = glyphPool[Math.floor(rng() * glyphPool.length)];
    const vyRows = 2.4 + depth * 4.6 + rng() * 1.1; // slow, serene snowfall
    snowflakes.push({
      col0: rng() * COLS,
      row0: -rng() * (ROWS * 0.95),
      depth,
      snowLayer,
      ch,
      vyRows,
      swayCols: 0.8 + rng() * 2.1,
      swayFreq: 0.35 + rng() * 0.65,
      phase: rng() * Math.PI * 2,
      twinklePhase: rng() * Math.PI * 2,
      bornAt: rng() * 1.8,
      targetColor:
        snowLayer === 2
          ? [240, 248, 255]
          : snowLayer === 1
            ? [196, 220, 246]
            : [134, 162, 198],
      baseAlpha:
        snowLayer === 2
          ? 0.82 + (depth - 0.64) * 0.48
          : snowLayer === 1
            ? 0.54 + (depth - 0.36) * 0.65
            : 0.28 + depth * 0.45,
    });
  }

  // 3. Large, Dense Circular Accumulated Snow Ground (filled cell-by-cell)
  const groundPoints = [];
  const GROUND_GLYPHS_CORE = ['*', '+', '。', '.', '·', '~', ','];
  const GROUND_GLYPHS_EDGE = ['。', '.', ',', '·', '+'];

  const gMinRow = Math.max(0, Math.floor(LAYOUT.GROUND_CENTER_ROW - LAYOUT.GROUND_RY - 2));
  const gMaxRow = Math.min(ROWS - 1, Math.ceil(LAYOUT.GROUND_CENTER_ROW + LAYOUT.GROUND_RY + 2));
  const gMinCol = Math.max(0, Math.floor(LAYOUT.CENTER_COL - LAYOUT.GROUND_RX - 2));
  const gMaxCol = Math.min(COLS - 1, Math.ceil(LAYOUT.CENTER_COL + LAYOUT.GROUND_RX + 2));

  for (let row = gMinRow; row <= gMaxRow; row++) {
    for (let col = gMinCol; col <= gMaxCol; col++) {
      const nx = (col - LAYOUT.CENTER_COL) / LAYOUT.GROUND_RX;
      const ny = (row - LAYOUT.GROUND_CENTER_ROW) / LAYOUT.GROUND_RY;
      const angle = Math.atan2(ny, nx);
      const contourJitter = 1 + 0.05 * Math.sin(angle * 5 + 0.7) + 0.03 * Math.cos(angle * 9);
      const rad = Math.hypot(nx, ny) / contourJitter;

      if (rad > 1.05) continue;

      let keepProb = 0.95;
      if (rad > 0.76) {
        keepProb = clamp(0.95 - ((rad - 0.76) / 0.29) * 0.78, 0.14, 0.95);
      }
      if (rng() > keepProb) continue;

      const pool = rad < 0.72 ? GROUND_GLYPHS_CORE : GROUND_GLYPHS_EDGE;
      const ch = pool[Math.floor(rng() * pool.length)];

      const appearTime =
        TIMELINE.SNOW_GROUND_START +
        clamp(rng() * 2.4 + rad * 0.75 + (rng() < 0.18 ? rng() * 1.9 : 0), 0, 5.2);

      const edgeFade = 1 - Math.pow(clamp(rad, 0, 1), 2.3) * 0.62;
      const frontShade = 0.80 + 0.20 * clamp(ny, -1, 1);
      const moundHighlight = (1 - clamp(rad, 0, 1)) * 0.18;
      const lum = clamp(edgeFade * frontShade + moundHighlight, 0.28, 1.0);

      groundPoints.push({
        col,
        row,
        rad,
        ny,
        ch,
        appearTime,
        targetColor: [
          Math.round(162 + 80 * lum),
          Math.round(192 + 58 * lum),
          Math.round(226 + 29 * lum),
        ],
        baseAlpha: 0.44 + 0.52 * lum,
        twinklePhase: rng() * Math.PI * 2,
      });
    }
  }

  // 4. Tree Trunk (밑둥) — 3D rotating cylinder
  const trunkPoints = [];
  const TRUNK_GLYPHS = ['|', '#', 'H', 'I', 'M', ':'];
  const TRUNK_ROWS = 20;
  for (let i = 0; i < TRUNK_ROWS; i++) {
    const v = i / (TRUNK_ROWS - 1);
    const rowY = LAYOUT.TRUNK_BOT_ROW - v * (LAYOUT.TRUNK_BOT_ROW - LAYOUT.TRUNK_TOP_ROW);
    const numAround = 32;
    for (let j = 0; j < numAround; j++) {
      const theta = (j / numAround) * Math.PI * 2 + rng() * 0.14;
      const r = 0.092 + (1 - v) * 0.024 + (rng() - 0.5) * 0.008;
      const appearTime =
        TIMELINE.TRUNK_START +
        v * (TIMELINE.TRUNK_END - TIMELINE.TRUNK_START - 0.18) +
        rng() * 0.14;
      trunkPoints.push({
        r,
        theta,
        rowY,
        v,
        ch: TRUNK_GLYPHS[Math.floor(rng() * TRUNK_GLYPHS.length)],
        appearTime,
        shadeJitter: 0.85 + rng() * 0.3,
      });
    }
  }

  // 5. Tree Foliage Points (4 overlapping 3D tiers)
  const treePoints = [];
  const treeHeightRows = LAYOUT.TREE_BOT_ROW - LAYOUT.TREE_TOP_ROW;

  for (let k = 0; k < TIERS.length; k++) {
    const tier = TIERS[k];
    const [tStart, tEnd] = TIMELINE.TIER_WINDOWS[k];
    const spanH = tier.bot - tier.top;
    const rings = Math.round(spanH * treeHeightRows * 1.9);

    for (let ri = 0; ri <= rings; ri++) {
      const u = ri / rings;
      const h = tier.top + u * spanH;
      const baseR = tierRadius(k, u);
      const countAround = Math.max(10, Math.round(baseR * 215));

      for (let j = 0; j < countAround; j++) {
        const theta =
          (j / countAround) * Math.PI * 2 +
          (rng() - 0.5) * (0.5 / Math.max(1, countAround)) * Math.PI * 2;
        const boughWave = 1 + 0.048 * Math.sin(theta * 7 + k * 1.9 + u * 2.5);
        const radialLayer = rng() < 0.78 ? 1.0 : 0.72 + rng() * 0.25;
        const r = Math.max(0.012, baseR * boughWave * radialLayer + (rng() - 0.5) * 0.014);

        const growthProgress = 1 - u;
        const appearTime =
          tStart +
          growthProgress * (tEnd - tStart - 0.15) +
          (rng() - 0.5) * 0.12;

        let overhangShadow = 1.0;
        if (k > 0) {
          const upper = TIERS[k - 1];
          if (h >= upper.bot - 0.07 && h <= upper.bot + 0.04) {
            overhangShadow = 0.52 + 0.48 * clamp((h - (upper.bot - 0.07)) / 0.11, 0, 1);
          }
        }

        const skirtBoost = u > 0.88 ? 1.12 : 1.0;
        const charIdx = Math.floor(rng() * WORD.length);
        const ch = rng() < 0.91 ? WORD[charIdx] : rng() < 0.5 ? '+' : '*';

        const hueVar = rng();
        const baseColor =
          hueVar < 0.28
            ? [24, 155, 76]
            : hueVar < 0.76
              ? [42, 202, 98]
              : [88, 232, 134];

        treePoints.push({
          tier: k,
          h,
          u,
          r,
          theta,
          rowY: LAYOUT.TREE_TOP_ROW + h * treeHeightRows,
          ch,
          appearTime,
          overhangShadow,
          skirtBoost,
          baseColor,
        });
      }
    }
  }

  // 6. Dual Spiral Garland / String Ornaments (주황색 1줄 + 빨간색 1줄 이중 나선)
  const garlandPoints = [];
  const GARLAND_SAMPLES = 380;
  const GARLAND_TURNS = 4.4;
  const GARLAND_GLYPHS = ['o', '*', '~', '°', 'o', '·'];

  const GARLAND_STRANDS = [
    {
      thetaOffset: 0.4,
      timeOffset: 0.0,
      bulbColor: [255, 206, 86],   // warm bright orange-gold bulbs
      wireColor: [255, 146, 36],   // rich glowing orange garland
    },
    {
      thetaOffset: 0.4 + Math.PI,  // 180° opposite phase -> clean double-helix!
      timeOffset: 0.22,
      bulbColor: [255, 112, 126],  // sparkling ruby-red bulbs
      wireColor: [255, 42, 62],    // vivid festive red garland
    },
  ];

  for (let sIdx = 0; sIdx < GARLAND_STRANDS.length; sIdx++) {
    const strand = GARLAND_STRANDS[sIdx];
    for (let i = 0; i < GARLAND_SAMPLES; i++) {
      const p = i / (GARLAND_SAMPLES - 1);
      const baseH = 0.96 - p * 0.90;
      const drape = 0.011 * Math.sin(p * Math.PI * 16 + sIdx * Math.PI);
      const h = clamp(baseH + drape, 0.05, 0.98);
      const theta = p * Math.PI * 2 * GARLAND_TURNS + strand.thetaOffset;
      const r = maxTreeRadiusAtH(h) + 0.032;

      const appearTime =
        TIMELINE.GARLAND_START +
        strand.timeOffset +
        p * (TIMELINE.GARLAND_END - TIMELINE.GARLAND_START - 0.22);
      const isBulb = i % 4 === 0;

      garlandPoints.push({
        p,
        h,
        r,
        theta,
        rowY: LAYOUT.TREE_TOP_ROW + h * treeHeightRows,
        ch: isBulb ? (i % 8 === 0 ? '*' : 'o') : GARLAND_GLYPHS[i % GARLAND_GLYPHS.length],
        isBulb,
        appearTime,
        twinklePhase: rng() * Math.PI * 2,
        targetColor: isBulb ? strand.bulbColor : strand.wireColor,
      });
    }
  }

  // 7. 3D Ornaments: Sphere (구), Star (별), Stocking (양말) — scaled for 106x142
  const ORNAMENT_SPRITES = {
    sphere: [
      { dx: -1, dy: -1, ch: ',', role: 'body' },
      { dx: 0, dy: -1, ch: '-', role: 'body' },
      { dx: 1, dy: -1, ch: ',', role: 'body' },
      { dx: -2, dy: 0, ch: '(', role: 'body' },
      { dx: -1, dy: 0, ch: '*', role: 'shine' },
      { dx: 0, dy: 0, ch: '@', role: 'body' },
      { dx: 1, dy: 0, ch: '@', role: 'body' },
      { dx: 2, dy: 0, ch: ')', role: 'body' },
      { dx: -1, dy: 1, ch: '`', role: 'body' },
      { dx: 0, dy: 1, ch: '-', role: 'body' },
      { dx: 1, dy: 1, ch: "'", role: 'body' },
    ],
    star: [
      { dx: 0, dy: -1, ch: '*', role: 'body' },
      { dx: -2, dy: 0, ch: '-', role: 'body' },
      { dx: -1, dy: 0, ch: '*', role: 'body' },
      { dx: 0, dy: 0, ch: '+', role: 'shine' },
      { dx: 1, dy: 0, ch: '*', role: 'body' },
      { dx: 2, dy: 0, ch: '-', role: 'body' },
      { dx: -1, dy: 1, ch: '/', role: 'body' },
      { dx: 1, dy: 1, ch: '\\', role: 'body' },
    ],
    stocking: [
      { dx: 0, dy: -2, ch: '=', role: 'cuff' },
      { dx: 1, dy: -2, ch: '=', role: 'cuff' },
      { dx: 2, dy: -2, ch: '=', role: 'cuff' },
      { dx: 0, dy: -1, ch: '|', role: 'body' },
      { dx: 1, dy: -1, ch: '#', role: 'body' },
      { dx: 2, dy: -1, ch: '|', role: 'body' },
      { dx: 0, dy: 0, ch: '|', role: 'body' },
      { dx: 1, dy: 0, ch: '#', role: 'body' },
      { dx: 2, dy: 0, ch: '|', role: 'body' },
      { dx: -2, dy: 1, ch: '(', role: 'cuff' },
      { dx: -1, dy: 1, ch: '#', role: 'body' },
      { dx: 0, dy: 1, ch: '#', role: 'body' },
      { dx: 1, dy: 1, ch: '#', role: 'body' },
      { dx: 2, dy: 1, ch: '#', role: 'body' },
    ],
  };

  const SPHERE_PALETTES = [
    [255, 54, 76],
    [68, 184, 255],
    [255, 96, 178],
  ];

  const ornaments = [];
  const ORN_COUNT = 21;
  const ORN_TYPES = ['sphere', 'stocking', 'star'];
  const GOLDEN_ANGLE = 2.39996323;

  for (let i = 0; i < ORN_COUNT; i++) {
    const frac = i / (ORN_COUNT - 1);
    const h = 0.91 - frac * 0.70;
    const theta = i * GOLDEN_ANGLE + 0.55;
    const r = maxTreeRadiusAtH(h) + 0.05;
    const type = ORN_TYPES[i % ORN_TYPES.length];

    let bodyColor;
    if (type === 'sphere') {
      bodyColor = SPHERE_PALETTES[Math.floor(i / 3) % SPHERE_PALETTES.length];
    } else if (type === 'star') {
      bodyColor = [255, 214, 72];
    } else {
      bodyColor = [255, 44, 62];
    }

    const appearTime =
      TIMELINE.ORN_START + frac * (TIMELINE.ORN_END - TIMELINE.ORN_START);

    ornaments.push({
      type,
      h,
      r,
      theta,
      rowY: LAYOUT.TREE_TOP_ROW + h * treeHeightRows,
      appearTime,
      bodyColor,
      cuffColor: [242, 248, 255],
      shineColor: [255, 250, 220],
      twinklePhase: rng() * Math.PI * 2,
    });
  }

  // 8. Top Star (맨 위 별 + 빛줄기 — scaled cleanly for 106x142)
  const topStarCells = [
    { dx: 0, dy: 0, ch: '@', ring: 0, color: [255, 246, 182] },
    { dx: -1, dy: 0, ch: '*', ring: 1, color: [255, 228, 118] },
    { dx: 1, dy: 0, ch: '*', ring: 1, color: [255, 228, 118] },
    { dx: 0, dy: -1, ch: '*', ring: 1, color: [255, 228, 118] },
    { dx: 0, dy: 1, ch: '*', ring: 1, color: [255, 228, 118] },
    { dx: -2, dy: 0, ch: '+', ring: 2, color: [255, 206, 74] },
    { dx: 2, dy: 0, ch: '+', ring: 2, color: [255, 206, 74] },
    { dx: 0, dy: -2, ch: '|', ring: 2, color: [255, 206, 74] },
    { dx: 0, dy: 2, ch: '|', ring: 2, color: [255, 206, 74] },
    { dx: -1, dy: -1, ch: '\\', ring: 2, color: [255, 214, 88] },
    { dx: 1, dy: -1, ch: '/', ring: 2, color: [255, 214, 88] },
    { dx: -1, dy: 1, ch: '/', ring: 2, color: [255, 214, 88] },
    { dx: 1, dy: 1, ch: '\\', ring: 2, color: [255, 214, 88] },
    { dx: -3, dy: 0, ch: '-', ring: 3, color: [255, 184, 58] },
    { dx: 3, dy: 0, ch: '-', ring: 3, color: [255, 184, 58] },
    { dx: -4, dy: 0, ch: '-', ring: 3, color: [248, 174, 56] },
    { dx: 4, dy: 0, ch: '-', ring: 3, color: [248, 174, 56] },
    { dx: -5, dy: 0, ch: '·', ring: 3, color: [242, 168, 54] },
    { dx: 5, dy: 0, ch: '·', ring: 3, color: [242, 168, 54] },
    { dx: 0, dy: -3, ch: '|', ring: 3, color: [255, 184, 58] },
    { dx: 0, dy: -4, ch: '.', ring: 3, color: [242, 168, 54] },
    { dx: -2, dy: -2, ch: '·', ring: 3, color: [242, 168, 54] },
    { dx: 2, dy: -2, ch: '·', ring: 3, color: [242, 168, 54] },
    { dx: -2, dy: 2, ch: '·', ring: 3, color: [242, 168, 54] },
    { dx: 2, dy: 2, ch: '·', ring: 3, color: [242, 168, 54] },
  ];

  // =========================================================================
  // Single Unified Z-Buffered Terminal Grid Framebuffer
  // =========================================================================
  const GRID_SIZE = COLS * ROWS;
  const gridChar = new Array(GRID_SIZE);
  const gridR = new Float32Array(GRID_SIZE);
  const gridG = new Float32Array(GRID_SIZE);
  const gridB = new Float32Array(GRID_SIZE);
  const gridA = new Float32Array(GRID_SIZE);
  const gridZ = new Float32Array(GRID_SIZE);

  function clearGrid() {
    for (let i = 0; i < GRID_SIZE; i++) {
      gridChar[i] = '';
      gridZ[i] = -1e9;
      gridA[i] = 0;
    }
  }

  function plotCell(col, row, ch, r, g, b, a, z) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS || a <= 0.01) return;
    const idx = row * COLS + col;
    if (z >= gridZ[idx]) {
      gridZ[idx] = z;
      gridChar[idx] = ch;
      gridR[idx] = r;
      gridG[idx] = g;
      gridB[idx] = b;
      gridA[idx] = a;
    }
  }

  function overwriteBlankCell(col, row, z) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    const idx = row * COLS + col;
    if (z >= gridZ[idx]) {
      gridZ[idx] = z;
      gridChar[idx] = '';
      gridA[idx] = 0;
    }
  }

  // Plot 1x uniform-grid thick cursive greeting (white -> targetRgb)
  function plotCursiveGreeting(cells, startTime, endTime, t, targetRgb) {
    if (t < startTime || cells.length === 0) return;
    const span = Math.max(0.01, endTime - startTime);

    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const cellStart = startTime + c.progressX * (span * 0.78);
      const age = t - cellStart;
      if (age <= 0) continue;

      const rgb = whiteToColorStepped(targetRgb, age, 0.72, 5);
      const lum = 0.80 + 0.20 * c.cov;
      plotCell(c.col, c.row, c.ch, rgb[0], rgb[1], rgb[2], lum, 34.0);
    }
  }

  // =========================================================================
  // KST Countdown + Integrated Terminal Insert/Overwrite Typing
  // =========================================================================
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const ANNIVERSARY_UTC_MIDNIGHT = Date.UTC(2023, 5, 17); // 2023.06.17 (inclusive Day 1)
  let prevKstText = '';
  const digitFlashTimes = new Array(16).fill(-10);

  function getKstAnniversaryDays() {
    const nowKst = new Date(Date.now() + KST_OFFSET_MS);
    const todayKstMidnightUtc = Date.UTC(
      nowKst.getUTCFullYear(),
      nowKst.getUTCMonth(),
      nowKst.getUTCDate()
    );
    return Math.max(1, Math.floor((todayKstMidnightUtc - ANNIVERSARY_UTC_MIDNIGHT) / 86400000) + 1);
  }

  function build3RowDDayTokens(dDayCount) {
    const text = `JINBIN ♥ D+${dDayCount}`;
    const cols = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const glyph = DDAY_3ROW_FONT[ch];
      if (!glyph) continue;
      if (i > 0) {
        cols.push({ r0: ' ', r1: ' ', r2: ' ', isHeart: false });
      }
      const w = glyph[0].length;
      const isHeart = ch === '♥';
      for (let dx = 0; dx < w; dx++) {
        cols.push({
          r0: glyph[0][dx],
          r1: glyph[1][dx],
          r2: glyph[2][dx],
          isHeart,
        });
      }
    }
    return cols;
  }

  function getKstCountdown() {
    const nowUtcMs = Date.now();
    const nowKst = new Date(nowUtcMs + KST_OFFSET_MS);
    const kstYear = nowKst.getUTCFullYear();

    let targetUtcMs = Date.UTC(kstYear, 11, 25, 0, 0, 0) - KST_OFFSET_MS;
    const christmasEndUtcMs = Date.UTC(kstYear, 11, 26, 0, 0, 0) - KST_OFFSET_MS;

    if (nowUtcMs >= christmasEndUtcMs) {
      targetUtcMs = Date.UTC(kstYear + 1, 11, 25, 0, 0, 0) - KST_OFFSET_MS;
    }

    const diffMs = Math.max(0, targetUtcMs - nowUtcMs);
    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const dd = String(days).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');

    return {
      isChristmasDay: nowUtcMs >= targetUtcMs && nowUtcMs < christmasEndUtcMs,
      text: `${dd}:${hh}:${mm}:${ss}`,
    };
  }

  function build2RowCaptionLines(text) {
    let row0 = '';
    let row1 = '';
    for (let i = 0; i < text.length; i++) {
      const g = CAPTION_2ROW_FONT[text[i]];
      if (!g) continue;
      if (i > 0) {
        row0 += ' ';
        row1 += ' ';
      }
      row0 += g[0];
      row1 += g[1];
    }
    return [row0, row1];
  }

  const CAPTION_LINES_UNTIL = build2RowCaptionLines('KST · UNTIL CHRISTMAS');
  const CAPTION_LINES_MERRY = build2RowCaptionLines('KST · MERRY CHRISTMAS');

  function plotTerminalInsertCountdown(t) {
    if (t < TIMELINE.COUNTDOWN_CAPTION_START) return;

    const kst = getKstCountdown();
    const str = kst.text;

    if (prevKstText && prevKstText.length === str.length) {
      for (let i = 0; i < str.length; i++) {
        if (str[i] !== prevKstText[i]) {
          digitFlashTimes[i] = t;
        }
      }
    }
    prevKstText = str;

    const capLines = kst.isChristmasDay ? CAPTION_LINES_MERRY : CAPTION_LINES_UNTIL;
    const capWidth = capLines[0].length;
    const capStartCol = Math.round((COLS - capWidth) / 2);

    const boxLeft = LAYOUT.BOX_LEFT_COL;
    const boxRight = LAYOUT.BOX_RIGHT_COL;

    // --- Pass 1: 2-row ASCII 'KST · UNTIL CHRISTMAS' typed in terminal insert mode ---
    const capProg = ramp(t, TIMELINE.COUNTDOWN_CAPTION_START, TIMELINE.COUNTDOWN_CAPTION_END);
    const capSweepCols = Math.floor(capProg * capWidth);
    const capEndColLimit = capStartCol + capSweepCols;

    const capClearEnd = Math.min(boxRight, boxLeft + Math.floor(capProg * (boxRight - boxLeft + 1)));
    for (let col = boxLeft; col <= capClearEnd; col++) {
      overwriteBlankCell(col, LAYOUT.CAPTION_TOP_ROW - 1, 45.0);
      overwriteBlankCell(col, LAYOUT.CAPTION_TOP_ROW, 45.0);
      overwriteBlankCell(col, LAYOUT.CAPTION_TOP_ROW + 1, 45.0);
      overwriteBlankCell(col, LAYOUT.CAPTION_TOP_ROW + 2, 45.0);
    }

    const capTarget = [198, 218, 246];
    for (let dx = 0; dx < capSweepCols; dx++) {
      const colTime =
        TIMELINE.COUNTDOWN_CAPTION_START +
        (dx / Math.max(1, capWidth)) *
          (TIMELINE.COUNTDOWN_CAPTION_END - TIMELINE.COUNTDOWN_CAPTION_START);
      const rgb = whiteToColorStepped(capTarget, t - colTime, 0.45, 4);

      for (let rOff = 0; rOff < 2; rOff++) {
        const ch = capLines[rOff][dx];
        if (!ch || ch === ' ') continue;
        plotCell(capStartCol + dx, LAYOUT.CAPTION_TOP_ROW + rOff, ch, rgb[0], rgb[1], rgb[2], 0.94, 46.0);
      }
    }

    if (capProg < 1.0) {
      plotCell(capEndColLimit, LAYOUT.CAPTION_TOP_ROW, '█', 255, 255, 255, 1.0, 48.0);
      plotCell(capEndColLimit, LAYOUT.CAPTION_TOP_ROW + 1, '█', 255, 255, 255, 1.0, 48.0);
      return;
    }

    // --- Pass 2: 7-row ASCII DD:HH:MM:SS typed in terminal insert mode ---
    if (t < TIMELINE.COUNTDOWN_DIGITS_START) {
      if (Math.floor(t * 6) % 2 === 0) {
        plotCell(capStartCol, LAYOUT.COUNTDOWN_TOP_ROW, '█', 255, 255, 255, 0.95, 48.0);
      }
      return;
    }

    let totalW = 0;
    for (let i = 0; i < str.length; i++) {
      const g = DIGIT_7ROW_FONT[str[i]];
      if (!g) continue;
      totalW += g[0].length;
      if (i < str.length - 1) totalW += 2;
    }
    const digitStartCol = Math.round((COLS - totalW) / 2);
    const digitEndCol = digitStartCol + totalW - 1;

    const digProg = ramp(t, TIMELINE.COUNTDOWN_DIGITS_START, TIMELINE.COUNTDOWN_DIGITS_END);
    const totalBoxCols = boxRight - boxLeft + 1;
    const sweptCols = Math.floor(digProg * totalBoxCols);
    const overwriteLimitCol = Math.min(boxRight, boxLeft + sweptCols);

    for (let row = LAYOUT.COUNTDOWN_TOP_ROW - 1; row <= LAYOUT.COUNTDOWN_TOP_ROW + 7; row++) {
      for (let col = boxLeft; col <= overwriteLimitCol; col++) {
        overwriteBlankCell(col, row, 45.0);
      }
    }

    const digitTarget = [255, 228, 146];
    const colonTarget = [255, 76, 92];
    const colonBright = Math.floor(t * 2) % 2 === 0 ? 1.0 : 0.42;

    let curCol = digitStartCol;
    for (let i = 0; i < str.length; i++) {
      const chKey = str[i];
      const glyph = DIGIT_7ROW_FONT[chKey];
      if (!glyph) continue;
      const w = glyph[0].length;
      const isColon = chKey === ':';

      for (let dy = 0; dy < glyph.length; dy++) {
        const line = glyph[dy];
        for (let dx = 0; dx < w; dx++) {
          const cellCol = curCol + dx;
          if (cellCol > overwriteLimitCol) continue;
          const sym = line[dx];
          if (sym === '.') continue;

          const colFrac = clamp((cellCol - boxLeft) / totalBoxCols, 0, 1);
          const colBornTime =
            TIMELINE.COUNTDOWN_DIGITS_START +
            colFrac * (TIMELINE.COUNTDOWN_DIGITS_END - TIMELINE.COUNTDOWN_DIGITS_START);
          const age = t - colBornTime;

          const tickAge = t - digitFlashTimes[i];
          const isTickFlash = !isColon && digProg >= 1.0 && tickAge >= 0 && tickAge < 0.16;

          const rgb = isTickFlash
            ? [255, 255, 255]
            : whiteToColorStepped(isColon ? colonTarget : digitTarget, age, 0.48, 4);
          const alpha = isColon ? colonBright : 1.0;
          const drawCh = isColon ? '*' : (dx + dy) % 4 === 0 ? '@' : '#';

          plotCell(
            cellCol,
            LAYOUT.COUNTDOWN_TOP_ROW + dy,
            drawCh,
            rgb[0],
            rgb[1],
            rgb[2],
            alpha,
            46.0
          );
        }
      }

      curCol += w + 2;
    }

    if (digProg < 1.0) {
      const headCol = Math.min(boxRight, overwriteLimitCol + 1);
      for (let dy = 0; dy < 7; dy++) {
        plotCell(headCol, LAYOUT.COUNTDOWN_TOP_ROW + dy, '█', 255, 255, 255, 0.95, 48.0);
      }
      return;
    }

    // --- Pass 3: 3-row ASCII 'JINBIN ♥ D+XXXX' (only shown when secretState === 1) ---
    if (secretState !== 1) {
      if (Math.floor(t * 2.2) % 2 === 0) {
        plotCell(digitEndCol + 2, LAYOUT.COUNTDOWN_TOP_ROW + 6, '█', 255, 232, 168, 0.9, 48.0);
      }
      return;
    }

    if (t < TIMELINE.DDAY_START) {
      if (Math.floor(t * 6) % 2 === 0) {
        plotCell(digitEndCol + 2, LAYOUT.COUNTDOWN_TOP_ROW + 6, '█', 255, 232, 168, 0.9, 48.0);
      }
      return;
    }

    const dDayCount = getKstAnniversaryDays();
    const dDayCols = build3RowDDayTokens(dDayCount);
    const dDayWidth = dDayCols.length;
    const dDayStartCol = Math.round((COLS - dDayWidth) / 2);
    const dDayEndCol = dDayStartCol + dDayWidth - 1;

    const dDayProg = ramp(t, TIMELINE.DDAY_START, TIMELINE.DDAY_END);
    const dDaySweepCols = Math.floor(dDayProg * dDayWidth);

    const dDayClearEnd = Math.min(boxRight, boxLeft + Math.floor(dDayProg * (boxRight - boxLeft + 1)));
    for (let row = LAYOUT.DDAY_TOP_ROW - 1; row <= LAYOUT.DDAY_TOP_ROW + 3; row++) {
      for (let col = boxLeft; col <= dDayClearEnd; col++) {
        overwriteBlankCell(col, row, 45.0);
      }
    }

    const textTarget = [255, 214, 228]; // warm soft rose-white
    const heartTarget = [255, 52, 92];  // glowing festive crimson-pink heart
    const heartPulse = 0.84 + 0.16 * Math.sin(t * 3.4);

    for (let dx = 0; dx < dDaySweepCols; dx++) {
      const colData = dDayCols[dx];
      const colTime =
        TIMELINE.DDAY_START +
        (dx / Math.max(1, dDayWidth)) * (TIMELINE.DDAY_END - TIMELINE.DDAY_START);
      const age = t - colTime;
      const rgb = whiteToColorStepped(colData.isHeart ? heartTarget : textTarget, age, 0.45, 4);
      const alpha = colData.isHeart ? heartPulse : 0.95;

      const rows = [colData.r0, colData.r1, colData.r2];
      for (let rOff = 0; rOff < 3; rOff++) {
        const ch = rows[rOff];
        if (!ch || ch === ' ') continue;
        plotCell(
          dDayStartCol + dx,
          LAYOUT.DDAY_TOP_ROW + rOff,
          ch,
          rgb[0],
          rgb[1],
          rgb[2],
          alpha,
          46.0
        );
      }
    }

    if (dDayProg < 1.0) {
      const headCol = dDayStartCol + dDaySweepCols;
      for (let rOff = 0; rOff < 3; rOff++) {
        plotCell(headCol, LAYOUT.DDAY_TOP_ROW + rOff, '█', 255, 255, 255, 0.95, 48.0);
      }
    } else if (Math.floor(t * 2.2) % 2 === 0) {
      plotCell(dDayEndCol + 2, LAYOUT.DDAY_TOP_ROW + 2, '█', 255, 214, 228, 0.88, 48.0);
    }
  }

  // =========================================================================
  // Web Audio API Retro Chiptune & BIOS Beep Synthesizer (100% Public Domain)
  // Song: "We Wish You a Merry Christmas" (Traditional 16th-century carol)
  // =========================================================================
  const soundBtn = document.getElementById('soundBtn');
  const BEAT_SEC = 60 / 132; // 132 BPM 3/4 waltz (~21.8s full loop)
  const SONG_LOOP_BEATS = 48;

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // [startBeat, durationBeats, midiNote]
  const CAROL_MELODY = [
    // Pickup
    [0, 0.95, 62],
    // Bar 1-2: We wish you a merry Christmas, we
    [1, 0.92, 67], [2, 0.46, 67], [2.5, 0.46, 69], [3, 0.46, 67], [3.5, 0.46, 66],
    [4, 0.92, 64], [5, 0.92, 64], [6, 0.92, 64],
    // Bar 3-4: wish you a merry Christmas, we
    [7, 0.92, 69], [8, 0.46, 69], [8.5, 0.46, 71], [9, 0.46, 69], [9.5, 0.46, 67],
    [10, 0.92, 66], [11, 0.92, 62], [12, 0.92, 62],
    // Bar 5-6: wish you a merry Christmas and a
    [13, 0.92, 71], [14, 0.46, 71], [14.5, 0.46, 72], [15, 0.46, 71], [15.5, 0.46, 69],
    [16, 0.92, 67], [17, 0.92, 64], [18, 0.46, 62], [18.5, 0.46, 62],
    // Bar 7-8: happy new year! Good
    [19, 0.92, 64], [20, 0.92, 69], [21, 0.92, 66],
    [22, 1.85, 67], [24, 0.92, 62],
    // Bar 9-10: tidings we bring to
    [25, 0.92, 67], [26, 0.92, 67], [27, 0.92, 67],
    [28, 1.85, 66], [30, 0.92, 66],
    // Bar 11-12: you and your kin; Good
    [31, 0.92, 67], [32, 0.92, 66], [33, 0.92, 64],
    [34, 1.85, 62], [36, 0.92, 69],
    // Bar 13-14: tidings for Christmas and a
    [37, 0.92, 71], [38, 0.92, 69], [39, 0.92, 67],
    [40, 0.92, 74], [41, 0.92, 62], [42, 0.46, 62], [42.5, 0.46, 62],
    // Bar 15-16: happy new year!
    [43, 0.92, 64], [44, 0.92, 69], [45, 0.92, 66],
    [46, 1.9, 67],
  ];

  // Warm 3/4 waltz bass & music-box accompaniment [beat, dur, midi, role]
  const CAROL_ACCOMP = [
    // Bar 1 (G)
    [1, 0.9, 43, 'bass'], [2, 0.4, 59, 'chime'], [3, 0.4, 62, 'chime'],
    // Bar 2 (C)
    [4, 0.9, 48, 'bass'], [5, 0.4, 55, 'chime'], [6, 0.4, 60, 'chime'],
    // Bar 3 (A7)
    [7, 0.9, 45, 'bass'], [8, 0.4, 55, 'chime'], [9, 0.4, 61, 'chime'],
    // Bar 4 (D)
    [10, 0.9, 50, 'bass'], [11, 0.4, 54, 'chime'], [12, 0.4, 57, 'chime'],
    // Bar 5 (B7)
    [13, 0.9, 47, 'bass'], [14, 0.4, 57, 'chime'], [15, 0.4, 63, 'chime'],
    // Bar 6 (Em)
    [16, 0.9, 52, 'bass'], [17, 0.4, 55, 'chime'], [18, 0.4, 59, 'chime'],
    // Bar 7 (C - A7 - D7)
    [19, 0.9, 48, 'bass'], [20, 0.9, 45, 'bass'], [21, 0.9, 50, 'bass'],
    // Bar 8 (G)
    [22, 1.5, 43, 'bass'], [23, 0.5, 59, 'chime'],
    // Bar 9 (G)
    [25, 0.9, 43, 'bass'], [26, 0.4, 55, 'chime'], [27, 0.4, 59, 'chime'],
    // Bar 10 (D)
    [28, 0.9, 50, 'bass'], [29, 0.4, 54, 'chime'], [30, 0.4, 57, 'chime'],
    // Bar 11 (Em - A7)
    [31, 0.9, 52, 'bass'], [32, 0.9, 45, 'bass'], [33, 0.4, 61, 'chime'],
    // Bar 12 (D)
    [34, 1.5, 50, 'bass'], [35, 0.5, 57, 'chime'],
    // Bar 13 (G)
    [37, 0.9, 43, 'bass'], [38, 0.4, 55, 'chime'], [39, 0.4, 59, 'chime'],
    // Bar 14 (D7)
    [40, 0.9, 50, 'bass'], [41, 0.4, 54, 'chime'], [42, 0.4, 60, 'chime'],
    // Bar 15 (C - A7 - D7)
    [43, 0.9, 48, 'bass'], [44, 0.9, 45, 'bass'], [45, 0.9, 50, 'bass'],
    // Bar 16 (G)
    [46, 1.8, 43, 'bass'], [47, 0.6, 59, 'chime'],
  ];

  let audioCtx = null;
  let masterGain = null;
  let leadFilter = null;
  let userMuted = false; // user's explicit mute choice
  let audioUnlocked = false;

  // Audio playback state trackers
  let lastBootSoundLine = -1;
  let bootOkSoundPlayed = false;
  let prevSongTotalBeat = -0.001;

  function ensureAudioContext() {
    if (audioCtx) return audioCtx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    audioCtx = new AudioCtx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.22;
    masterGain.connect(audioCtx.destination);

    // Gentle low-pass filter warms up retro square wave so it sounds cozy, never harsh
    leadFilter = audioCtx.createBiquadFilter();
    leadFilter.type = 'lowpass';
    leadFilter.frequency.value = 2150;
    leadFilter.Q.value = 0.8;
    leadFilter.connect(masterGain);

    return audioCtx;
  }

  function updateSoundButtonUI() {
    const isAudible = !userMuted && audioUnlocked && audioCtx && audioCtx.state === 'running';
    soundBtn.classList.toggle('muted', !isAudible);
    soundBtn.classList.toggle('needs-unlock', !userMuted && !isAudible);
    soundBtn.setAttribute('aria-label', isAudible ? '소리 끄기' : '소리 켜기');
  }

  function applyMasterMuteState() {
    if (!audioCtx || !masterGain) return;
    const now = audioCtx.currentTime;
    const target = userMuted || document.hidden ? 0.0 : 0.22;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(target, now, 0.025);
    updateSoundButtonUI();
  }

  function tryUnlockAudio() {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'running') {
      audioUnlocked = true;
      applyMasterMuteState();
      return;
    }
    ctx
      .resume()
      .then(() => {
        audioUnlocked = ctx.state === 'running';
        applyMasterMuteState();
      })
      .catch(() => {
        updateSoundButtonUI();
      });
  }

  function canPlaySound() {
    return !userMuted && !document.hidden && audioCtx && audioCtx.state === 'running';
  }

  function playBeep(freq, durSec, volume, waveType = 'square', useFilter = true) {
    if (!canPlaySound()) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, now);

    // Crisp retro chiptune envelope (no click on attack/release)
    const attack = Math.min(0.01, durSec * 0.15);
    const release = Math.min(0.06, durSec * 0.35);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.55), now + Math.max(attack + 0.01, durSec - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durSec + 0.02);

    osc.connect(gain);
    gain.connect(useFilter && leadFilter ? leadFilter : masterGain);

    osc.start(now);
    osc.stop(now + durSec + 0.03);
  }

  function playBootOkChime() {
    if (!canPlaySound()) return;
    const now = audioCtx.currentTime;
    const notes = [
      { f: 659.25, offset: 0.0, dur: 0.07 },
      { f: 987.77, offset: 0.075, dur: 0.11 },
    ];
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, now + n.offset);
      g.gain.setValueAtTime(0.0001, now + n.offset);
      g.gain.linearRampToValueAtTime(0.16, now + n.offset + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.offset + n.dur);
      osc.connect(g);
      g.connect(leadFilter || masterGain);
      osc.start(now + n.offset);
      osc.stop(now + n.offset + n.dur + 0.02);
    }
  }

  function resetAudioState() {
    lastBootSoundLine = -1;
    bootOkSoundPlayed = false;
    prevSongTotalBeat = -0.001;
  }

  function updateAudio(elapsed) {
    if (!canPlaySound()) return;

    // 1. Boot screen retro BIOS beep & line ticks
    if (elapsed < BOOT_HOLD_END) {
      for (let i = lastBootSoundLine + 1; i < bootLines.length; i++) {
        if (elapsed >= bootLines[i].at) {
          lastBootSoundLine = i;
          if (i === 0) {
            playBeep(880, 0.075, 0.16, 'square', true); // Classic BIOS POST beep
          } else {
            const tickFreq = bootLines[i].tone === 'dim' ? 740 : 1180;
            playBeep(tickFreq, 0.018, 0.055, 'square', true);
          }
        } else {
          break;
        }
      }
      const lastLine = bootLines[bootLines.length - 1];
      if (!bootOkSoundPlayed && lastLine && lastLine.okAt !== undefined && elapsed >= lastLine.okAt) {
        bootOkSoundPlayed = true;
        playBootOkChime();
      }
      return;
    }

    // 2. Hard cut silence window
    if (elapsed < BOOT_CUT_END) return;

    // 3. Main sequence: looping "We Wish You a Merry Christmas" chiptune
    const songT = elapsed - BOOT_CUT_END;
    const totalBeat = songT / BEAT_SEC;

    // Guard against huge frame jumps (e.g. tab switch)
    if (totalBeat - prevSongTotalBeat > 1.5) {
      prevSongTotalBeat = totalBeat - 0.01;
    }
    if (totalBeat <= prevSongTotalBeat) return;

    const prevLoop = Math.floor(Math.max(0, prevSongTotalBeat) / SONG_LOOP_BEATS);
    const currLoop = Math.floor(totalBeat / SONG_LOOP_BEATS);

    for (let loop = prevLoop; loop <= currLoop; loop++) {
      const base = loop * SONG_LOOP_BEATS;

      // Lead melody (retro square beep)
      for (let i = 0; i < CAROL_MELODY.length; i++) {
        const ev = CAROL_MELODY[i];
        const beatPos = base + ev[0];
        if (beatPos > prevSongTotalBeat && beatPos <= totalBeat) {
          playBeep(midiToFreq(ev[2]), ev[1] * BEAT_SEC, 0.24, 'square', true);
        }
      }

      // Accompaniment (warm triangle bass + soft music-box bell chimes)
      for (let i = 0; i < CAROL_ACCOMP.length; i++) {
        const ev = CAROL_ACCOMP[i];
        const beatPos = base + ev[0];
        if (beatPos > prevSongTotalBeat && beatPos <= totalBeat) {
          if (ev[3] === 'bass') {
            playBeep(midiToFreq(ev[2]), ev[1] * BEAT_SEC, 0.22, 'triangle', false);
          } else {
            playBeep(midiToFreq(ev[2] + 12), ev[1] * BEAT_SEC, 0.065, 'sine', false);
          }
        }
      }
    }

    prevSongTotalBeat = totalBeat;
  }

  // Sound toggle button
  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isCurrentlyAudible = !userMuted && audioUnlocked && audioCtx && audioCtx.state === 'running';
    if (isCurrentlyAudible) {
      userMuted = true;
      applyMasterMuteState();
    } else {
      userMuted = false;
      tryUnlockAudio();
    }
  });

  document.addEventListener('visibilitychange', () => {
    applyMasterMuteState();
  });

  // =========================================================================
  // High-Resolution Canvas (1080x2316+ backing resolution) & Bloom Pipeline
  // =========================================================================
  const stageCanvas = document.getElementById('stage');
  const stageCtx = stageCanvas.getContext('2d', { alpha: false });
  const stageFrame = document.getElementById('stageFrame');
  const replayBtn = document.getElementById('replayBtn');

  // Unlock WebAudio cleanly on first user tap anywhere on the canvas (mobile autoplay policy)
  stageCanvas.addEventListener('pointerdown', () => {
    if (!userMuted && (!audioUnlocked || (audioCtx && audioCtx.state !== 'running'))) {
      tryUnlockAudio();
    }
  });

  // =========================================================================
  // Secret Code Modal (Tree screen tap -> Enter 4-digit code '0522' -> Reboot)
  // =========================================================================
  const codeOverlay = document.getElementById('codeOverlay');
  const codeModal = document.getElementById('codeModal');
  const codeCloseBtn = document.getElementById('codeCloseBtn');
  const codeSlotsWrap = document.getElementById('codeSlotsWrap');
  const codeSlotsEl = document.getElementById('codeSlots');
  const codeSlotNodes = Array.from(codeSlotsEl.querySelectorAll('.code-slot'));
  const codeInput = document.getElementById('codeInput');
  const codeStatus = document.getElementById('codeStatus');

  let codeModalOpen = false;
  let codeSubmitting = false;
  let codeFeedbackTimer = null;
  let prevCodeLen = 0;

  function playSecretUnlockChime() {
    if (!canPlaySound()) return;
    const now = audioCtx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    for (let i = 0; i < freqs.length; i++) {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'square';
      const start = now + i * 0.065;
      osc.frequency.setValueAtTime(freqs[i], start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.16, start + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
      osc.connect(g);
      g.connect(leadFilter || masterGain);
      osc.start(start);
      osc.stop(start + 0.16);
    }
  }

  function renderCodeSlots(value) {
    for (let i = 0; i < 4; i++) {
      const node = codeSlotNodes[i];
      const digit = value[i];
      node.textContent = digit !== undefined ? digit : '_';
      node.classList.toggle('filled', digit !== undefined);
      node.classList.toggle('active', !codeSubmitting && i === value.length);
    }
  }

  function clearCodeVisualState() {
    if (codeFeedbackTimer) {
      clearTimeout(codeFeedbackTimer);
      codeFeedbackTimer = null;
    }
    codeSubmitting = false;
    codeSlotsEl.classList.remove('error', 'success', 'shake');
    codeStatus.classList.remove('error', 'success');
    codeStatus.textContent = '';
  }

  function openCodeModal() {
    if (codeModalOpen) return;
    codeModalOpen = true;
    clearCodeVisualState();
    codeInput.value = '';
    prevCodeLen = 0;
    renderCodeSlots('');
    codeOverlay.classList.add('open');
    codeOverlay.setAttribute('aria-hidden', 'false');
    codeInput.focus();
  }

  function closeCodeModal() {
    if (!codeModalOpen) return;
    codeModalOpen = false;
    clearCodeVisualState();
    codeInput.value = '';
    prevCodeLen = 0;
    renderCodeSlots('');
    codeInput.blur();
    codeOverlay.classList.remove('open');
    codeOverlay.setAttribute('aria-hidden', 'true');
  }

  // Open popup when tapping the tree screen (after boot screen finishes)
  stageCanvas.addEventListener('click', () => {
    if (secretState === 1 || codeModalOpen) return;
    const elapsed = (performance.now() - startTimeMs) / 1000;
    if (elapsed < BOOT_CUT_END) return;
    openCodeModal();
  });

  codeCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCodeModal();
  });

  codeOverlay.addEventListener('click', (e) => {
    if (e.target === codeOverlay) {
      closeCodeModal();
    }
  });

  codeModal.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  codeSlotsWrap.addEventListener('click', () => {
    if (!codeSubmitting) codeInput.focus();
  });

  document.addEventListener('keydown', (e) => {
    if (codeModalOpen && e.key === 'Escape') {
      closeCodeModal();
    }
  });

  codeInput.addEventListener('input', () => {
    if (codeSubmitting) {
      codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 4);
      return;
    }
    const digits = codeInput.value.replace(/\D/g, '').slice(0, 4);
    if (codeInput.value !== digits) codeInput.value = digits;

    if (digits.length > prevCodeLen) {
      playBeep(1120, 0.018, 0.08, 'square', true);
    }
    prevCodeLen = digits.length;

    codeSlotsEl.classList.remove('error', 'shake');
    codeStatus.classList.remove('error');
    codeStatus.textContent = '';
    renderCodeSlots(digits);

    if (digits.length === 4) {
      codeSubmitting = true;
      renderCodeSlots(digits);

      if (digits === SECRET_CODE) {
        codeSlotsEl.classList.add('success');
        codeStatus.classList.add('success');
        codeStatus.textContent = 'ACCESS GRANTED';
        playSecretUnlockChime();
        codeFeedbackTimer = setTimeout(() => {
          secretState = 1;
          closeCodeModal();
          resetAnimation(false);
        }, 380);
      } else {
        codeSlotsEl.classList.add('error', 'shake');
        codeStatus.classList.add('error');
        codeStatus.textContent = 'INVALID CODE';
        playBeep(210, 0.12, 0.14, 'square', true);
        codeFeedbackTimer = setTimeout(() => {
          clearCodeVisualState();
          codeInput.value = '';
          prevCodeLen = 0;
          renderCodeSlots('');
          if (codeModalOpen) codeInput.focus();
        }, 520);
      }
    }
  });

  const sharpCanvas = document.createElement('canvas');
  const sharpCtx = sharpCanvas.getContext('2d');
  const bloomCanvasA = document.createElement('canvas');
  const bloomCtxA = bloomCanvasA.getContext('2d');
  const bloomCanvasB = document.createElement('canvas');
  const bloomCtxB = bloomCanvasB.getContext('2d');

  let renderW = BASE_WIDTH;
  let renderH = BASE_HEIGHT;
  let cellW = renderW / COLS;
  let cellH = renderH / ROWS;
  let gridFontPx = Math.min(cellH * 1.08, cellW / 0.54);

  function resize() {
    const rect = stageFrame.getBoundingClientRect();
    const cssW = Math.max(240, rect.width);
    const cssH = Math.max(400, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    const nativeW = Math.round(cssW * dpr);
    const nativeH = Math.round(cssH * dpr);
    const scaleToBase = Math.max(1, BASE_WIDTH / nativeW, BASE_HEIGHT / nativeH);
    const cappedW = Math.min(1440, Math.round(nativeW * scaleToBase));
    const aspect = cssH / cssW;
    renderW = Math.max(BASE_WIDTH, cappedW);
    renderH = Math.round(renderW * aspect);

    stageCanvas.width = renderW;
    stageCanvas.height = renderH;
    stageCtx.setTransform(1, 0, 0, 1, 0, 0);

    sharpCanvas.width = renderW;
    sharpCanvas.height = renderH;
    sharpCtx.setTransform(1, 0, 0, 1, 0, 0);

    bloomCanvasA.width = Math.max(120, Math.round(renderW * 0.24));
    bloomCanvasA.height = Math.max(240, Math.round(renderH * 0.24));
    bloomCanvasB.width = Math.max(60, Math.round(renderW * 0.10));
    bloomCanvasB.height = Math.max(120, Math.round(renderH * 0.10));

    cellW = renderW / COLS;
    cellH = renderH / ROWS;
    gridFontPx = Math.min(cellH * 1.08, cellW / 0.54);
  }

  window.addEventListener('resize', resize);
  resize();

  // =========================================================================
  // Main Frame Simulation & Render (100% Single Unified Terminal Grid)
  // =========================================================================
  let startTimeMs = performance.now();
  let spinTimer = null;

  function resetAnimation(withSpin = false) {
    startTimeMs = performance.now();
    bootLines = createBootLines(Date.now());
    prevKstText = '';
    digitFlashTimes.fill(-10);
    resetAudioState();
    if (withSpin) {
      if (!userMuted) tryUnlockAudio();
      replayBtn.classList.remove('spinning');
      void replayBtn.offsetWidth;
      replayBtn.classList.add('spinning');
      if (spinTimer) clearTimeout(spinTimer);
      spinTimer = setTimeout(() => replayBtn.classList.remove('spinning'), 480);
    }
  }

  replayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeCodeModal();
    resetAnimation(true);
  });

  function render(nowMs) {
    const elapsed = (nowMs - startTimeMs) / 1000;
    updateAudio(elapsed);

    // Phase 0: Retro green-on-black terminal boot screen -> hard cut to black
    if (elapsed < BOOT_CUT_END) {
      renderBootScreen(elapsed);
      requestAnimationFrame(render);
      return;
    }

    const t = elapsed - BOOT_CUT_END;
    const rot = t * ROT_SPEED;

    // --- 1. Populate Single Unified Z-Buffered Terminal Grid ---
    clearGrid();

    // 1A. Subtle background stars
    for (let i = 0; i < bgStars.length; i++) {
      const st = bgStars[i];
      const tw = 0.65 + 0.35 * Math.sin(t * st.speed + st.phase);
      plotCell(st.col, st.row, st.ch, 155, 182, 222, st.baseAlpha * tw, -100);
    }

    // 1B. Dense, Slow Falling Snowflakes inside the SAME terminal grid
    const snowCycleRows = ROWS + 10;
    for (let i = 0; i < snowflakes.length; i++) {
      const s = snowflakes[i];
      const age = t - s.bornAt;
      if (age <= 0) continue;

      const rawRow = s.row0 + s.vyRows * age;
      if (rawRow < 0) continue;
      const wrappedRow = ((rawRow % snowCycleRows) + snowCycleRows) % snowCycleRows - 2;
      const row = Math.round(wrappedRow);
      if (row < 0 || row >= ROWS) continue;

      const bottomFade = row > 116 ? clamp(1 - (row - 116) / 18, 0, 1) : 1;
      if (bottomFade <= 0.02) continue;

      const swayCol = s.col0 + Math.sin(age * s.swayFreq + s.phase) * s.swayCols;
      const col = Math.floor(((swayCol % COLS) + COLS) % COLS);

      const twinkle = 0.80 + 0.20 * Math.sin(t * 2.5 + s.twinklePhase);
      const rgb = whiteToColor(s.targetColor, age, 0.9);
      const alpha = s.baseAlpha * twinkle * bottomFade;
      // Near snow (z=38) passes IN FRONT OF Merry/christmas (z=34) & tree;
      // Mid snow (z=25) passes in front of tree; far snow (z=-50) behind everything.
      const z = s.snowLayer === 2 ? 38.0 : s.snowLayer === 1 ? 25.0 : -50.0;

      plotCell(col, row, s.ch, rgb[0], rgb[1], rgb[2], alpha, z);
    }

    // 1C. Large, Dense Circular Snow Ground Accumulation
    const treeGlowPresence = easeOutCubic(ramp(t, TIMELINE.TIER_WINDOWS[3][0], TIMELINE.GARLAND_END));
    for (let i = 0; i < groundPoints.length; i++) {
      const gp = groundPoints[i];
      const age = t - gp.appearTime;
      if (age <= 0) continue;

      const fade = easeOutCubic(clamp(age / 0.35, 0, 1));
      const rgb = whiteToColor(gp.targetColor, age, 0.9);
      const shimmer = 0.90 + 0.10 * Math.sin(t * 2.0 + gp.twinklePhase);

      let r = rgb[0];
      let g = rgb[1];
      let b = rgb[2];
      if (gp.rad < 0.60 && treeGlowPresence > 0) {
        const bounce = (1 - gp.rad / 0.60) * 0.16 * treeGlowPresence;
        g = Math.min(255, g + 34 * bounce);
        r = Math.min(255, r + 18 * bounce);
      }

      const z = gp.ny * 0.35 - 0.12;
      plotCell(gp.col, gp.row, gp.ch, r, g, b, gp.baseAlpha * fade * shimmer, z);
    }

    // 1D. Rotating Tree Trunk (밑둥)
    if (t >= TIMELINE.TRUNK_START) {
      for (let i = 0; i < trunkPoints.length; i++) {
        const tp = trunkPoints[i];
        const age = t - tp.appearTime;
        if (age <= 0) continue;

        const worldTheta = tp.theta + rot;
        const cosT = Math.cos(worldTheta);
        const sinT = Math.sin(worldTheta);
        const x = tp.r * sinT;
        const z = tp.r * cosT;

        if (z < -tp.r * 0.25) continue;

        const col = Math.round(LAYOUT.CENTER_COL + x * LAYOUT.TREE_SCALE_X);
        const row = Math.round(tp.rowY);

        const light = clamp(0.42 + 0.58 * (sinT * -0.45 + cosT * 0.89), 0.25, 1.0) * tp.shadeJitter;
        const targetRgb = [
          clamp(158 * light, 42, 180),
          clamp(98 * light, 26, 120),
          clamp(54 * light, 14, 72),
        ];

        const rgb = whiteToColor(targetRgb, age, 0.78);
        const fade = easeOutCubic(clamp(age / 0.22, 0, 1));
        plotCell(col, row, tp.ch, rgb[0], rgb[1], rgb[2], fade, z);
      }
    }

    // 1E. Rotating 4-Tier Tree Foliage
    if (t >= TIMELINE.TIER_WINDOWS[3][0]) {
      for (let i = 0; i < treePoints.length; i++) {
        const pt = treePoints[i];
        const age = t - pt.appearTime;
        if (age <= 0) continue;

        const worldTheta = pt.theta + rot;
        const sinT = Math.sin(worldTheta);
        const cosT = Math.cos(worldTheta);

        const x = pt.r * sinT;
        const z = pt.r * cosT;
        const persp = 1 + z * 0.14;

        const col = Math.round(LAYOUT.CENTER_COL + x * LAYOUT.TREE_SCALE_X * persp);
        const row = Math.round(pt.rowY + z * 1.7);

        const diffuse = clamp(sinT * -0.42 + cosT * 0.86 + 0.14, 0, 1);
        const rim = Math.pow(1 - Math.abs(cosT), 2.2) * (cosT > -0.25 ? 0.26 : 0.06);
        const depthShade = z >= 0 ? 0.52 + 0.48 * diffuse + rim : 0.24 + 0.18 * (1 + z);
        const shade = clamp(depthShade * pt.overhangShadow * pt.skirtBoost, 0.16, 1.18);

        const targetRgb = [
          clamp(pt.baseColor[0] * shade, 10, 225),
          clamp(pt.baseColor[1] * shade, 28, 255),
          clamp(pt.baseColor[2] * shade, 14, 210),
        ];

        const rgb = whiteToColor(targetRgb, age, 0.88);
        const fade = easeOutCubic(clamp(age / 0.22, 0, 1));
        const alpha = (z >= -0.05 ? 0.96 : 0.42) * fade;

        plotCell(col, row, pt.ch, rgb[0], rgb[1], rgb[2], alpha, z);
      }
    }

    // 1F. Rotating Spiral String Garland (줄 형태 오너먼트)
    if (t >= TIMELINE.GARLAND_START) {
      for (let i = 0; i < garlandPoints.length; i++) {
        const gp = garlandPoints[i];
        const age = t - gp.appearTime;
        if (age <= 0) continue;

        const worldTheta = gp.theta + rot;
        const sinT = Math.sin(worldTheta);
        const cosT = Math.cos(worldTheta);
        const x = gp.r * sinT;
        const z = gp.r * cosT;

        if (cosT < -0.14) continue;

        const persp = 1 + z * 0.14;
        const col = Math.round(LAYOUT.CENTER_COL + x * LAYOUT.TREE_SCALE_X * persp);
        const row = Math.round(gp.rowY + z * 1.7);

        const edgeSoft = clamp((cosT + 0.14) / 0.26, 0, 1);
        const twinkle = gp.isBulb
          ? 0.78 + 0.22 * Math.sin(t * 4.5 + gp.twinklePhase)
          : 0.86 + 0.14 * Math.sin(t * 2.6 + gp.twinklePhase);

        const rgb = whiteToColor(gp.targetColor, age, 0.75);
        const fade = easeOutCubic(clamp(age / 0.18, 0, 1));
        const alpha = fade * edgeSoft * twinkle;

        plotCell(col, row, gp.ch, rgb[0], rgb[1], rgb[2], alpha, z + 0.08);
      }
    }

    // 1G. Rotating Sphere / Star / Stocking Ornaments (구/별/양말)
    if (t >= TIMELINE.ORN_START) {
      for (let i = 0; i < ornaments.length; i++) {
        const orn = ornaments[i];
        const age = t - orn.appearTime;
        if (age <= 0) continue;

        const worldTheta = orn.theta + rot;
        const sinT = Math.sin(worldTheta);
        const cosT = Math.cos(worldTheta);

        if (cosT < -0.05) continue;

        const x = orn.r * sinT;
        const z = orn.r * cosT;
        const persp = 1 + z * 0.14;

        const centerCol = Math.round(LAYOUT.CENTER_COL + x * LAYOUT.TREE_SCALE_X * persp);
        const centerRow = Math.round(orn.rowY + z * 1.7);

        const edgeFade = clamp((cosT + 0.05) / 0.25, 0, 1);
        const popFade = easeOutCubic(clamp(age / 0.24, 0, 1));
        const twinkle = 0.88 + 0.12 * Math.sin(t * 3.4 + orn.twinklePhase);
        const alpha = edgeFade * popFade * twinkle;

        const sprite = ORNAMENT_SPRITES[orn.type];
        for (let s = 0; s < sprite.length; s++) {
          const cell = sprite[s];
          let target;
          if (cell.role === 'cuff') target = orn.cuffColor;
          else if (cell.role === 'shine') target = orn.shineColor;
          else target = orn.bodyColor;

          const rgb = whiteToColor(target, age, 0.8);
          plotCell(
            centerCol + cell.dx,
            centerRow + cell.dy,
            cell.ch,
            rgb[0],
            rgb[1],
            rgb[2],
            alpha,
            z + 0.35
          );
        }
      }
    }

    // 1H. Top Star + Shimmering Rays (맨 위 별)
    if (t >= TIMELINE.STAR_START) {
      const starBaseAge = t - TIMELINE.STAR_START;
      const starCol = Math.round(LAYOUT.CENTER_COL);
      const starRow = Math.round(LAYOUT.STAR_ROW);

      for (let i = 0; i < topStarCells.length; i++) {
        const sc = topStarCells[i];
        const ringDelay = sc.ring * 0.16;
        const age = starBaseAge - ringDelay;
        if (age <= 0) continue;

        const fade = easeOutCubic(clamp(age / 0.28, 0, 1));
        const rgb = whiteToColor(sc.color, age, 0.95);
        const rayPulse =
          sc.ring === 0
            ? 1.0
            : sc.ring === 3
              ? 0.55 + 0.45 * Math.sin(t * 4.2 + i * 0.9)
              : 0.82 + 0.18 * Math.sin(t * 3.1 + sc.ring);

        plotCell(
          starCol + sc.dx,
          starRow + sc.dy,
          sc.ch,
          rgb[0],
          rgb[1],
          rgb[2],
          fade * rayPulse,
          28.0
        );
      }
    }

    // 1I. Bold Cursive ASCII 'Merry' (GREEN, left) & 'christmas' (RED, right) on SAME 1x grid!
    plotCursiveGreeting(merryAsciiCells, TIMELINE.MERRY_START, TIMELINE.MERRY_END, t, [56, 226, 114]);
    plotCursiveGreeting(christmasAsciiCells, TIMELINE.CHRISTMAS_START, TIMELINE.CHRISTMAS_END, t, [255, 42, 64]);

    // 1J. Integrated Terminal Insert/Overwrite KST Countdown BELOW snow mound!
    plotTerminalInsertCountdown(t);

    // --- 2. Render ONE Single Uniform Terminal Grid (ONE Font Size Everywhere!) ---
    sharpCtx.clearRect(0, 0, renderW, renderH);
    sharpCtx.textAlign = 'center';
    sharpCtx.textBaseline = 'middle';

    const mainFont = `700 ${gridFontPx.toFixed(1)}px ${FONT_FAMILY}`;
    sharpCtx.font = mainFont;

    for (let row = 0; row < ROWS; row++) {
      const py = (row + 0.5) * cellH;
      const rowOffset = row * COLS;
      for (let col = 0; col < COLS; col++) {
        const idx = rowOffset + col;
        const ch = gridChar[idx];
        if (!ch) continue;
        const a = gridA[idx];
        if (a <= 0.01) continue;

        const px = (col + 0.5) * cellW;
        sharpCtx.fillStyle = `rgba(${gridR[idx] | 0}, ${gridG[idx] | 0}, ${gridB[idx] | 0}, ${a.toFixed(3)})`;
        sharpCtx.fillText(ch, px, py);
      }
    }

    // --- 3. Composite Final Frame + Phosphor Bloom ---
    const bgGrad = stageCtx.createRadialGradient(
      renderW * 0.5,
      renderH * 0.5,
      renderW * 0.05,
      renderW * 0.5,
      renderH * 0.5,
      renderH * 0.72
    );
    bgGrad.addColorStop(0, '#070d18');
    bgGrad.addColorStop(1, '#020308');
    stageCtx.fillStyle = bgGrad;
    stageCtx.fillRect(0, 0, renderW, renderH);

    stageCtx.drawImage(sharpCanvas, 0, 0, renderW, renderH);

    bloomCtxA.clearRect(0, 0, bloomCanvasA.width, bloomCanvasA.height);
    bloomCtxA.drawImage(sharpCanvas, 0, 0, bloomCanvasA.width, bloomCanvasA.height);

    bloomCtxB.clearRect(0, 0, bloomCanvasB.width, bloomCanvasB.height);
    bloomCtxB.drawImage(bloomCanvasA, 0, 0, bloomCanvasB.width, bloomCanvasB.height);

    stageCtx.save();
    stageCtx.globalCompositeOperation = 'lighter';
    stageCtx.globalAlpha = 0.42;
    stageCtx.drawImage(bloomCanvasA, 0, 0, renderW, renderH);
    stageCtx.globalAlpha = 0.30;
    stageCtx.drawImage(bloomCanvasB, 0, 0, renderW, renderH);
    stageCtx.restore();

    requestAnimationFrame(render);
  }

  // Wait for D2Coding, Cascadia Code, AND Lobster cursive font before rasterizing greetings
  const fontReady =
    document.fonts && document.fonts.load
      ? Promise.race([
          Promise.all([
            document.fonts.load('400 96px "Lobster"').catch(() => null),
            document.fonts.load('700 18px "D2Coding"').catch(() => null),
            document.fonts.ready,
          ]),
          new Promise((resolve) => setTimeout(resolve, 1400)),
        ])
      : Promise.resolve();

  fontReady.then(() => {
    resize();
    buildCursiveGreetings();
    tryUnlockAudio();
    updateSoundButtonUI();
    resetAnimation(false);
    requestAnimationFrame(render);
  });
})();
