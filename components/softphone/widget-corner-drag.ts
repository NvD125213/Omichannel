export type SoftphoneCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

const CORNER_ATTR = "data-softphone-corner";
const STORAGE_KEY = "softphone-widget-corner";
const GHOST_ID = "pwBackground-drag-ghost";
const DRAG_THRESHOLD_PX = 8;
const EDGE_GAP_PX = 10;

const CORNERS: SoftphoneCorner[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

/** True from pointerdown until pointerup — blocks MutationObserver rebind. */
let gestureActive = false;

function isCorner(value: string | null): value is SoftphoneCorner {
  return CORNERS.includes(value as SoftphoneCorner);
}

function readStoredCorner(): SoftphoneCorner {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (isCorner(raw)) return raw;
  } catch {}
  return "bottom-right";
}

function clearInlinePosition(el: HTMLElement) {
  el.style.removeProperty("top");
  el.style.removeProperty("left");
  el.style.removeProperty("right");
  el.style.removeProperty("bottom");
  el.style.removeProperty("transform");
  el.style.removeProperty("opacity");
  el.style.removeProperty("pointer-events");
}

function applyCorner(corner: SoftphoneCorner) {
  const targets = [
    document.getElementById("pwBackground"),
    document.getElementById("ppContainer"),
  ];

  for (const el of targets) {
    if (!(el instanceof HTMLElement)) continue;
    clearInlinePosition(el);
    el.setAttribute(CORNER_ATTR, corner);
    el.classList.remove("is-dragging");
  }

  try {
    localStorage.setItem(STORAGE_KEY, corner);
  } catch {}
}

function nearestCorner(clientX: number, clientY: number): SoftphoneCorner {
  const midX = window.innerWidth / 2;
  const midY = window.innerHeight / 2;
  const isLeft = clientX < midX;
  const isTop = clientY < midY;
  if (isTop && isLeft) return "top-left";
  if (isTop && !isLeft) return "top-right";
  if (!isTop && isLeft) return "bottom-left";
  return "bottom-right";
}

function removeGhost() {
  document.getElementById(GHOST_ID)?.remove();
}

function getFab(): HTMLElement | null {
  const el = document.getElementById("pwBackground");
  return el instanceof HTMLElement ? el : null;
}

/** Disable native HTML5 drag on logo <img>/<a> (center of the FAB). */
function neutralizeNativeDrag(fab: HTMLElement) {
  fab.querySelectorAll("img, a").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.setAttribute("draggable", "false");
    node.ondragstart = () => false;
  });
}

/**
 * Drag a detached ghost so TeleSIP/Vue cannot reset our position mid-drag.
 * Click without movement still opens the dialpad via Vue @click on #pwButton.
 */
