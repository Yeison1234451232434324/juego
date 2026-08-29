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
import { PromptView } from "./views/PromptView.js";
import { DialogueView } from "./views/DialogueView.js";
import { TutorialView } from "./views/TutorialView.js";
import { LoadingView } from "./views/LoadingView.js";
import { NotificationView } from "./views/NotificationView.js";
import { MenuView } from "./views/MenuView.js";
import { CodingStationView } from "./views/CodingStationView.js";
import { CraftingView } from "./views/CraftingView.js";
import { CutterView } from "./views/CutterView.js";
import { InventoryView } from "./views/InventoryView.js";
import { ShopView } from "./views/ShopView.js";
import { RequirementView } from "./views/RequirementView.js";
import { SalesView } from "./views/SalesView.js";
import { EvaluationView } from "./views/EvaluationView.js";
import { TouchView } from "./views/TouchView.js";

// ---------- aviso pantalla pequeña ----------
const rh = document.getElementById("rotate-hint");
if (window.innerWidth < 780) rh.classList.remove("hidden");
document.getElementById("rotate-ok").addEventListener("click", () => rh.classList.add("hidden"));

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
bus.on("order:delivered", () => audio.play("coins"));
bus.on("craft:done", () => audio.play("craft"));
bus.on("player:levelup", () => audio.play("level"));
bus.on("achievement:unlocked", () => audio.play("achieve"));

// ---------- CONTROLADOR ----------
const game = new GameController(gs, bus, save);

// ---------- VISTAS ----------
const hud = new HUDView();
new PromptView(bus);
new DialogueView(bus);
new NotificationView(bus);
const tutorial = new TutorialView(bus);
new LoadingView(bus);

const coding = new CodingStationView(game.programming, bus);
const crafting = new CraftingView(game.crafting, gs, bus);
const cutter = new CutterView(game.workshop, gs, bus);
const inventory = new InventoryView(gs, bus);
const shop = new ShopView(game.workshop, game.upgrades, gs, bus);
const req = new RequirementView(game.orders, game.requirements, gs, bus);
const sales = new SalesView(game.orders, gs, bus);
const evaluation = new EvaluationView(game);

const menu = new MenuView(onMenu);
const entrada = { x: 0, y: 0 };
const touch = new TouchView(entrada, bus);

// ---------- rutas de estación ----------
const STATION_VIEW = {
  coding: () => coding.open(),
  arch: () => req.openArch(),
  orders: () => req.openOrders(),
  sales: () => sales.open(),
  bench: () => crafting.open(),
  cutter: () => cutter.open(),
  shelf: () => inventory.open(),
  storage: () => inventory.open(),
  shop: () => shop.open(),
};
bus.on("station:open", (id) => STATION_VIEW[id]?.());
bus.on("open:inventory", () => (document.querySelector(".modal.open") ? bus.emit("ui:close") : inventory.open()));
bus.on("ui:close", () => { document.querySelectorAll(".modal.open").forEach((m) => m.classList.remove("open")); document.querySelector(".rule-pop")?.remove(); });

// ESC funciona SIEMPRE (aunque Phaser tenga el teclado desactivado por un modal)
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { bus.emit("ui:close"); bus.emit("dialogue:closed"); document.querySelector(".dialogue.open")?.classList.remove("open"); }
});
bus.on("order:delivered", (o) => { if (o.isFinal) setTimeout(() => evaluation.open(), 900); });

// ---------- PHASER ----------
let scene = null, inGame = false;
const phaser = new Phaser.Game({
  // Canvas: el WebGL de este navegador embebido renderiza en negro con muchas
  // texturas SVG. Canvas 2D es más lento pero para un taller compacto sobra.
  type: Phaser.CANVAS,
  parent: "game",
  width: CONFIG.VIEW.width,
  height: CONFIG.VIEW.height,
  backgroundColor: "#161009",
  pixelArt: false,
  roundPixels: true,
  fps: { target: 60, forceSetTimeOut: true },
  physics: { default: "arcade", arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
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

phaser.events.on("menu:ready", () => {
  menu.render({ hasSave: save.hasSave() });
  menu.show();
  hud.show(false); touch.show(false);
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
  hud.show(true); touch.show(true);
  hud.render(gs);
  phaser.scale.refresh();
  setTimeout(() => phaser.scale.refresh(), 120);
  bus.emit("objective:changed", { text: gs.objective, hintStation: gs.hintStation });

  if (!gs.introSeen) {
    gs.introSeen = true;
    setTimeout(() => bus.emit("dialogue:open", {
      name: "BYTE",
      lines: [
        "Soy BYTE. Tenemos el primer pedido: una silla.",
        "Sigue el marcador 💡 hasta la computadora 💻 y pulsa E para empezar.",
      ],
    }), 500);
  }
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
}

// ---------- HUD reactivo ----------
["state:changed", "order:delivered", "challenge:solved", "player:levelup", "craft:done", "shop:bought", "upgrade:bought"]
  .forEach((ev) => bus.on(ev, () => hud.render(gs)));

// botón A táctil
bus.on("ui:activate", () => scene?.activateFromButton());
window.addEventListener("resize", () => phaser.scale.refresh());
window.addEventListener("load", () => phaser.scale.refresh());
phaser.events.on("menu:ready", () => phaser.scale.refresh());

// Algunos navegadores embebidos arrancan con el viewport a 0 y no emiten
// 'resize' al recuperarlo: forzamos el tamaño del canvas hasta que sea válido.
function fixScale() {
  const cv = phaser.canvas;
  if (!cv) return;
  const w = window.innerWidth || document.documentElement.clientWidth;
  const h = window.innerHeight || document.documentElement.clientHeight;
  if (w > 20 && h > 20 && (cv.clientWidth < 20 || cv.clientHeight < 20)) {
    try {
      phaser.scale.setParentSize(w, h);
      phaser.scale.refresh();
      const s = Math.min(w / CONFIG.VIEW.width, h / CONFIG.VIEW.height);
      cv.style.width = Math.round(CONFIG.VIEW.width * s) + "px";
      cv.style.height = Math.round(CONFIG.VIEW.height * s) + "px";
    } catch { /* noop */ }
  }
}
setInterval(fixScale, 400);
["resize", "focus", "load", "pageshow", "visibilitychange"].forEach((e) =>
  window.addEventListener(e, () => setTimeout(fixScale, 50)));
