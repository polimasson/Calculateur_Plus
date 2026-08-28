import { el } from "./utils.js?v=1";

export function createWindowManager(ctx) {
    const { W } = ctx;

    function focusWindow(id) {
        const rec = ctx.windows.get(id);
        if (!rec) return;
        rec.el.classList.remove("minimized");
        rec.el.querySelector(`.${W.titleBar}`)?.classList.remove(W.inactiveTitle || "inactive");
        rec.el.style.zIndex = String(++ctx.zTop);
        for (const [otherId, other] of ctx.windows) {
            if (otherId !== id) {
                other.el.querySelector(`.${W.titleBar}`)?.classList.add(W.inactiveTitle || "inactive");
            }
        }
        ctx.tasksEl.querySelectorAll(".task-btn").forEach((b) => {
            b.classList.toggle("active-task", b.dataset.win === id);
        });
    }

    function closeWindow(id) {
        const rec = ctx.windows.get(id);
        if (!rec) return;
        rec.el.remove();
        rec.taskBtn.remove();
        ctx.windows.delete(id);
        ctx.folderWindowRenders.delete(id);
        ctx.taskmgrRender?.();
    }

    function enableDrag(win) {
        const bar = win.querySelector(`.${W.titleBar || "title-bar"}`);
        bar.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            if (e.target.closest("button")) return;
            if (win.classList.contains("maximized")) return;
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const origL = win.offsetLeft;
            const origT = win.offsetTop;
            const iframes = ctx.surface.querySelectorAll("iframe");
            iframes.forEach((f) => (f.style.pointerEvents = "none"));
            const move = (ev) => {
                win.style.left = `${origL + ev.clientX - startX}px`;
                win.style.top = `${Math.max(0, origT + ev.clientY - startY)}px`;
            };
            const up = () => {
                iframes.forEach((f) => (f.style.pointerEvents = ""));
                window.removeEventListener("mousemove", move);
                window.removeEventListener("mouseup", up);
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
            };
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
        });
    }

    function enableResize(win) {
        const attach = (handle, mode) => {
            if (!handle) return;
            handle.addEventListener("mousedown", (e) => {
                if (win.classList.contains("maximized")) return;
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const startY = e.clientY;
                const origW = win.offsetWidth;
                const origH = win.offsetHeight;
                const iframes = ctx.surface.querySelectorAll("iframe");
                iframes.forEach((f) => (f.style.pointerEvents = "none"));
                const move = (ev) => {
                    if (mode === "e" || mode === "se") {
                        win.style.width = `${Math.max(240, origW + ev.clientX - startX)}px`;
                    }
                    if (mode === "s" || mode === "se") {
                        win.style.height = `${Math.max(160, origH + ev.clientY - startY)}px`;
                    }
                };
                const up = () => {
                    iframes.forEach((f) => (f.style.pointerEvents = ""));
                    window.removeEventListener("mousemove", move);
                    window.removeEventListener("mouseup", up);
                    document.removeEventListener("mousemove", move);
                    document.removeEventListener("mouseup", up);
                };
                window.addEventListener("mousemove", move);
                window.addEventListener("mouseup", up);
                document.addEventListener("mousemove", move);
                document.addEventListener("mouseup", up);
            });
        };
        attach(win.querySelector(".wm-resize"), "se");
        attach(win.querySelector(".wm-resize-e"), "e");
        attach(win.querySelector(".wm-resize-s"), "s");
    }

    function createWindow({ id, title, kind, width, height }) {
        if (ctx.windows.has(id)) {
            focusWindow(id);
            return ctx.windows.get(id);
        }

        ctx.winSeq += 1;
        const left = 24 + ((ctx.winSeq * 22) % 140);
        const top = 24 + ((ctx.winSeq * 22) % 100);

        const win = el("div", `${W.className || "window"} wm-window`);
        win.dataset.win = id;
        win.style.left = `${left}px`;
        win.style.top = `${top}px`;
        win.style.width = `${width || 520}px`;
        win.style.height = `${height || 420}px`;
        win.style.zIndex = String(++ctx.zTop);

        win.innerHTML = `
            <div class="${W.titleBar || "title-bar"}">
                <div class="${W.titleBarText || "title-bar-text"}"></div>
                <div class="${W.titleBarControls || "title-bar-controls"}">
                    <button type="button" aria-label="Minimize" data-act="min"></button>
                    <button type="button" aria-label="Maximize" data-act="max"></button>
                    <button type="button" aria-label="Close" data-act="close"></button>
                </div>
            </div>
            <div class="${W.body || "window-body"}"></div>
            <div class="wm-resize-e"></div>
            <div class="wm-resize-s"></div>
            <div class="wm-resize"></div>
        `;
        win.querySelector(`.${W.titleBarText || "title-bar-text"}`).textContent = title;
        const body = win.querySelector(`.${W.body || "window-body"}`);

        const taskBtn = document.createElement("button");
        taskBtn.className = "task-btn";
        taskBtn.dataset.win = id;
        taskBtn.textContent = title;
        taskBtn.addEventListener("click", (e) => {
            if (e.shiftKey && kind === "module") {
                const moduleId = id.replace(/^mod:/, "").replace(/#\d+$/, "");
                ctx.openModuleRef?.(moduleId, true);
                return;
            }
            const rec = ctx.windows.get(id);
            if (!rec) return;
            if (rec.el.classList.contains("minimized")) {
                rec.el.classList.remove("minimized");
                focusWindow(id);
            } else if (Number(rec.el.style.zIndex) === ctx.zTop && !rec.el.classList.contains("minimized")) {
                rec.el.classList.add("minimized");
            } else {
                focusWindow(id);
            }
        });
        ctx.tasksEl.appendChild(taskBtn);

        const rec = { el: win, body, taskBtn, kind, title };
        ctx.windows.set(id, rec);

        win.addEventListener("mousedown", () => focusWindow(id));

        win.querySelector('[data-act="min"]').addEventListener("click", (e) => {
            e.stopPropagation();
            win.classList.add("minimized");
        });
        win.querySelector('[data-act="max"]').addEventListener("click", (e) => {
            e.stopPropagation();
            win.classList.toggle("maximized");
        });
        win.querySelector('[data-act="close"]').addEventListener("click", (e) => {
            e.stopPropagation();
            closeWindow(id);
        });

        enableDrag(win);
        enableResize(win);

        ctx.surface.appendChild(win);
        focusWindow(id);
        ctx.taskmgrRender?.();
        return rec;
    }

    async function toggleFullscreen() {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await (ctx.root.requestFullscreen?.({ navigationUI: "hide" }) || document.documentElement.requestFullscreen?.({ navigationUI: "hide" }));
        } catch {}
    }

    function showPlaceholder(title, msg) {
        const winId = `info:${ctx.winSeq}`;
        const rec = createWindow({
            id: winId,
            title,
            kind: "info",
            width: 380,
            height: 160,
        });
        rec.body.innerHTML = "";
        rec.body.classList.add("props-body");
        const p = document.createElement("p");
        p.className = "note-message";
        p.textContent = msg;
        const footer = el("div", "props-footer");
        const ok = document.createElement("button");
        ok.type = "button";
        ok.textContent = "OK";
        ok.addEventListener("click", () => closeWindow(winId));
        footer.appendChild(ok);
        rec.body.append(p, footer);
    }

    function confirmDialog(title, msg, onOk) {
        const id = `confirm:${ctx.winSeq}`;
        const rec = createWindow({ id, title, kind: "info", width: 400, height: 180 });
        rec.body.innerHTML = "";
        rec.body.classList.add("props-body");
        const p = el("p", "note-message");
        p.textContent = msg;
        const footer = el("div", "props-footer");
        const ok = document.createElement("button");
        ok.type = "button";
        ok.textContent = "Oui";
        ok.addEventListener("click", () => {
            closeWindow(id);
            onOk?.();
        });
        const no = document.createElement("button");
        no.type = "button";
        no.textContent = "Non";
        no.addEventListener("click", () => closeWindow(id));
        footer.append(ok, no);
        rec.body.append(p, footer);
    }

    return { createWindow, closeWindow, focusWindow, enableDrag, enableResize, toggleFullscreen, showPlaceholder, confirmDialog };
}
