// Ponte entre o Prumo (index.html) e o app de bandeja do Windows (Neutralino).
// - Fechar a janela só esconde: o Prumo continua na bandeja, perto do relógio.
// - Avisos do timer viram notificações do Windows.
// - Atualizações: procura ao abrir e a cada 6 horas, instala sozinho e reinicia
//   na hora se a janela estiver escondida (senão, pergunta com um aviso).
(() => {
  const UPDATE_URL = "https://erosxv.github.io/prumo/app/update.json";
  const RUN_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
  const STARTUP = "--startup";
  const toast = (...a) => window.prumo?.toast?.(...a);
  const newer = (a, b) => {
    const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
    for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    return false;
  };
  const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

  window.prumoHost = {
    notify(title, body) { Neutralino.os.showNotification(title, body).catch(() => {}); },
    async saveFile(name, text) {
      const path = await Neutralino.os.showSaveDialog("Salvar backup do Prumo", { defaultPath: name, filters: [{ name: "Backup do Prumo", extensions: ["json"] }] });
      if (!path) return false;
      await Neutralino.filesystem.writeFile(/\.json$/i.test(path) ? path : path + ".json", text);
      return true;
    },
    async openFile() {
      const [path] = await Neutralino.os.showOpenDialog("Abrir backup do Prumo", { filters: [{ name: "Backup do Prumo", extensions: ["json"] }] });
      return path ? Neutralino.filesystem.readFile(path) : null;
    },
  };

  Neutralino.init();

  // ---------- janela e bandeja ----------
  async function showWindow() {
    await Neutralino.window.show();
    await Neutralino.window.unminimize().catch(() => {});
    await Neutralino.window.focus();
  }
  async function hideWindow() {
    await Neutralino.window.hide();
    if (!lsGet("prumo-tray-hint")) {
      lsSet("prumo-tray-hint", "1");
      window.prumoHost.notify("O Prumo continua aberto", "Ele fica no ícone perto do relógio. Para fechar de vez, clique nele e escolha Sair.");
    }
  }

  const exePath = () => (NL_ARGS[0] || "").replace(/\//g, "\\");
  async function autostartOn() {
    try { const r = await Neutralino.os.execCommand(`reg query "${RUN_KEY}" /v Prumo`); return r.exitCode === 0; }
    catch { return false; }
  }
  async function setAutostart(on) {
    const cmd = on
      ? `reg add "${RUN_KEY}" /v Prumo /t REG_SZ /d "\\"${exePath()}\\" ${STARTUP}" /f`
      : `reg delete "${RUN_KEY}" /v Prumo /f`;
    await Neutralino.os.execCommand(cmd).catch(() => {});
  }

  async function setTray() {
    const auto = await autostartOn();
    await Neutralino.os.setTray({
      icon: "/resources/icons/tray.png",
      menuItems: [
        { id: "open", text: "Abrir o Prumo" },
        { text: "-" },
        { id: "autostart", text: "Abrir junto com o Windows", isChecked: auto },
        { id: "update", text: "Procurar atualização" },
        { text: "-" },
        { id: "quit", text: "Sair" },
      ],
    });
  }

  Neutralino.events.on("windowClose", hideWindow);
  Neutralino.events.on("trayMenuItemClicked", async e => {
    switch (e.detail.id) {
      case "open": showWindow(); break;
      case "autostart": await setAutostart(!(await autostartOn())); setTray(); break;
      case "update": await showWindow(); checkUpdate(true); break;
      case "quit": Neutralino.app.exit(); break;
    }
  });

  // ---------- uma cópia só ----------
  // Todas as cópias abrem a mesma página (mesmo endereço e perfil), então conversam por BroadcastChannel.
  // A cópia nova costuma ficar sem acesso ao Windows (o servidor da primeira atende a página dela),
  // então é a primeira que aparece na tela e fecha as outras.
  const channel = new BroadcastChannel("prumo-instance");
  let leaving = false;
  channel.addEventListener("message", e => {
    if (leaving) return;
    if (e.data === "ping") channel.postMessage("pong");
    if (e.data === "newcomer") {
      showWindow();
      const exe = exePath().split("\\").pop();
      setTimeout(() => Neutralino.os.execCommand(`taskkill /F /FI "IMAGENAME eq ${exe}" /FI "PID ne ${NL_PID}"`).catch(() => {}), 1500);
    }
  });
  const alone = new Promise(resolve => {
    const done = v => { channel.removeEventListener("message", onMsg); resolve(v); };
    const onMsg = e => { if (e.data === "pong") done(false); };
    channel.addEventListener("message", onMsg);
    channel.postMessage("ping");
    setTimeout(() => done(true), 800);
  }).then(ok => { if (!ok) { leaving = true; channel.postMessage("newcomer"); } return ok; });
  function restart(args) {
    leaving = true; // a cópia nova não pode achar que esta ainda está aberta
    Neutralino.app.restartProcess(args ? { args } : undefined);
  }

  // ---------- atualização automática ----------
  let installed = null;
  async function checkUpdate(manual) {
    if (installed) { if (manual) offerRestart(); return; }
    try {
      const m = await Neutralino.updater.checkForUpdates(UPDATE_URL);
      if (!m || !newer(m.version, NL_APPVERSION)) { if (manual) toast(`Você já está na versão mais nova (${NL_APPVERSION}).`); return; }
      await Neutralino.updater.install();
      installed = m.version;
      if (!(await Neutralino.window.isVisible())) restart(STARTUP);
      else offerRestart();
    } catch {
      if (manual) toast("Não consegui procurar atualizações agora. Confira a internet.");
    }
  }
  function offerRestart() {
    toast(`Prumo ${installed} instalado.`, "Reiniciar agora", () => restart(), true);
  }

  Neutralino.events.on("ready", async () => {
    if (NL_ARGS.includes(STARTUP)) Neutralino.window.hide();
    if (!(await alone)) { Neutralino.app.exit(); return; }
    setTray();
    setTimeout(checkUpdate, 5000);
    setInterval(checkUpdate, 6 * 3600 * 1000);
  });
})();
