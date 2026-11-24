(() => {
  'use strict';

  // =========================================================================
  // Configuration & Timeline (1080x2316 Unified High-Res ASCII Grid)
  // =========================================================================
  const BASE_WIDTH = 1080;
  const BASE_HEIGHT = 2316;
  const COLS = 88;
  const ROWS = 118;

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
    MERRY_END: 16.5,
    CHRISTMAS_START: 16.35,
    CHRISTMAS_END: 17.5,
    DIM_START: 17.8,
    DIM_END: 19.3,
    COUNTDOWN_START: 18.1,
    COUNTDOWN_END: 19.2,
  };

  // Tree geometry: 4 overlapping tiers (top -> bottom)
  const TIERS = [
    { top: 0.00, bot: 0.30, r0: 0.00, rmax: 0.25 },
    { top: 0.20, bot: 0.54, r0: 0.27, rmax: 0.40 },
    { top: 0.43, bot: 0.78, r0: 0.33, rmax: 0.54 },
    { top: 0.66, bot: 1.00, r0: 0.36, rmax: 0.68 },
  ];

  // Vertical layout in unified 88x118 ASCII grid
  const LAYOUT = {
    CENTER_COL: (COLS - 1) / 2, // 43.5
    STAR_ROW: 13.5,
    GREETING_TOP_ROW: 15, // rows 15..20 flanking the upper peak
    TREE_TOP_ROW: 18.0,
    TREE_BOT_ROW: 81.0,
    TRUNK_TOP_ROW: 80.0,
    TRUNK_BOT_ROW: 88.0,
    GROUND_CENTER_ROW: 92.0,
    GROUND_RX: 39.5, // big, generous circular snow mound
    GROUND_RY: 8.8,
    TREE_SCALE_X: 50.0, // maps normalized radius 0.68 -> ~34 cols
    CAPTION_ROW: 104,
    COUNTDOWN_TOP_ROW: 107, // rows 107..111 (5-row ASCII-art digits)
  };

  const ROT_SPEED = 0.35; // radians / sec (slow continuous 3D rotation)
  const WORD = 'MERRYCHRISTMAS';
  const FONT_FAMILY = "'D2Coding', 'Cascadia Code', monospace";

  // =========================================================================
  // ASCII-Art Bitmap Fonts (Rendered Directly Inside the Unified ASCII Grid)
  // =========================================================================
  // 6-row lowercase/capital banner font for 'Merry' and 'christmas'
  const GREETING_FONT = {
    M: [
      '#...#',
      '##.##',
      '#.#.#',
      '#...#',
      '#...#',
      '#...#',
    ],
    e: [
      '...',
      '.#.',
      '#.#',
      '###',
      '#..',
      '.##',
    ],
    r: [
      '...',
      '.##',
      '#..',
      '#..',
      '#..',
      '#..',
    ],
    y: [
      '...',
      '#.#',
      '#.#',
      '.##',
      '..#',
      '##.',
    ],
    c: [
      '...',
      '.##',
      '#..',
      '#..',
      '#..',
      '.##',
    ],
    h: [
      '#..',
      '#..',
      '##.',
      '#.#',
      '#.#',
      '#.#',
    ],
    i: [
      '#',
      '.',
      '#',
      '#',
      '#',
      '#',
    ],
    s: [
      '...',
      '.##',
      '#..',
      '.#.',
      '..#',
      '##.',
    ],
    t: [
      '.#.',
      '###',
      '.#.',
      '.#.',
      '.#.',
      '.##',
    ],
    m: [
      '.....',
      '##.##',
      '#.#.#',
      '#.#.#',
      '#.#.#',
      '#.#.#',
    ],
    a: [
      '...',
      '##.',
      '..#',
      '###',
      '#.#',
      '###',
    ],
  };

  // 5-row ASCII-art digit font for KST DD:HH:MM:SS countdown
  const DIGIT_FONT = {
    '0': ['.##.', '#..#', '#..#', '#..#', '.##.'],
    '1': ['..#.', '.##.', '..#.', '..#.', '.###'],
    '2': ['###.', '...#', '.##.', '#...', '####'],
    '3': ['###.', '...#', '.##.', '...#', '###.'],
    '4': ['#..#', '#..#', '####', '...#', '...#'],
    '5': ['####', '#...', '###.', '...#', '###.'],
    '6': ['.##.', '#...', '###.', '#..#', '.##.'],
    '7': ['####', '...#', '..#.', '.#..', '.#..'],
    '8': ['.##.', '#..#', '.##.', '#..#', '.##.'],
    '9': ['.##.', '#..#', '.###', '...#', '.##.'],
    ':': ['..', '**', '..', '**', '..'],
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

  function easeInOutCubic(x) {
    const c = clamp(x, 0, 1);
    return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
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
  // Procedural 3D Scene Geometry Builders (Deterministic)
  // =========================================================================
  const rng = mulberry32(20261225);

  // 1. Background Ambient Stars (subtle fixed distant stars in the grid)
  const bgStars = [];
  for (let i = 0; i < 85; i++) {
    bgStars.push({
      col: Math.floor(rng() * COLS),
      row: Math.floor(rng() * (ROWS * 0.78)),
      ch: rng() < 0.72 ? '.' : rng() < 0.88 ? '·' : '+',
      phase: rng() * Math.PI * 2,
      speed: 1.0 + rng() * 1.6,
      baseAlpha: 0.14 + rng() * 0.22,
    });
  }

  // 2. Dense, Slow Grid-Integrated Snowflakes (+, *, 일본식 온점 '。', ., ·, ,)
  // Foreground snowflakes sit at high Z so they REPLACE tree glyphs as they pass over!
  const SNOW_GLYPHS_FAR = ['.', '·', ',', '.', '。'];
  const SNOW_GLYPHS_MID = ['+', '*', '。', '.', '+'];
  const SNOW_GLYPHS_NEAR = ['*', '+', '。', '.', '*'];

  const snowflakes = [];
  const SNOW_COUNT = 285;
  for (let i = 0; i < SNOW_COUNT; i++) {
    const depth = rng(); // 0 = far sky, 1 = near foreground (replaces tree cells!)
    const isForeground = depth > 0.56; // ~44% pass in front of & replace tree characters
    let glyphPool = SNOW_GLYPHS_FAR;
    if (isForeground) glyphPool = SNOW_GLYPHS_NEAR;
    else if (depth > 0.28) glyphPool = SNOW_GLYPHS_MID;

    const ch = glyphPool[Math.floor(rng() * glyphPool.length)];
    // Slow, serene snowfall in grid rows/sec
    const vyRows = 2.4 + depth * 4.4 + rng() * 1.1; // ~2.4..7.9 rows/sec (gentle & calm)
    snowflakes.push({
      col0: rng() * COLS,
      row0: -rng() * (ROWS * 0.92), // spans across screen quickly yet starts from above
      depth,
      isForeground,
      ch,
      vyRows,
      swayCols: 0.7 + rng() * 1.9,
      swayFreq: 0.35 + rng() * 0.65,
      phase: rng() * Math.PI * 2,
      twinklePhase: rng() * Math.PI * 2,
      bornAt: rng() * 1.8,
      targetColor: isForeground
        ? [235, 245, 255]
        : depth > 0.28
          ? [186, 212, 242]
          : [132, 160, 196],
      baseAlpha: isForeground ? 0.72 + (depth - 0.56) * 0.62 : 0.28 + depth * 0.44,
    });
  }

  // 3. Large, Dense Circular Accumulated Snow Ground (filled cell-by-cell!)
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
      // Subtle organic snowdrift contour jitter along perimeter
      const angle = Math.atan2(ny, nx);
      const contourJitter = 1 + 0.05 * Math.sin(angle * 5 + 0.7) + 0.03 * Math.cos(angle * 9);
      const rad = Math.hypot(nx, ny) / contourJitter;

      if (rad > 1.06) continue;

      // Dense snow carpet in core (~94%), organically tapering to delicate flakes at outer rim
      let keepProb = 0.94;
      if (rad > 0.76) {
        keepProb = clamp(0.94 - ((rad - 0.76) / 0.30) * 0.76, 0.14, 0.94);
      }
      if (rng() > keepProb) continue;

      // Slight domed mound appearance: shift subtle height shading
      const pool = rad < 0.72 ? GROUND_GLYPHS_CORE : GROUND_GLYPHS_EDGE;
      const ch = pool[Math.floor(rng() * pool.length)];

      // Accumulates gradually from scattered flakes into a full thick circular snow blanket
      const appearTime =
        TIMELINE.SNOW_GROUND_START +
        clamp(rng() * 2.4 + rad * 0.75 + (rng() < 0.18 ? rng() * 1.9 : 0), 0, 5.2);

      // Rich 3D circular snow shading: crisp moonlit snow on inner mound, soft twilight fade at rim
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
        baseAlpha: 0.42 + 0.54 * lum,
        twinklePhase: rng() * Math.PI * 2,
      });
    }
  }

  // 4. Tree Trunk (밑둥) — 3D rotating cylinder
  const trunkPoints = [];
  const TRUNK_GLYPHS = ['|', '#', 'H', 'I', 'M', ':'];
  const TRUNK_ROWS = 18;
  for (let i = 0; i < TRUNK_ROWS; i++) {
    const v = i / (TRUNK_ROWS - 1); // 0 = bottom, 1 = top
    const rowY = LAYOUT.TRUNK_BOT_ROW - v * (LAYOUT.TRUNK_BOT_ROW - LAYOUT.TRUNK_TOP_ROW);
    const numAround = 28;
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

  // 5. Tree Foliage Points (4 overlapping 3D tiers, dense ASCII surface)
  const treePoints = [];
  const treeHeightRows = LAYOUT.TREE_BOT_ROW - LAYOUT.TREE_TOP_ROW;

  for (let k = 0; k < TIERS.length; k++) {
    const tier = TIERS[k];
    const [tStart, tEnd] = TIMELINE.TIER_WINDOWS[k];
    const spanH = tier.bot - tier.top;
    const rings = Math.round(spanH * treeHeightRows * 1.95);

    for (let ri = 0; ri <= rings; ri++) {
      const u = ri / rings; // 0 = top of tier, 1 = bottom skirt of tier
      const h = tier.top + u * spanH;
      const baseR = tierRadius(k, u);
      const countAround = Math.max(10, Math.round(baseR * 180));

      for (let j = 0; j < countAround; j++) {
        const theta =
          (j / countAround) * Math.PI * 2 +
          (rng() - 0.5) * (0.5 / Math.max(1, countAround)) * Math.PI * 2;
        const boughWave = 1 + 0.048 * Math.sin(theta * 7 + k * 1.9 + u * 2.5);
        const radialLayer = rng() < 0.78 ? 1.0 : 0.72 + rng() * 0.25;
        const r = Math.max(0.012, baseR * boughWave * radialLayer + (rng() - 0.5) * 0.015);

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

  // 6. Spiral Garland / String Ornament (줄 형태 오너먼트)
  const garlandPoints = [];
  const GARLAND_SAMPLES = 360;
  const GARLAND_TURNS = 4.6;
  const GARLAND_GLYPHS = ['o', '*', '~', '°', 'o', '·'];

  for (let i = 0; i < GARLAND_SAMPLES; i++) {
    const p = i / (GARLAND_SAMPLES - 1); // 0 = bottom, 1 = top
    const baseH = 0.96 - p * 0.90;
    const drape = 0.011 * Math.sin(p * Math.PI * 16);
    const h = clamp(baseH + drape, 0.05, 0.98);
    const theta = p * Math.PI * 2 * GARLAND_TURNS + 0.4;
    const r = maxTreeRadiusAtH(h) + 0.034;

    const appearTime =
      TIMELINE.GARLAND_START + p * (TIMELINE.GARLAND_END - TIMELINE.GARLAND_START);
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
      targetColor: isBulb ? [255, 224, 108] : [255, 178, 48],
    });
  }

  // 7. 3D Ornaments: Sphere (구), Star (별), Stocking (양말) — hanging bottom to top
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
    [255, 54, 76],   // Ruby Red
    [68, 184, 255],  // Sapphire Blue
    [255, 96, 178],  // Rose Magenta
  ];

  const ornaments = [];
  const ORN_COUNT = 21;
  const ORN_TYPES = ['sphere', 'stocking', 'star'];
  const GOLDEN_ANGLE = 2.39996323;

  for (let i = 0; i < ORN_COUNT; i++) {
    const frac = i / (ORN_COUNT - 1);
    const h = 0.91 - frac * 0.70;
    const theta = i * GOLDEN_ANGLE + 0.55;
    const r = maxTreeRadiusAtH(h) + 0.052;
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

  // 8. Top Star (맨 위 별 + 빛줄기)
  const topStarCells = [
    { dx: 0, dy: 0, ch: '@', ring: 0, color: [255, 246, 182] },
    { dx: -1, dy: 0, ch: '*', ring: 1, color: [255, 224, 108] },
    { dx: 1, dy: 0, ch: '*', ring: 1, color: [255, 224, 108] },
    { dx: 0, dy: -1, ch: '*', ring: 1, color: [255, 224, 108] },
    { dx: 0, dy: 1, ch: '*', ring: 1, color: [255, 224, 108] },
    { dx: -2, dy: 0, ch: '+', ring: 2, color: [255, 206, 74] },
    { dx: 2, dy: 0, ch: '+', ring: 2, color: [255, 206, 74] },
    { dx: 0, dy: -2, ch: '|', ring: 2, color: [255, 206, 74] },
    { dx: 0, dy: 2, ch: '|', ring: 2, color: [255, 206, 74] },
    { dx: -1, dy: -1, ch: '\\', ring: 2, color: [255, 212, 86] },
    { dx: 1, dy: -1, ch: '/', ring: 2, color: [255, 212, 86] },
    { dx: -1, dy: 1, ch: '/', ring: 2, color: [255, 212, 86] },
    { dx: 1, dy: 1, ch: '\\', ring: 2, color: [255, 212, 86] },
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
  // Unified Z-Buffered ASCII Grid Framebuffer
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

  // Plot ASCII-art greeting word ('Merry' or 'christmas') directly into the grid
  function plotAsciiGreeting(word, startCol, topRow, startTime, endTime, t, dimFactor) {
    if (t < startTime) return;
    const len = word.length;
    const span = Math.max(0.01, endTime - startTime);
    const targetRed = [255, 44, 66];
    let curCol = startCol;

    for (let ci = 0; ci < len; ci++) {
      const glyph = GREETING_FONT[word[ci]];
      if (!glyph) continue;
      const w = glyph[0].length;
      const charStart = startTime + (ci / Math.max(1, len - 1)) * (span * 0.72);
      const age = t - charStart;

      if (age > 0) {
        const fade = easeOutCubic(clamp(age / 0.28, 0, 1));
        const rgb = whiteToColor(targetRed, age, 0.85);
        const pulse = 0.92 + 0.08 * Math.sin(t * 2.2 + ci * 0.45);
        const alpha = fade * pulse * dimFactor;

        for (let dy = 0; dy < glyph.length; dy++) {
          const line = glyph[dy];
          for (let dx = 0; dx < w; dx++) {
            if (line[dx] === '.') continue;
            // Subtle ASCII glyph variation for rich texture
            const ch = (dx + dy) % 5 === 0 ? '@' : '#';
            plotCell(
              curCol + dx,
              topRow + dy,
              ch,
              rgb[0],
              rgb[1],
              rgb[2],
              alpha,
              32.0
            );
          }
        }
      }

      curCol += w + 1;
    }
  }

  // Plot ASCII-art KST countdown + caption directly into the grid
  function plotAsciiCountdown(t) {
    if (t < TIMELINE.COUNTDOWN_START) return;
    const age = t - TIMELINE.COUNTDOWN_START;
    const reveal = easeOutCubic(clamp(age / 0.9, 0, 1));
    const kst = getKstCountdown();

    // 1. Single-row ASCII caption centered above digits
    const caption = kst.isChristmasDay
      ? '· K S T · M E R R Y · C H R I S T M A S ·'
      : '· K S T · U N T I L · C H R I S T M A S ·';
    const capStartCol = Math.round((COLS - caption.length) / 2);
    const capColor = whiteToColor([188, 206, 234], age, 0.9);
    for (let i = 0; i < caption.length; i++) {
      const ch = caption[i];
      if (ch === ' ') continue;
      plotCell(
        capStartCol + i,
        LAYOUT.CAPTION_ROW,
        ch,
        capColor[0],
        capColor[1],
        capColor[2],
        reveal * 0.82,
        40.0
      );
    }

    // 2. 5-row ASCII-art DD:HH:MM:SS digits centered inside the grid
    const str = kst.text;
    let totalW = 0;
    for (let i = 0; i < str.length; i++) {
      const g = DIGIT_FONT[str[i]];
      if (!g) continue;
      totalW += g[0].length;
      if (i < str.length - 1) totalW += 1;
    }

    let curCol = Math.round((COLS - totalW) / 2);
    const digitTarget = [255, 228, 148];
    const colonTarget = [255, 84, 98];
    const colonPulse = 0.62 + 0.38 * Math.sin(t * Math.PI * 2);

    for (let i = 0; i < str.length; i++) {
      const chKey = str[i];
      const glyph = DIGIT_FONT[chKey];
      if (!glyph) continue;
      const w = glyph[0].length;
      const cAge = age - i * 0.045;

      if (cAge > 0) {
        const cFade = easeOutCubic(clamp(cAge / 0.32, 0, 1));
        const isColon = chKey === ':';
        const rgb = whiteToColor(isColon ? colonTarget : digitTarget, cAge, 0.95);
        const alpha = cFade * (isColon ? colonPulse : 1.0);

        for (let dy = 0; dy < glyph.length; dy++) {
          const line = glyph[dy];
          for (let dx = 0; dx < w; dx++) {
            const sym = line[dx];
            if (sym === '.') continue;
            const drawCh = isColon ? '*' : (dx + dy) % 4 === 0 ? '@' : '#';
            plotCell(
              curCol + dx,
              LAYOUT.COUNTDOWN_TOP_ROW + dy,
              drawCh,
              rgb[0],
              rgb[1],
              rgb[2],
              alpha,
              40.0
            );
          }
        }
      }

      curCol += w + 1;
    }
  }

  // =========================================================================
  // KST Countdown (UTC+9, target Dec 25 00:00:00 KST)
  // =========================================================================
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

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

  // =========================================================================
  // High-Resolution Canvas (1080x2316+ backing resolution) & Bloom Pipeline
  // =========================================================================
  const stageCanvas = document.getElementById('stage');
  const stageCtx = stageCanvas.getContext('2d', { alpha: false });
  const stageFrame = document.getElementById('stageFrame');
  const replayBtn = document.getElementById('replayBtn');

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
  let gridFontPx = Math.min(cellH * 1.02, cellW / 0.56);

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
    gridFontPx = Math.min(cellH * 1.02, cellW / 0.56);
  }

  window.addEventListener('resize', resize);
  resize();

  // =========================================================================
  // Main Frame Simulation & Render (100% Unified ASCII Grid)
  // =========================================================================
  let startTimeMs = performance.now();
  let spinTimer = null;

  function resetAnimation(withSpin = false) {
    startTimeMs = performance.now();
    if (withSpin) {
      replayBtn.classList.remove('spinning');
      void replayBtn.offsetWidth;
      replayBtn.classList.add('spinning');
      if (spinTimer) clearTimeout(spinTimer);
      spinTimer = setTimeout(() => replayBtn.classList.remove('spinning'), 480);
    }
  }

  replayBtn.addEventListener('click', () => resetAnimation(true));

  function render(nowMs) {
    const t = (nowMs - startTimeMs) / 1000;

    // Dimming curve at Phase 8 (dims scene gracefully while ASCII countdown shines at full brightness)
    const dimProgress = easeInOutCubic(ramp(t, TIMELINE.DIM_START, TIMELINE.DIM_END));
    const sceneDim = 1 - dimProgress * 0.46; // 1.0 -> 0.54
    const greetingDim = 1 - dimProgress * 0.18; // 1.0 -> 0.82

    const rot = t * ROT_SPEED;

    // --- 1. Populate Unified Z-Buffered ASCII Grid ---
    clearGrid();

    // 1A. Subtle background stars (z = -100)
    for (let i = 0; i < bgStars.length; i++) {
      const st = bgStars[i];
      const tw = 0.65 + 0.35 * Math.sin(t * st.speed + st.phase);
      const a = st.baseAlpha * tw * sceneDim;
      plotCell(st.col, st.row, st.ch, 155, 182, 222, a, -100);
    }

    // 1B. Dense, Slow Falling Snowflakes inside the SAME ASCII grid
    // Background snow (z = -50) falls behind the tree;
    // Foreground snow (z = +25) falls OVER the tree and REPLACES tree glyphs cell-for-cell!
    const snowCycleRows = ROWS + 8;
    for (let i = 0; i < snowflakes.length; i++) {
      const s = snowflakes[i];
      const age = t - s.bornAt;
      if (age <= 0) continue;

      const rawRow = s.row0 + s.vyRows * age;
      if (rawRow < 0) continue;
      const wrappedRow = ((rawRow % snowCycleRows) + snowCycleRows) % snowCycleRows - 2;
      const row = Math.round(wrappedRow);
      if (row < 0 || row >= ROWS) continue;

      // Soft fade near the very bottom below the circular snow mound
      const bottomFade = row > 96 ? clamp(1 - (row - 96) / 14, 0, 1) : 1;
      if (bottomFade <= 0.02) continue;

      const swayCol = s.col0 + Math.sin(age * s.swayFreq + s.phase) * s.swayCols;
      const col = Math.floor(((swayCol % COLS) + COLS) % COLS);

      const twinkle = 0.80 + 0.20 * Math.sin(t * 2.5 + s.twinklePhase);
      const rgb = whiteToColor(s.targetColor, age, 0.9);
      const alpha = s.baseAlpha * twinkle * bottomFade * sceneDim;
      const z = s.isForeground ? 25.0 : -50.0;

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
      plotCell(gp.col, gp.row, gp.ch, r, g, b, gp.baseAlpha * fade * shimmer * sceneDim, z);
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
        plotCell(col, row, tp.ch, rgb[0], rgb[1], rgb[2], fade * sceneDim, z);
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
        const row = Math.round(pt.rowY + z * 1.45);

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
        const alpha = (z >= -0.05 ? 0.96 : 0.42) * fade * sceneDim;

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
        const row = Math.round(gp.rowY + z * 1.45);

        const edgeSoft = clamp((cosT + 0.14) / 0.26, 0, 1);
        const twinkle = gp.isBulb
          ? 0.78 + 0.22 * Math.sin(t * 4.5 + gp.twinklePhase)
          : 0.86 + 0.14 * Math.sin(t * 2.6 + gp.twinklePhase);

        const rgb = whiteToColor(gp.targetColor, age, 0.75);
        const fade = easeOutCubic(clamp(age / 0.18, 0, 1));
        const alpha = fade * edgeSoft * twinkle * sceneDim;

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
        const centerRow = Math.round(orn.rowY + z * 1.45);

        const edgeFade = clamp((cosT + 0.05) / 0.25, 0, 1);
        const popFade = easeOutCubic(clamp(age / 0.24, 0, 1));
        const twinkle = 0.88 + 0.12 * Math.sin(t * 3.4 + orn.twinklePhase);
        const alpha = edgeFade * popFade * twinkle * sceneDim;

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
          fade * rayPulse * sceneDim,
          28.0
        );
      }
    }

    // 1I. Red ASCII-Art 'Merry' (upper-left) & 'christmas' (upper-right) inside the grid!
    // 'Merry' width = 21 cols -> cols 10..30; 'christmas' width = 35 cols -> cols 50..84
    plotAsciiGreeting(
      'Merry',
      10,
      LAYOUT.GREETING_TOP_ROW,
      TIMELINE.MERRY_START,
      TIMELINE.MERRY_END,
      t,
      greetingDim
    );
    plotAsciiGreeting(
      'christmas',
      50,
      LAYOUT.GREETING_TOP_ROW,
      TIMELINE.CHRISTMAS_START,
      TIMELINE.CHRISTMAS_END,
      t,
      greetingDim
    );

    // 1J. Bottom-Center ASCII-Art KST Countdown inside the grid!
    plotAsciiCountdown(t);

    // --- 2. Render Single Unified ASCII Grid onto High-Res Offscreen Canvas ---
    sharpCtx.clearRect(0, 0, renderW, renderH);
    sharpCtx.textAlign = 'center';
    sharpCtx.textBaseline = 'middle';

    const mainFont = `700 ${gridFontPx.toFixed(1)}px ${FONT_FAMILY}`;
    const cjkDotFont = `700 ${(gridFontPx * 0.86).toFixed(1)}px ${FONT_FAMILY}`;
    let lastWasDot = false;
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

        // Keep Japanese full stop '。' neatly scaled inside its grid cell
        const isDot = ch === '。';
        if (isDot !== lastWasDot) {
          sharpCtx.font = isDot ? cjkDotFont : mainFont;
          lastWasDot = isDot;
        }

        const px = (col + 0.5) * cellW;
        sharpCtx.fillStyle = `rgba(${gridR[idx] | 0}, ${gridG[idx] | 0}, ${gridB[idx] | 0}, ${a.toFixed(3)})`;
        sharpCtx.fillText(ch, px, py);
      }
    }

    // --- 3. Composite Final Frame + Phosphor Bloom ---
    const bgGrad = stageCtx.createRadialGradient(
      renderW * 0.5,
      renderH * 0.52,
      renderW * 0.05,
      renderW * 0.5,
      renderH * 0.52,
      renderH * 0.72
    );
    const bgBoost = 1 - dimProgress * 0.5;
    bgGrad.addColorStop(0, `rgb(${(7 * bgBoost) | 0}, ${(13 * bgBoost) | 0}, ${(24 * bgBoost) | 0})`);
    bgGrad.addColorStop(1, '#020308');
    stageCtx.fillStyle = bgGrad;
    stageCtx.fillRect(0, 0, renderW, renderH);

    stageCtx.drawImage(sharpCanvas, 0, 0, renderW, renderH);

    // Multi-pass downscaled bilinear bloom (unifies snow, tree, greeting & countdown!)
    bloomCtxA.clearRect(0, 0, bloomCanvasA.width, bloomCanvasA.height);
    bloomCtxA.drawImage(sharpCanvas, 0, 0, bloomCanvasA.width, bloomCanvasA.height);

    bloomCtxB.clearRect(0, 0, bloomCanvasB.width, bloomCanvasB.height);
    bloomCtxB.drawImage(bloomCanvasA, 0, 0, bloomCanvasB.width, bloomCanvasB.height);

    stageCtx.save();
    stageCtx.globalCompositeOperation = 'lighter';
    stageCtx.globalAlpha = 0.44 * (1 - dimProgress * 0.18);
    stageCtx.drawImage(bloomCanvasA, 0, 0, renderW, renderH);
    stageCtx.globalAlpha = 0.34 * (1 - dimProgress * 0.18);
    stageCtx.drawImage(bloomCanvasB, 0, 0, renderW, renderH);
    stageCtx.restore();

    requestAnimationFrame(render);
  }

  // Wait briefly for D2Coding / Cascadia Code fonts to load, then start animation
  const fontReady =
    document.fonts && document.fonts.ready
      ? Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 750)),
        ])
      : Promise.resolve();

  fontReady.then(() => {
    resize();
    resetAnimation(false);
    requestAnimationFrame(render);
  });
})();
