const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const STORAGE_KEY = "starfall_rpg_save_v1";
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

const namePanel = document.getElementById("name-panel");
const nameInput = document.getElementById("player-name-input");
const nameBackBtn = document.getElementById("name-back");
const nameConfirmBtn = document.getElementById("name-confirm");

const POINTER = { x: 0, y: 0 };

const state = {
  screen: "title",
  planet: null,
  characters: [],
  selectedCharacterIndex: 0,
  hoveredCharacterIndex: -1,
  playerName: "",
  saveExists: false,
  lastPlanet: null,
  worldGenerated: false
};

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function createPlanetProfile() {
  const climateTypes = ["Forest", "Desert", "Ocean", "Tundra", "Volcanic", "Savanna", "Crystal", "Verdant"];
  const tempTypes = ["Frigid", "Temperate", "Warm", "Scorching", "Abyssal"];
  const resourceTypes = ["Iron", "Crystal", "Biolume", "Quantum", "Kite-Glass", "Aetherite"];
  const names = ["Astra", "Veyra", "Nex", "Rhea", "Cindor", "Solis", "Mira", "Talon", "Nyx", "Eryon"];

  return {
    name: pickRandom(names),
    climate: pickRandom(climateTypes),
    temperature: pickRandom(tempTypes),
    primaryResource: pickRandom(resourceTypes),
    danger: Math.floor(randomRange(1, 9)),
    population: Math.floor(randomRange(8, 180)),
    seed: Math.floor(randomRange(1000, 999999))
  };
}

function createCharacterPool() {
  const templates = [
    {
      id: "ashen-oracle",
      title: "Ashen Oracle",
      species: "Feral Mystic",
      sprite: [
        "00000000",
        "00011000",
        "00111100",
        "01111110",
        "01111110",
        "00111100",
        "00011000",
        "00000000"
      ],
      palette: { base: "#c7b8ff", accent: "#f7d57d", skin: "#e5d7bf", shadow: "#3d314a" },
      stats: { strength: 3, agility: 7, speed: 5, intelligence: 9 }
    },
    {
      id: "tide-priest",
      title: "Tide Priest",
      species: "Moon-Tide",
      sprite: [
        "00000000",
        "00011000",
        "00111100",
        "01111110",
        "01011010",
        "00111100",
        "00010100",
        "00000000"
      ],
      palette: { base: "#89d9ff", accent: "#8fe4b4", skin: "#f0d0bd", shadow: "#214763" },
      stats: { strength: 4, agility: 6, speed: 7, intelligence: 8 }
    },
    {
      id: "stone-warden",
      title: "Stone Warden",
      species: "Ancient Titan",
      sprite: [
        "00000000",
        "00111100",
        "01111110",
        "01111110",
        "01111110",
        "00111100",
        "00011000",
        "00000000"
      ],
      palette: { base: "#b9c2d1", accent: "#d59c6c", skin: "#d3c8be", shadow: "#2e3948" },
      stats: { strength: 9, agility: 4, speed: 3, intelligence: 5 }
    },
    {
      id: "ember-veil",
      title: "Ember Veil",
      species: "Solar Ash",
      sprite: [
        "00000000",
        "00011000",
        "00111100",
        "01111110",
        "01111110",
        "00111100",
        "00010100",
        "00000000"
      ],
      palette: { base: "#f7a06c", accent: "#ffd56a", skin: "#f1d6a4", shadow: "#5b2d21" },
      stats: { strength: 5, agility: 8, speed: 6, intelligence: 7 }
    },
    {
      id: "void-harrier",
      title: "Void Harrier",
      species: "Star-Drifter",
      sprite: [
        "00000000",
        "00111100",
        "01111110",
        "01011010",
        "01111110",
        "00111100",
        "00010100",
        "00000000"
      ],
      palette: { base: "#9ec5ff", accent: "#d7bbff", skin: "#dfe1ea", shadow: "#1f2f47" },
      stats: { strength: 4, agility: 9, speed: 8, intelligence: 6 }
    },
    {
      id: "root-seer",
      title: "Root Seer",
      species: "Verdant Sage",
      sprite: [
        "00000000",
        "00011000",
        "00111100",
        "01111110",
        "01011010",
        "00111100",
        "00011000",
        "00000000"
      ],
      palette: { base: "#9df1a7", accent: "#c3f784", skin: "#d9d0bf", shadow: "#214f3a" },
      stats: { strength: 6, agility: 5, speed: 4, intelligence: 9 }
    }
  ];

  const nameParts = ["Aster", "Vey", "Nura", "Ilya", "Cairn", "Sel", "Khe", "Mira", "Orin", "Thal", "Rhea", "Eir"];
  const surnames = ["Dawn", "Vale", "Sable", "Bloom", "Ash", "Glass", "Rune", "Star"];

  return templates.map((template, index) => ({
    ...template,
    name: pickRandom(nameParts),
    placeholderName: `${pickRandom(nameParts)} ${pickRandom(surnames)}`,
    variantIndex: index
  }));
}

