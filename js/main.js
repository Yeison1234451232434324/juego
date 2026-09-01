/* global Phaser */
/**
 * main.js — COMPOSICIÓN de la aplicación. Solo cablea Modelo, Controladores,
 * Vistas y Phaser. Sin lógica de negocio ni de presentación.
 */
import { CONFIG } from "./config/gameConfig.js";
import { EventBus } from "./services/EventBus.js";
import { SaveManager } from "./services/SaveManager.js";
import { AudioManager } from "./services/AudioManager.js";
import { GameState } from "./services/GameState.js";
import { GameController } from "./controllers/GameController.js";

import { BootScene } from "./scenes/BootScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { WorkshopScene } from "./scenes/WorkshopScene.js";

import { HUDView } from "./views/HUDView.js";
import { QuestView } from "./views/QuestView.js";
import { PromptView } from "./views/PromptView.js";
import { DialogueView } from "./views/DialogueView.js";
import { TutorialView } from "./views/TutorialView.js";
import { LoadingView } from "./views/LoadingView.js";
import { NotificationView } from "./views/NotificationView.js";
import { MenuView } from "./views/MenuView.js";
import { CodingStationView } from "./views/CodingStationView.js";
import { CraftingView } from "./views/CraftingView.js";
import { InventoryView } from "./views/InventoryView.js";
import { ShopView } from "./views/ShopView.js";
import { RequirementView } from "./views/RequirementView.js";
import { SalesView } from "./views/SalesView.js";
import { EvaluationView } from "./views/EvaluationView.js";
import { SettingsView, toggleFullscreen } from "./views/SettingsView.js";
import { TouchView } from "./views/TouchView.js";

// ---------- adaptación a la pantalla (móvil / tablet / PC) ----------
// El aviso "gira el teléfono" lo controla el CSS (media queries): aparece solo
// en teléfonos en vertical y desaparece al girar. Aquí solo el botón "jugar así".
const orientHint = document.getElementById("orient-hint");
document.getElementById("orient-ok").addEventListener("click", () => {
  orientHint.classList.add("dismissed");
});

function refreshLayout() {
  document.body.classList.toggle(
    "is-touch",
    (window.matchMedia?.("(pointer: coarse)").matches ?? false) || "ontouchstart" in window,
  );
  try { phaser?.scale.refresh(); } catch { /* aún no existe */ }
}
["resize", "orientationchange", "pageshow", "focus"].forEach((e) =>
  window.addEventListener(e, () => setTimeout(refreshLayout, 60)));

// ---------- MODELO ----------
const bus = new EventBus();
const save = new SaveManager();
const audio = new AudioManager();
const gs = new GameState(bus);
const loaded = save.load();
if (loaded) gs.hydrate(loaded);

bus.on("sfx", (n) => audio.play(n));
bus.on("challenge:solved", () => audio.play("ok"));
bus.on("challenge:failed", () => audio.play("error"));
bus.on("rule:blocked", () => audio.play("error"));
bus.on("order:accepted", () => audio.play("accept"));
bus.on("order:delivered", () => audio.play("coins"));
bus.on("craft:done", () => audio.play("craft"));
bus.on("player:levelup", () => audio.play("level"));
bus.on("achievement:unlocked", () => audio.play("achieve"));
bus.on("upgrade:bought", () => audio.play("upgrade"));
bus.on("station:open", () => audio.play("open"));

// El audio se desbloquea con la 1.ª interacción real del usuario (autoplay).
const unlockAudio = () => {
  audio.unlock();
  updateSoundHint();
  window.removeEventListener("pointerdown", unlockAudio, true);
  window.removeEventListener("keydown", unlockAudio, true);
};
window.addEventListener("pointerdown", unlockAudio, true);
window.addEventListener("keydown", unlockAudio, true);

// Botón "🔊 Activar sonido" si el navegador bloqueó el audio.
const soundHint = document.createElement("button");
soundHint.id = "sound-hint";
soundHint.textContent = "🔊 Activar sonido";
soundHint.className = "hidden";
soundHint.addEventListener("click", () => { audio.unlock(); updateSoundHint(); });
document.getElementById("ui").appendChild(soundHint);
function updateSoundHint() {
  soundHint.classList.toggle("hidden", !(audio.blocked && audio.prefs.musicOn));
}

// ---------- CONTROLADOR ----------
const game = new GameController(gs, bus, save);

// ---------- VISTAS ----------
const hud = new HUDView();
const quest = new QuestView(gs, bus);
new PromptView(bus);
new DialogueView(bus);
new NotificationView(bus);
const tutorial = new TutorialView(bus);
new LoadingView(bus);

