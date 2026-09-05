/**
 * English Article Tetris — original learning game
 * Vanilla JS, no dependencies
 */

(() => {
  "use strict";

  // ─── Content: 50+ nouns across 4 categories ───
  // lane: 0=a, 1=an, 2=some, 3=a pair of
  // a/an based on SOUND (university=/ju/→a, hour=/aʊ/→an)
  const NOUNS = [
    // a — countable singular, consonant sound (lane 0)
    { word: "book", phonetic: "/bʊk/", lane: 0 },
    { word: "cat", phonetic: "/kæt/", lane: 0 },
    { word: "dog", phonetic: "/dɒɡ/", lane: 0 },
    { word: "table", phonetic: "/ˈteɪbl/", lane: 0 },
    { word: "pen", phonetic: "/pen/", lane: 0 },
    { word: "chair", phonetic: "/tʃeə/", lane: 0 },
    { word: "university", phonetic: "/ˌjuːnɪˈvɜːsəti/", lane: 0 },
    { word: "European", phonetic: "/ˌjʊərəˈpiːən/", lane: 0 },
    { word: "one-way ticket", phonetic: "/wʌn weɪ/", lane: 0 },
    { word: "house", phonetic: "/haʊs/", lane: 0 },
    { word: "car", phonetic: "/kɑː/", lane: 0 },
    { word: "teacher", phonetic: "/ˈtiːtʃə/", lane: 0 },
    { word: "phone", phonetic: "/fəʊn/", lane: 0 },
    { word: "window", phonetic: "/ˈwɪndəʊ/", lane: 0 },
    { word: "school", phonetic: "/skuːl/", lane: 0 },
    { word: "friend", phonetic: "/frend/", lane: 0 },
    { word: "useful tip", phonetic: "/ˈjuːsfl/", lane: 0 },
    { word: "unique idea", phonetic: "/juːˈniːk/", lane: 0 },

    // an — countable singular, vowel sound (lane 1)
    { word: "apple", phonetic: "/ˈæpl/", lane: 1 },
    { word: "orange", phonetic: "/ˈɒrɪndʒ/", lane: 1 },
    { word: "umbrella", phonetic: "/ʌmˈbrelə/", lane: 1 },
    { word: "hour", phonetic: "/ˈaʊə/", lane: 1 },
    { word: "honest person", phonetic: "/ˈɒnɪst/", lane: 1 },
    { word: "elephant", phonetic: "/ˈelɪfənt/", lane: 1 },
    { word: "idea", phonetic: "/aɪˈdɪə/", lane: 1 },
    { word: "egg", phonetic: "/eɡ/", lane: 1 },
    { word: "artist", phonetic: "/ˈɑːtɪst/", lane: 1 },
    { word: "island", phonetic: "/ˈaɪlənd/", lane: 1 },
    { word: "engine", phonetic: "/ˈendʒɪn/", lane: 1 },
    { word: "office", phonetic: "/ˈɒfɪs/", lane: 1 },
    { word: "uncle", phonetic: "/ˈʌŋkl/", lane: 1 },
    { word: "MBA", phonetic: "/ˌem biː ˈeɪ/", lane: 1 },
    { word: "SOS", phonetic: "/ˌes əʊ ˈes/", lane: 1 },
    { word: "heir", phonetic: "/eə/", lane: 1 },

    // some — uncountable / mass (lane 2)
    { word: "water", phonetic: "/ˈwɔːtə/", lane: 2 },
    { word: "milk", phonetic: "/mɪlk/", lane: 2 },
    { word: "rice", phonetic: "/raɪs/", lane: 2 },
    { word: "sugar", phonetic: "/ˈʃʊɡə/", lane: 2 },
    { word: "information", phonetic: "/ˌɪnfəˈmeɪʃn/", lane: 2 },
    { word: "advice", phonetic: "/ədˈvaɪs/", lane: 2 },
    { word: "furniture", phonetic: "/ˈfɜːnɪtʃə/", lane: 2 },
    { word: "bread", phonetic: "/bred/", lane: 2 },
    { word: "money", phonetic: "/ˈmʌni/", lane: 2 },
    { word: "music", phonetic: "/ˈmjuːzɪk/", lane: 2 },
    { word: "homework", phonetic: "/ˈhəʊmwɜːk/", lane: 2 },
    { word: "luggage", phonetic: "/ˈlʌɡɪdʒ/", lane: 2 },
    { word: "butter", phonetic: "/ˈbʌtə/", lane: 2 },
    { word: "cheese", phonetic: "/tʃiːz/", lane: 2 },
    { word: "sand", phonetic: "/sænd/", lane: 2 },
    { word: "tea", phonetic: "/tiː/", lane: 2 },

    // a pair of — paired items (lane 3)
    { word: "shoes", phonetic: "/ʃuːz/", lane: 3 },
    { word: "socks", phonetic: "/sɒks/", lane: 3 },
    { word: "gloves", phonetic: "/ɡlʌvz/", lane: 3 },
    { word: "scissors", phonetic: "/ˈsɪzəz/", lane: 3 },
    { word: "glasses", phonetic: "/ˈɡlɑːsɪz/", lane: 3 },
    { word: "trousers", phonetic: "/ˈtraʊzəz/", lane: 3 },
    { word: "jeans", phonetic: "/dʒiːnz/", lane: 3 },
    { word: "chopsticks", phonetic: "/ˈtʃɒpstɪks/", lane: 3 },
    { word: "earrings", phonetic: "/ˈɪərɪŋz/", lane: 3 },
    { word: "boots", phonetic: "/buːts/", lane: 3 },
    { word: "sandals", phonetic: "/ˈsændlz/", lane: 3 },
    { word: "binoculars", phonetic: "/bɪˈnɒkjələz/", lane: 3 },
  ];

  const ARTICLE_LABELS = ["a", "an", "some", "a pair of"];

  // ─── Board constants ───
  const LANES = 4;
  const ROWS = 8;
  const CELL = 70;
  const GAP = 4;
  const BOARD_W = LANES * CELL + (LANES + 1) * GAP;
  const BOARD_H = ROWS * CELL + (ROWS + 1) * GAP;

  const FALL_MS_BASE = 900;
  const SOFT_DROP_MS = 70;
  const FEEDBACK_MS = 1400;
  const PHRASE_FLASH_MS = 1600;

  // ─── DOM ───
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = BOARD_W;
  canvas.height = BOARD_H;

  const el = {
    start: document.getElementById("start-screen"),
    pause: document.getElementById("pause-screen"),
    gameover: document.getElementById("gameover-screen"),
    gameWrap: document.getElementById("game-wrap"),
    score: document.getElementById("score"),
    combo: document.getElementById("combo"),
    lives: document.getElementById("lives"),
    nextWord: document.getElementById("next-word"),
    nextPhonetic: document.getElementById("next-phonetic"),
    feedback: document.getElementById("feedback"),
    goScore: document.getElementById("go-score"),
    goReason: document.getElementById("go-reason"),
    lanePhrases: document.querySelectorAll("#lane-phrases span"),
    btnStart: document.getElementById("btn-start"),
    btnResume: document.getElementById("btn-resume"),
    btnRestart: document.getElementById("btn-restart"),
    btnPause: document.getElementById("btn-pause"),
  };

  // ─── State ───
  let grid; // [lane][row] = noun | null  (row 0 = bottom)
  let current;
  let nextPiece;
  let score;
  let combo;
  let lives;
  let state; // 'start' | 'playing' | 'paused' | 'gameover'
  let softDropping;
  let lastFall;
  let animId;
  let feedbackTimer;
  let bag; // shuffle bag for fair distribution

  function fullPhrase(noun) {
    return `${ARTICLE_LABELS[noun.lane]} ${noun.word}`;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function refillBag() {
    bag = shuffle(NOUNS);
  }

  function drawFromBag() {
    if (!bag || bag.length === 0) refillBag();
    return { ...bag.pop() };
  }

  function emptyGrid() {
    return Array.from({ length: LANES }, () =>
      Array.from({ length: ROWS }, () => null)
    );
  }

  function resetGame() {
    grid = emptyGrid();
    score = 0;
    combo = 0;
    lives = 3;
    softDropping = false;
    refillBag();
    nextPiece = drawFromBag();
    spawnPiece();
    updateHud();
    clearFeedback();
    clearLanePhrases();
  }

  function spawnPiece() {
    current = {
      noun: nextPiece,
      lane: Math.floor(Math.random() * LANES),
      y: -1, // float above top; row index from top of visual (0=top)
      settling: false,
    };
    nextPiece = drawFromBag();
    updateNext();
    lastFall = performance.now();

    // top-out check: if spawn lane already full at top
    if (columnHeight(current.lane) >= ROWS) {
      endGame("A lane filled to the top!");
    }
  }

  function columnHeight(lane) {
    let h = 0;
    for (let r = 0; r < ROWS; r++) {
      if (grid[lane][r]) h++;
      else break;
    }
    return h;
  }

  /** Visual row (0=top) → stack row from bottom */
  function landingRow(lane) {
    return columnHeight(lane); // bottom-up index where next block sits
  }

  function updateHud() {
    el.score.textContent = String(score);
    el.combo.textContent = combo > 0 ? `×${combo}` : "0";
    el.lives.textContent = "♥".repeat(lives) + "♡".repeat(Math.max(0, 3 - lives));
  }

  function updateNext() {
    el.nextWord.textContent = nextPiece.word;
    el.nextPhonetic.textContent = nextPiece.phonetic || "";
  }

  function showFeedback(msg, ok) {
    clearTimeout(feedbackTimer);
    el.feedback.textContent = msg;
    el.feedback.classList.toggle("ok", !!ok);
    el.feedback.classList.remove("hidden");
    feedbackTimer = setTimeout(clearFeedback, FEEDBACK_MS);
  }

  function clearFeedback() {
    el.feedback.classList.add("hidden");
  }

  function clearLanePhrases() {
    el.lanePhrases.forEach((s) => {
      s.textContent = "";
      s.classList.remove("show");
    });
  }

  function flashLanePhrases(nounsInRow) {
    nounsInRow.forEach((noun, lane) => {
      if (!noun) return;
      const span = el.lanePhrases[lane];
      span.textContent = fullPhrase(noun);
      span.classList.add("show");
    });
    setTimeout(() => {
      el.lanePhrases.forEach((s) => s.classList.remove("show"));
    }, PHRASE_FLASH_MS);
  }

  function comboBonus() {
    // +10, +15, +20, +25...
    return 5 + combo * 5;
  }

  function lockPiece() {
    const noun = current.noun;
    const lane = current.lane;
    const correct = noun.lane === lane;

    if (!correct) {
      // destroy — never leave wrong match
      combo = 0;
      lives -= 1;
      updateHud();
      showFeedback(`Almost! Correct: ${fullPhrase(noun)}`, false);
      if (lives <= 0) {
        endGame("Out of lives!");
        current = null;
        return;
      }
      spawnPiece();
      return;
    }

    const stackRow = landingRow(lane);
    if (stackRow >= ROWS) {
      endGame("A lane filled to the top!");
      current = null;
      return;
    }

    grid[lane][stackRow] = noun;
    combo += 1;
    score += comboBonus();
    updateHud();

    const cleared = clearFullRows();
    if (cleared === 0) {
      // subtle ok flash optional — skip to keep snappy
    }

    if (lives <= 0) return;
    spawnPiece();
  }

  function clearFullRows() {
    // A "row" across all 4 lanes: same bottom-up index all filled
    let clearedCount = 0;
    let r = 0;
    while (r < ROWS) {
      const full = grid.every((col) => col[r] !== null);
      if (full) {
        const rowNouns = grid.map((col) => col[r]);
        flashLanePhrases(rowNouns);
        // remove row r from each lane, gravity (blocks below stay; above fall down)
        for (let lane = 0; lane < LANES; lane++) {
          grid[lane].splice(r, 1);
          grid[lane].push(null);
        }
        clearedCount++;
        score += 100;
        // don't increment r — new block fell into this index
      } else {
        r++;
      }
    }

    if (clearedCount > 0) {
      const boardEmpty = grid.every((col) => col.every((c) => c === null));
      if (boardEmpty) {
        score += 600;
        showFeedback("All Clear! +600", true);
      } else {
        showFeedback(`Row clear! +${clearedCount * 100}`, true);
      }
      updateHud();
    }
    return clearedCount;
  }

  function hardDrop() {
    if (!current || state !== "playing") return;
    // snap to landing visual position then lock
    const stackH = columnHeight(current.lane);
    const visualBottomRow = ROWS - 1 - stackH; // where block will sit (0=top)
    current.y = visualBottomRow;
    lockPiece();
  }

  function softStep() {
    if (!current || state !== "playing") return;
    const stackH = columnHeight(current.lane);
    const maxY = ROWS - 1 - stackH; // lowest visual row allowed
    if (current.y < maxY) {
      current.y += 1;
    } else {
      lockPiece();
    }
  }

  function moveLane(dir) {
    if (!current || state !== "playing") return;
    const nl = current.lane + dir;
    if (nl < 0 || nl >= LANES) return;
    // instant snap; clamp y so we don't overlap existing stack in new lane
    current.lane = nl;
    const maxY = ROWS - 1 - columnHeight(nl);
    if (current.y > maxY) current.y = maxY;
  }

  // ─── Drawing ───
  function laneX(lane) {
    return GAP + lane * (CELL + GAP);
  }

  function rowY(visualRow) {
    return GAP + visualRow * (CELL + GAP);
  }

  function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBlock(x, y, noun, ghost) {
    const pad = 2;
    ctx.save();
    if (ghost) ctx.globalAlpha = 0.35;
    drawRoundedRect(x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 10);
    ctx.fillStyle = ghost ? "#cfc3a8" : "#f5ead6";
    ctx.fill();
    ctx.strokeStyle = ghost ? "#a89878" : "#c4a882";
    ctx.lineWidth = 2;
    ctx.stroke();

    // word
    ctx.fillStyle = "#1a2a2a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cx = x + CELL / 2;
    const cy = y + CELL / 2 - (noun.phonetic ? 6 : 0);

    // fit text
    let size = 15;
    ctx.font = `800 ${size}px "Segoe UI", system-ui, sans-serif`;
    const maxW = CELL - 12;
    while (size > 9 && ctx.measureText(noun.word).width > maxW) {
      size -= 1;
      ctx.font = `800 ${size}px "Segoe UI", system-ui, sans-serif`;
    }
    // wrap long words roughly
    const words = noun.word.split(" ");
    if (words.length > 1 && ctx.measureText(noun.word).width > maxW) {
      const lineH = size + 2;
      words.forEach((w, i) => {
        ctx.fillText(w, cx, cy - ((words.length - 1) * lineH) / 2 + i * lineH);
      });
    } else {
      ctx.fillText(noun.word, cx, cy);
    }

    if (noun.phonetic && !ghost) {
      ctx.font = `600 9px "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = "#5a6a5a";
      ctx.fillText(noun.phonetic, cx, y + CELL - 14);
    }
    ctx.restore();
  }

  function drawBoard() {
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);

    // lane backgrounds
    for (let lane = 0; lane < LANES; lane++) {
      const x = laneX(lane);
      ctx.fillStyle = lane % 2 === 0 ? "#0a2424" : "#0c2828";
      ctx.fillRect(x, GAP, CELL, BOARD_H - GAP * 2);
    }

    // grid lines subtle
    ctx.strokeStyle = "rgba(42,143,143,0.25)";
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      const y = GAP + r * (CELL + GAP) - GAP / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(BOARD_W, y);
      ctx.stroke();
    }

    // stacked blocks (grid[lane][bottomUp])
    for (let lane = 0; lane < LANES; lane++) {
      for (let bu = 0; bu < ROWS; bu++) {
        const noun = grid[lane][bu];
        if (!noun) continue;
        const visualRow = ROWS - 1 - bu;
        drawBlock(laneX(lane), rowY(visualRow), noun, false);
      }
    }

    // ghost + current
    if (current && state === "playing") {
      const stackH = columnHeight(current.lane);
      const ghostVisual = ROWS - 1 - stackH;
      if (ghostVisual !== current.y && current.y < ghostVisual) {
        drawBlock(laneX(current.lane), rowY(ghostVisual), current.noun, true);
      }
      if (current.y >= -1) {
        const y = current.y < 0 ? rowY(0) - CELL - GAP : rowY(current.y);
        drawBlock(laneX(current.lane), y, current.noun, false);
      }
    }
  }

  // ─── Loop ───
  function tick(now) {
    if (state === "playing" && current) {
      const interval = softDropping ? SOFT_DROP_MS : FALL_MS_BASE;
      if (now - lastFall >= interval) {
        softStep();
        lastFall = now;
      }
    }
    drawBoard();
    animId = requestAnimationFrame(tick);
  }

  // ─── Screens ───
  function showOnly(screen) {
    el.start.classList.add("hidden");
    el.pause.classList.add("hidden");
    el.gameover.classList.add("hidden");
    if (screen === "start") el.start.classList.remove("hidden");
    if (screen === "pause") el.pause.classList.remove("hidden");
    if (screen === "gameover") el.gameover.classList.remove("hidden");
  }

  function startPlaying() {
    resetGame();
    state = "playing";
    el.gameWrap.classList.remove("hidden");
    showOnly(null);
  }

  function togglePause() {
    if (state === "playing") {
      state = "paused";
      showOnly("pause");
    } else if (state === "paused") {
      state = "playing";
      lastFall = performance.now();
      showOnly(null);
    }
  }

  function endGame(reason) {
    state = "gameover";
    el.goScore.textContent = String(score);
    el.goReason.textContent = reason || "";
    showOnly("gameover");
  }

  // ─── Input ───
  function onKeyDown(e) {
    const k = e.key;
    if (state === "start") {
      if (k === "Enter" || k === " ") {
        e.preventDefault();
        startPlaying();
      }
      return;
    }
    if (state === "gameover") {
      if (k === "Enter" || k === " ") {
        e.preventDefault();
        startPlaying();
      }
      return;
    }
    if (k === "Escape" || k === "p" || k === "P") {
      e.preventDefault();
      togglePause();
      return;
    }
    if (state !== "playing") return;

    if (k === "ArrowLeft" || k === "a" || k === "A") {
      e.preventDefault();
      moveLane(-1);
    } else if (k === "ArrowRight" || k === "d" || k === "D") {
      e.preventDefault();
      moveLane(1);
    } else if (k === "ArrowDown") {
      e.preventDefault();
      softDropping = true;
    } else if (k === " ") {
      e.preventDefault();
      hardDrop();
    }
  }

  function onKeyUp(e) {
    if (e.key === "ArrowDown") softDropping = false;
  }

  // ─── Wire UI ───
  el.btnStart.addEventListener("click", startPlaying);
  el.btnResume.addEventListener("click", togglePause);
  el.btnRestart.addEventListener("click", startPlaying);
  el.btnPause.addEventListener("click", togglePause);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  // boot
  state = "start";
  grid = emptyGrid();
  drawBoard();
  animId = requestAnimationFrame(tick);
})();