function loadSaveData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.saveExists = false;
    return null;
  }

  try {
    const data = JSON.parse(raw);
    state.saveExists = !!data;
    return data;
  } catch (error) {
    state.saveExists = false;
    return null;
  }
}

function saveGameState() {
  const payload = {
    player: {
      name: state.playerName || "Unnamed",
      title: state.characters[state.selectedCharacterIndex]?.title || "Wanderer",
      variantId: state.characters[state.selectedCharacterIndex]?.id || "unknown"
    },
    planet: state.planet,
    timestamp: Date.now()
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  state.saveExists = true;
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawText(text, x, y, color, size, align = "left") {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
}

function drawButton(x, y, w, h, label, selected = false, accent = false) {
  ctx.fillStyle = selected ? "#1f3552" : "#0d1726";
  ctx.strokeStyle = accent ? "#75d7ff" : "#405d84";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  drawText(label, x + w / 2, y + 6, selected ? "#ebf6ff" : "#ccd9f4", 8, "center");
}

function drawPlanetPreview(x, y, radius, planet) {
  const hue = planet.seed % 360;

  ctx.beginPath();
  ctx.fillStyle = `hsl(${hue}, 45%, 55%)`;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.arc(x - radius * 0.35, y - radius * 0.36, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.arc(x + radius * 0.3, y + radius * 0.2, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

function drawCharacterSprite(character, x, y, scale, selected) {
  const sprite = character.sprite;
  const mapping = {
    "0": "transparent",
    "1": character.palette.base,
    "2": character.palette.accent,
    "3": character.palette.skin,
    "4": character.palette.shadow
  };

  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      const value = sprite[row][col];
      if (value === "0") continue;

      const px = x + col * scale;
      const py = y + row * scale;
      ctx.fillStyle = mapping[value] || character.palette.base;
      ctx.fillRect(px, py, scale, scale);
    }
  }

  if (selected) {
    ctx.strokeStyle = "#75d7ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 4, y - 4, sprite[0].length * scale + 8, sprite.length * scale + 8);
  }
}

function titleScreen() {
  drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT, "#070d18");

  for (let i = 0; i < 120; i++) {
    const x = (i * 19 + 7) % GAME_WIDTH;
    const y = (i * 29 + 11) % GAME_HEIGHT;
    const s = (i % 3) + 1;
    drawRect(x, y, s, s, "rgba(255,255,255,0.7)");
  }

  drawText("STARFALL", GAME_WIDTH / 2, 28, "#edf6ff", 16, "center");
  drawText("RPG", GAME_WIDTH / 2, 56, "#75d7ff", 12, "center");

  const buttonX = GAME_WIDTH / 2 - 58;
  const buttonY = 102;
  const buttonW = 116;
  const buttonH = 20;
  drawButton(buttonX, buttonY, buttonW, buttonH, "New Game", true, true);
}

function planetScreen() {
  const planet = state.planet || createPlanetProfile();
  state.planet = planet;

  drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT, "#09131d");
  drawText("WORLD", 16, 18, "#edf6ff", 12);

  const planetX = 96;
  const planetY = 78;
  drawPlanetPreview(planetX, planetY, 38, planet);

  drawText(planet.name.toUpperCase(), 170, 38, "#f7d67e", 10);
  drawText(`Climate: ${planet.climate}`, 170, 62, "#dfeaff", 8);
  drawText(`Temp: ${planet.temperature}`, 170, 80, "#dfeaff", 8);
  drawText(`Resource: ${planet.primaryResource}`, 170, 98, "#dfeaff", 8);
  drawText(`Danger: ${planet.danger}/8`, 170, 116, "#dfeaff", 8);

  const buttons = [
    { x: 16, y: 138, w: 88, h: 20, label: "Back", action: () => { state.screen = "title"; } },
    { x: 118, y: 138, w: 88, h: 20, label: "Another", action: () => { state.planet = createPlanetProfile(); } },
    { x: 220, y: 138, w: 88, h: 20, label: "Continue", action: () => { state.screen = "characters"; }, accent: true }
  ];

  buttons.forEach((button) => {
    const active = button.label === "Continue";
    drawButton(button.x, button.y, button.w, button.h, button.label, active, button.accent);
  });
}

function characterGridScreen() {
  const cards = state.characters.length ? state.characters : (state.characters = createCharacterPool());
  const columns = 3;
  const cardW = 78;
  const cardH = 62;
  const startX = 22;
  const startY = 28;
  const gapX = 12;
  const gapY = 10;

  drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT, "#09131d");
  drawText("SELECT", 16, 12, "#edf6ff", 12);
  drawText("CHARACTER", 16, 28, "#75d7ff", 10);

  cards.forEach((character, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);
    const hover = state.hoveredCharacterIndex === index;
    const selected = state.selectedCharacterIndex === index;

    ctx.fillStyle = selected ? "#183148" : hover ? "#12243d" : "#0f1a2b";
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = selected ? "#75d7ff" : hover ? "#c9d9f7" : "#405d84";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, cardW - 2, cardH - 2);

    drawCharacterSprite(character, x + 20, y + 10, 2, selected);
    drawText(character.title.toUpperCase(), x + 6, y + 42, "#f7d67e", 6);
    drawText(`STR ${character.stats.strength}`, x + 6, y + 50, "#dfeaff", 5);
    drawText(`AGI ${character.stats.agility}`, x + 42, y + 50, "#dfeaff", 5);
    drawText(`SPD ${character.stats.speed}`, x + 6, y + 58, "#dfeaff", 5);
    drawText(`INT ${character.stats.intelligence}`, x + 42, y + 58, "#dfeaff", 5);
  });

  drawButton(18, 150, 74, 18, "Back", false, false);
  drawButton(228, 150, 74, 18, "Continue", true, true);
}