const coding = new CodingStationView(game.programming, bus);
const crafting = new CraftingView(game.crafting, gs, bus);
const inventory = new InventoryView(gs, bus);
const shop = new ShopView(game.workshop, game.upgrades, gs, bus);
const req = new RequirementView(game.orders, null, gs, bus);
const sales = new SalesView(game.orders, gs, bus);
const evaluation = new EvaluationView(game);
const settings = new SettingsView(audio, save);

const menu = new MenuView(onMenu);
const entrada = { x: 0, y: 0 };
const touch = new TouchView(entrada, bus);

// Botón ⚙️ del HUD (in-game) → ajustes.
const gearBtn = document.createElement("button");
gearBtn.id = "gear-btn";
gearBtn.textContent = "⚙️";
gearBtn.className = "hidden";
gearBtn.setAttribute("aria-label", "Ajustes");
gearBtn.addEventListener("click", () => settings.open());
document.getElementById("ui").appendChild(gearBtn);

// Botón ⛶ pantalla completa (solo con controles táctiles; en PC está F11 / Ajustes).
const fsBtn = document.createElement("button");
fsBtn.id = "fs-btn";
fsBtn.textContent = "⛶";
fsBtn.className = "hidden";
fsBtn.setAttribute("aria-label", "Pantalla completa");
fsBtn.addEventListener("click", () => toggleFullscreen());
document.getElementById("ui").appendChild(fsBtn);

// Banner de objetivo (slim, centrado arriba) — se actualiza solo.
const objBanner = document.createElement("div");
objBanner.id = "obj-banner";
objBanner.className = "hidden";
document.getElementById("ui").appendChild(objBanner);
function renderObjective() {
  const txt = gs.objective || "";
  objBanner.innerHTML = `<b>🎯 OBJETIVO</b> <span>${txt.replace(/[<>]/g, "")}</span>`;
}
bus.on("objective:changed", renderObjective);

// Al entrar/salir de pantalla completa: recalcular el lienzo y el HUD.
["fullscreenchange", "webkitfullscreenchange"].forEach((e) =>
  document.addEventListener(e, () => {
    document.body.classList.toggle("is-fullscreen", !!(document.fullscreenElement || document.webkitFullscreenElement));
    [0, 120, 350].forEach((d) => setTimeout(() => { try { phaser.scale.refresh(); } catch { /* noop */ } refreshLayout(); }, d));
  }));

// ---------- rutas de estación (SOLO 6) ----------
const STATION_VIEW = {
  orders: () => req.openOrders(),
  coding: () => coding.open(),
  shelf: () => inventory.open(),
  bench: () => crafting.open(),
  sales: () => sales.open(),
  shop: () => shop.open(),
};
bus.on("station:open", (id) => STATION_VIEW[id]?.());
bus.on("open:inventory", () => (document.querySelector(".modal.open, .dialogue.open, .tutorial-root:not(.hidden)") ? bus.emit("ui:close") : inventory.open()));
bus.on("ui:close", () => { document.querySelectorAll(".modal.open").forEach((m) => m.classList.remove("open")); document.querySelector(".rule-pop")?.remove(); });

// ESC funciona SIEMPRE (aunque Phaser tenga el teclado desactivado por un modal)
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { bus.emit("ui:close"); bus.emit("dialogue:closed"); document.querySelector(".dialogue.open")?.classList.remove("open"); }
});
bus.on("order:delivered", (o) => { if (o.isFinal) setTimeout(() => evaluation.open(), 900); });

// ---------- PHASER ----------
let scene = null, inGame = false;
const FORCE_CANVAS = typeof location !== "undefined" && new URLSearchParams(location.search).has("canvas");
const phaser = new Phaser.Game({
  // AUTO: usa WebGL (mucho más rápido en móvil) y cae a Canvas 2D si no hay.
  type: FORCE_CANVAS ? Phaser.CANVAS : Phaser.AUTO,
  parent: "game",
  width: CONFIG.VIEW.width,
  height: CONFIG.VIEW.height,
  backgroundColor: "#161009",
  pixelArt: false,
  roundPixels: true,
  // rAF nativo (sin forceSetTimeOut) = animación fluida y menor consumo.
  fps: { target: 60 },
  loader: { maxParallelDownloads: 6 },   // más suave para móviles y navegadores lentos
  physics: { default: "arcade", arcade: { debug: CONFIG.GAMEPLAY.DEBUG_COLLISIONS } },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CONFIG.VIEW.width,
    height: CONFIG.VIEW.height,
  },
  scene: [BootScene, MenuScene, WorkshopScene],
  callbacks: {
    preBoot: (g) => {
      g.registry.set("bus", bus);
      g.registry.set("gs", gs);
      g.registry.set("entrada", entrada);
      g.registry.set("tick", (dt) => { if (inGame) game.update(dt); });
    },
  },
});