function bindDrag(initialFab: HTMLElement): () => void {
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;
  let width = 60;
  let height = 60;
  let armed = false;
  let moved = false;
  let suppressClick = false;
  let ghost: HTMLElement | null = null;

  neutralizeNativeDrag(initialFab);

  const placeGhost = (left: number, top: number) => {
    if (!ghost) return;
    ghost.style.left = `${left}px`;
    ghost.style.top = `${top}px`;
  };

  const restoreFab = () => {
    const fab = getFab() ?? initialFab;
    fab.classList.remove("is-dragging");
    fab.style.removeProperty("opacity");
    fab.style.removeProperty("pointer-events");
  };

  const beginDrag = (event: PointerEvent) => {
    if (moved) return;
    moved = true;
    suppressClick = true;

    event.preventDefault();
    event.stopImmediatePropagation();

    const fab = getFab() ?? initialFab;
    const rect = fab.getBoundingClientRect();
    originLeft = rect.left;
    originTop = rect.top;
    width = rect.width || width;
    height = rect.height || height;
    startX = event.clientX;
    startY = event.clientY;

    removeGhost();
    ghost = fab.cloneNode(true) as HTMLElement;
    ghost.id = GHOST_ID;
    ghost.removeAttribute(CORNER_ATTR);
    ghost.classList.add("is-dragging");
    ghost.style.cssText = [
      "position:fixed",
      `left:${originLeft}px`,
      `top:${originTop}px`,
      `width:${width}px`,
      `height:${height}px`,
      "right:auto",
      "bottom:auto",
      "margin:0",
      "z-index:100001",
      "pointer-events:none",
      "cursor:grabbing",
      "transition:none",
      "animation:none",
      "box-sizing:border-box",
    ].join(";");
    document.body.appendChild(ghost);

    fab.classList.add("is-dragging");
    fab.style.setProperty("opacity", "0", "important");
    fab.style.setProperty("pointer-events", "none", "important");
  };

  const isOnFab = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Node)) return false;
    if (target instanceof Element && target.id === GHOST_ID) return true;
    if (target instanceof Element && target.closest(`#${GHOST_ID}`)) {
      return true;
    }

    const fab = getFab() ?? initialFab;
    return fab.contains(target);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if (!isOnFab(event)) return;

    const fab = getFab() ?? initialFab;
    neutralizeNativeDrag(fab);

    // Prevent browser native image/link drag from the center logo.
    // Click-to-open (#pwButton @click) still works on pointerup/click.
    event.preventDefault();

    const rect = fab.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    originLeft = rect.left;
    originTop = rect.top;
    width = rect.width || 60;
    height = rect.height || 60;
    armed = true;
    moved = false;
    gestureActive = true;
  };

  const onDragStart = (event: DragEvent) => {
    if (!isOnFab(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!armed) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (!moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      beginDrag(event);
      placeGhost(originLeft, originTop);
      return;
    }

    event.preventDefault();

    const maxLeft = Math.max(
      EDGE_GAP_PX,
      window.innerWidth - width - EDGE_GAP_PX,
    );
    const maxTop = Math.max(
      EDGE_GAP_PX,
      window.innerHeight - height - EDGE_GAP_PX,
    );
    const nextLeft = Math.min(maxLeft, Math.max(EDGE_GAP_PX, originLeft + dx));
    const nextTop = Math.min(maxTop, Math.max(EDGE_GAP_PX, originTop + dy));
    placeGhost(nextLeft, nextTop);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!armed) return;
    armed = false;
    gestureActive = false;

    if (!moved) return;

    event.preventDefault();
    event.stopPropagation();

    const ghostRect = ghost?.getBoundingClientRect();
    const cx = ghostRect ? ghostRect.left + ghostRect.width / 2 : event.clientX;
    const cy = ghostRect ? ghostRect.top + ghostRect.height / 2 : event.clientY;

    removeGhost();
    ghost = null;
    restoreFab();
    applyCorner(nearestCorner(cx, cy));
  };

  const onClickCapture = (event: MouseEvent) => {
    if (!suppressClick) return;
    if (!isOnFab(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClick = false;
  };

  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("dragstart", onDragStart, true);
  document.addEventListener("pointermove", onPointerMove, {
    capture: true,
    passive: false,
  });
  document.addEventListener("pointerup", onPointerUp, true);
  document.addEventListener("pointercancel", onPointerUp, true);
  document.addEventListener("click", onClickCapture, true);

  return () => {
    gestureActive = false;
    removeGhost();
    restoreFab();
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("dragstart", onDragStart, true);
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("pointercancel", onPointerUp, true);
    document.removeEventListener("click", onClickCapture, true);
  };
}

/**
 * Watch for TeleSIP `#pwBackground` and enable drag-to-corner.
 * Returns a disposer for the observer + drag bindings.
 */
export function enableSoftphoneCornerDrag(): () => void {
  if (typeof document === "undefined") return () => {};

  let unbindDrag: (() => void) | null = null;
  let attachedEl: HTMLElement | null = null;

  const sync = () => {
    if (gestureActive) return;

    const fab = getFab();
    const panel = document.getElementById("ppContainer");
    const corner = readStoredCorner();

    if (fab) {
      neutralizeNativeDrag(fab);
      if (attachedEl !== fab) {
        unbindDrag?.();
        attachedEl = fab;
        unbindDrag = bindDrag(fab);
        applyCorner(corner);
      } else if (!fab.hasAttribute(CORNER_ATTR)) {
        applyCorner(corner);
      }
    } else {
      unbindDrag?.();
      unbindDrag = null;
      attachedEl = null;
    }

    if (panel instanceof HTMLElement) {
      const current = fab?.getAttribute(CORNER_ATTR) ?? null;
      const next = isCorner(current) ? current : corner;
      if (panel.getAttribute(CORNER_ATTR) !== next) {
        clearInlinePosition(panel);
        panel.setAttribute(CORNER_ATTR, next);
      }
    }
  };

  sync();
  const bootTimer = window.setTimeout(sync, 500);

  const observer = new MutationObserver(() => {
    if (gestureActive) return;
    sync();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    window.clearTimeout(bootTimer);
    observer.disconnect();
    unbindDrag?.();
    attachedEl = null;
    gestureActive = false;
    removeGhost();
  };
}