function render() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (state.screen === "title") {
    titleScreen();
  } else if (state.screen === "planet") {
    planetScreen();
  } else if (state.screen === "characters") {
    characterGridScreen();
  }
}

function pointerToCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  POINTER.x = ((event.clientX - rect.left) / rect.width) * GAME_WIDTH;
  POINTER.y = ((event.clientY - rect.top) / rect.height) * GAME_HEIGHT;
}

function handlePointerMove(event) {
  pointerToCanvas(event);

  if (state.screen !== "characters") return;

  const columns = 3;
  const cardW = 78;
  const cardH = 62;
  const startX = 22;
  const startY = 28;
  const gapX = 12;
  const gapY = 10;

  let hoverIndex = -1;
  state.characters.forEach((character, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    if (
      POINTER.x >= x && POINTER.x <= x + cardW &&
      POINTER.y >= y && POINTER.y <= y + cardH
    ) {
      hoverIndex = index;
    }
  });

  state.hoveredCharacterIndex = hoverIndex;
}

function handlePointerDown(event) {
  pointerToCanvas(event);

  if (state.screen === "title") {
    const x = GAME_WIDTH / 2 - 58;
    const y = 102;
    const w = 116;
    const h = 20;

    if (POINTER.x >= x && POINTER.x <= x + w && POINTER.y >= y && POINTER.y <= y + h) {
      state.planet = createPlanetProfile();
      state.screen = "planet";
    }
    return;
  }

  if (state.screen === "planet") {
    const buttons = [
      { x: 16, y: 138, w: 88, h: 20, label: "Back", action: () => { state.screen = "title"; } },
      { x: 118, y: 138, w: 88, h: 20, label: "Another", action: () => { state.planet = createPlanetProfile(); } },
      { x: 220, y: 138, w: 88, h: 20, label: "Continue", action: () => { state.screen = "characters"; } }
    ];

    buttons.forEach((button) => {
      if (POINTER.x >= button.x && POINTER.x <= button.x + button.w && POINTER.y >= button.y && POINTER.y <= button.y + button.h) {
        button.action();
      }
    });
    return;
  }

  if (state.screen === "characters") {
    const columns = 3;
    const cardW = 78;
    const cardH = 62;
    const startX = 22;
    const startY = 28;
    const gapX = 12;
    const gapY = 10;

    let clickedIndex = -1;
    state.characters.forEach((character, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      if (
        POINTER.x >= x && POINTER.x <= x + cardW &&
        POINTER.y >= y && POINTER.y <= y + cardH
      ) {
        clickedIndex = index;
      }
    });

    if (clickedIndex >= 0) {
      state.selectedCharacterIndex = clickedIndex;
      state.hoveredCharacterIndex = clickedIndex;
      showNamePanel();
      return;
    }

    if (POINTER.x >= 18 && POINTER.x <= 92 && POINTER.y >= 150 && POINTER.y <= 168) {
      state.screen = "planet";
      return;
    }

    if (POINTER.x >= 228 && POINTER.x <= 302 && POINTER.y >= 150 && POINTER.y <= 168) {
      state.selectedCharacterIndex = clamp(state.selectedCharacterIndex, 0, state.characters.length - 1);
      showNamePanel();
    }
  }
}

function showNamePanel() {
  const character = state.characters[state.selectedCharacterIndex];
  nameInput.value = character?.placeholderName || "Astra Vale";
  state.playerName = nameInput.value;
  namePanel.classList.remove("hidden");
  nameInput.focus();
  nameInput.select();
}

function hideNamePanel() {
  namePanel.classList.add("hidden");
}

function confirmName() {
  const trimmed = nameInput.value.trim();
  const character = state.characters[state.selectedCharacterIndex];
  state.playerName = trimmed || character?.placeholderName || "Astra";
  saveGameState();
  hideNamePanel();
  state.screen = "planet";
}

nameBackBtn.addEventListener("click", () => {
  hideNamePanel();
  state.screen = "characters";
});

nameConfirmBtn.addEventListener("click", confirmName);
nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") confirmName();
  if (event.key === "Escape") {
    hideNamePanel();
    state.screen = "characters";
  }
});

canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerdown", handlePointerDown);

function bootstrap() {
  state.planet = createPlanetProfile();
  state.characters = createCharacterPool();
  state.selectedCharacterIndex = 0;
  loadSaveData();
  render();
}

bootstrap();