refreshLayout();

phaser.events.on("menu:ready", () => {
  menu.render({ hasSave: save.hasSave() });
  menu.show();
  hud.show(false); touch.show(false); quest.show(false);
  gearBtn.classList.add("hidden");
  fsBtn.classList.add("hidden");
  objBanner.classList.add("hidden");
  audio.setInGame(false);
  updateSoundHint();
  refreshLayout();
  if (sessionStorage.getItem("cc:tutorial") === "1") {
    try { tutorial.open(true); }
    catch (e) { console.warn("tutorial:", e); sessionStorage.removeItem("cc:tutorial"); setTimeout(startGame, 60); }
  }
});

bus.on("tutorial:done", () => {
  sessionStorage.removeItem("cc:tutorial");
  startGame();
});

phaser.events.on("workshop:ready", (sc) => {
  scene = sc; inGame = true;
  document.body.classList.add("in-game");
  hud.show(true); touch.show(true); quest.show(true);
  gearBtn.classList.remove("hidden");
  fsBtn.classList.toggle("hidden", !document.body.classList.contains("controls-on"));
  objBanner.classList.remove("hidden");
  renderObjective();
  audio.setInGame(true);
  hud.render(gs); quest.render();
  refreshLayout();
  phaser.scale.refresh();
  setTimeout(() => phaser.scale.refresh(), 120);
  bus.emit("objective:changed", { text: gs.objective, hintStation: gs.hintStation });

  // El tutorial guiado arranca (o se reanuda) si aún no está completado.
  setTimeout(() => {
    if (!gs.tutorialCompleted) bus.emit("tutorial:begin");
    else bus.emit("game:resume");
  }, 450);
});

function startGame() {
  menu.hide();
  phaser.scene.stop("Menu");
  if (phaser.scene.isActive("Workshop")) phaser.scene.stop("Workshop");
  phaser.scene.start("Workshop");
}

function onMenu(act) {
  if (act === "new") { save.reset(); sessionStorage.setItem("cc:tutorial", "1"); location.reload(); return; }
  if (act === "continue") { startGame(); return; }
  if (act === "how") { try { tutorial.open(false); } catch (e) { console.warn("tutorial:", e); } }
  if (act === "settings") settings.open();
}

// ---------- HUD reactivo ----------
["state:changed", "order:delivered", "challenge:solved", "player:levelup", "craft:done", "shop:bought", "upgrade:bought"]
  .forEach((ev) => bus.on(ev, () => hud.render(gs)));

// botón A táctil
bus.on("ui:activate", () => scene?.activateFromButton());
window.addEventListener("resize", () => phaser.scale.refresh());
window.addEventListener("load", () => phaser.scale.refresh());
phaser.events.on("menu:ready", () => phaser.scale.refresh());

// Reajusta el lienzo de Phaser a la ventana. En móvil, tras 'orientationchange'
// las dimensiones tardan un momento en asentarse: refrescamos varias veces.
function relayoutCanvas() {
  try {
    const w = window.innerWidth || document.documentElement.clientWidth;
    const h = window.innerHeight || document.documentElement.clientHeight;
    if (w > 20 && h > 20) phaser.scale.setParentSize(w, h);
    phaser.scale.refresh();
  } catch { /* noop */ }
}
[0, 120, 320, 600].forEach((d) => setTimeout(relayoutCanvas, d));
["resize", "orientationchange", "focus", "load", "pageshow", "visibilitychange"].forEach((e) =>
  window.addEventListener(e, () => [60, 260, 500].forEach((d) => setTimeout(relayoutCanvas, d))));

// El botón ⛶ sigue a los controles táctiles (aparecen/desaparecen al rotar).
["resize", "orientationchange"].forEach((e) => window.addEventListener(e, () => setTimeout(() => {
  if (!inGame) return;
  fsBtn.classList.toggle("hidden", !document.body.classList.contains("controls-on"));
}, 120)));
setInterval(() => {
  const cv = phaser.canvas;
  if (cv && cv.clientWidth < 20 && (window.innerWidth || 0) > 20) relayoutCanvas();
}, 600);
