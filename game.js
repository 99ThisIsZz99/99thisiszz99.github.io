const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const STORAGE_KEY = "starfall_rpg_save_v1";

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

const POINTER = {
  x: 0,
  y: 0,
  isDown: false
};

const state = {
  screen: "title",
  selectedMenuIndex: 0,
  titleBlink: 0,
  seed: 0,
  saveExists: false,
  lastPlanet: null
};

const menuOptions = [
  { label: "New Game", action: startNewGame },
  { label: "Continue", action: continueGame },
  { label: "Load from Clipboard", action: loadFromClipboard }
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function createPlanetProfile() {
  const climateTypes = ["Forest", "Desert", "Ocean", "Tundra", "Volcanic", "Savanna"];
  const tempTypes = ["Frigid", "Temperate", "Warm", "Scorching"];
  const resourceTypes = ["Metal", "Crystal", "Bio", "Rare Gas"];
  const names = ["Astra", "Veyra", "Nex", "Rhea", "Cindor", "Solis", "Mira", "Talon"];

  const climate = climateTypes[Math.floor(Math.random() * climateTypes.length)];
  const temperature = tempTypes[Math.floor(Math.random() * tempTypes.length)];
  const primaryResource = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
  const name = names[Math.floor(Math.random() * names.length)];
  const worldSeed = Math.floor(Math.random() * 1000000);

  return {
    name,
    climate,
    temperature,
    primaryResource,
    seed: worldSeed,
    danger: Math.floor(randomRange(1, 9)),
    population: Math.floor(randomRange(10, 200))
  };
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
  } catch (e) {
    console.warn("Save data invalid.");
    state.saveExists = false;
    return null;
  }
}

function saveGameToLocalStorage() {
  const payload = {
    player: {
      name: "Astra Ranger",
      class: "Explorer",
      level: 1
    },
    world: state.lastPlanet || createPlanetProfile(),
    timestamp: Date.now()
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  state.saveExists = true;
  state.lastPlanet = payload.world;
}

async function loadFromClipboard() {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      console.warn("Clipboard API unavailable.");
      return;
    }

    const text = await navigator.clipboard.readText();
    const parsed = JSON.parse(text);

    if (!parsed || !parsed.world) {
      console.warn("Clipboard data missing required fields.");
      return;
    }

    state.lastPlanet = parsed.world;
    state.screen = "play";
    console.log("Loaded from clipboard.");
  } catch (err) {
    console.warn("Could not read clipboard.", err);
  }
}

function startNewGame() {
  state.lastPlanet = createPlanetProfile();
  state.screen = "play";
  saveGameToLocalStorage();
  console.log("New game started:", state.lastPlanet);
}

function continueGame() {
  const save = loadSaveData();
  if (!save) {
    console.warn("No save found.");
    state.selectedMenuIndex = 0;
    return;
  }

  state.lastPlanet = save.world;
  state.screen = "play";
  console.log("Continue from local save.");
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawText(text, x, y, color = "#dfe9ff", size = 10, align = "left") {
  ctx.fillStyle = color;
  ctx.font = `${size}px monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
}

function drawButton(x, y, w, h, label, selected = false) {
  const fill = selected ? "#2b3f5f" : "#0f172a";
  const border = selected ? "#7dd3fc" : "#37507a";
  drawRect(x, y, w, h, fill);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  drawText(label, x + w / 2, y + 5, selected ? "#dff6ff" : "#c7d5ef", 10, "center");
}

function drawTitleScreen() {
  const width = GAME_WIDTH;
  const height = GAME_HEIGHT;

  // background
  drawRect(0, 0, width, height, "#050b14");

  // starfield
  for (let i = 0; i < 80; i++) {
    const x = (i * 37 + 13) % width;
    const y = (i * 29 + 11) % height;
    const size = (i % 3) + 1;
    const alpha = 0.3 + (i % 5) * 0.14;
    drawRect(x, y, size, size, `rgba(255,255,255,${alpha})`);
  }

  // giant planet
  ctx.beginPath();
  ctx.fillStyle = "#2b4b6f";
  ctx.arc(240, 68, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "#5cd1ff";
  ctx.arc(225, 60, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "#87f7ba";
  ctx.arc(255, 82, 10, 0, Math.PI * 2);
  ctx.fill();

  // title
  drawText("STARFALL", width / 2, 18, "#e6f0ff", 18, "center");
  drawText("RPG", width / 2, 42, "#7dd3fc", 14, "center");

  // subtitle
  drawText("Planet generation // save system // local storage", width / 2, 68, "#8aa4d7", 8, "center");

  // random planet info
  const planet = state.lastPlanet || createPlanetProfile();
  drawText(`Planet: ${planet.name || "Astra"}`, 20, 100, "#f5d58a", 9);
  drawText(`Climate: ${planet.climate || "Forest"}`, 20, 112, "#c7d8ff", 9);
  drawText(`Temperature: ${planet.temperature || "Temperate"}`, 20, 124, "#c7d8ff", 9);
  drawText(`Resource: ${planet.primaryResource || "Crystal"}`, 20, 136, "#c7d8ff", 9);

  // menu buttons
  const startX = 210;
  const startY = 100;
  const buttonW = 90;
  const buttonH = 18;
  const spacing = 22;

  menuOptions.forEach((opt, index) => {
    const y = startY + index * spacing;
    drawButton(startX, y, buttonW, buttonH, opt.label, state.selectedMenuIndex === index);
  });
}

function drawPlayScreen() {
  drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT, "#0d1322");

  const planet = state.lastPlanet || createPlanetProfile();

  drawText("WORLD MAP", 12, 12, "#dfe9ff", 12);
  drawText(`Planet: ${planet.name}`, 12, 30, "#fbbf24", 10);
  drawText(`Climate: ${planet.climate}`, 12, 42, "#bcd4ff", 10);
  drawText(`Temperature: ${planet.temperature}`, 12, 54, "#bcd4ff", 10);
  drawText(`Resource: ${planet.primaryResource}`, 12, 66, "#bcd4ff", 10);

  drawText("Prototyping terrain generation...", 12, 110, "#7dd3fc", 9);
  drawText("Press [M] to return to title", 12, 132, "#9fb4d9", 9);
}

function render() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (state.screen === "title") {
    drawTitleScreen();
  } else if (state.screen === "play") {
    drawPlayScreen();
  }
}

function update() {
  state.titleBlink += 0.016;
}

let lastFrame = performance.now();
function gameLoop(timestamp) {
  const delta = timestamp - lastFrame;
  lastFrame = timestamp;

  update(delta);
  render();
  requestAnimationFrame(gameLoop);
}

function handlePointerMove(event) {
  const rect = canvas.getBoundingClientRect();
  POINTER.x = ((event.clientX - rect.left) / rect.width) * GAME_WIDTH;
  POINTER.y = ((event.clientY - rect.top) / rect.height) * GAME_HEIGHT;
}

function handlePointerDown(event) {
  handlePointerMove(event);

  if (state.screen === "title") {
    const startX = 210;
    const startY = 100;
    const buttonW = 90;
    const buttonH = 18;
    const spacing = 22;

    menuOptions.forEach((opt, index) => {
      const x = startX;
      const y = startY + index * spacing;
      const inBounds =
        POINTER.x >= x &&
        POINTER.x <= x + buttonW &&
        POINTER.y >= y &&
        POINTER.y <= y + buttonH;

      if (inBounds) {
        opt.action();
      }
    });
  }
}

function handleKeyDown(event) {
  if (state.screen === "title") {
    if (event.key === "ArrowDown" || event.key === "s") {
      state.selectedMenuIndex = (state.selectedMenuIndex + 1) % menuOptions.length;
    }

    if (event.key === "ArrowUp" || event.key === "w") {
      state.selectedMenuIndex = (state.selectedMenuIndex - 1 + menuOptions.length) % menuOptions.length;
    }

    if (event.key === "Enter") {
      menuOptions[state.selectedMenuIndex].action();
    }
  }

  if (event.key.toLowerCase() === "m" && state.screen === "play") {
    state.screen = "title";
    state.lastPlanet = state.lastPlanet || createPlanetProfile();
  }
}

canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("keydown", handleKeyDown);

function bootstrap() {
  loadSaveData();
  state.lastPlanet = state.lastPlanet || createPlanetProfile();
  requestAnimationFrame(gameLoop);
}

bootstrap();
