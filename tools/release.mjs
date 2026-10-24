// Prepara uma nova versão do Prumo: site + app de bandeja do Windows.
// Uso: npm run release -- 1.2.0     (sem número, só reconstrói o app na versão atual)
//
// 1. Grava o número da versão em index.html, version.json, sw.js e desktop/neutralino.config.json.
// 2. Monta desktop/resources/ (index.html com a ponte do app + ícones) e roda `neu build`.
// 3. Publica em app/: Prumo-Windows.zip (download), resources.neu e update.json (atualização automática).
// Depois é só fazer commit e push: o site e o app instalado se atualizam sozinhos.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DESK = join(ROOT, "desktop");
const APP = join(ROOT, "app");
const SITE = "https://erosxv.github.io/prumo/";
const at = (...p) => join(ROOT, ...p);
const edit = (file, fn) => writeFileSync(file, fn(readFileSync(file, "utf8")));

const cfgFile = join(DESK, "neutralino.config.json");
const cfg = JSON.parse(readFileSync(cfgFile, "utf8"));
const version = process.argv[2] || cfg.version;
if (!/^\d+\.\d+\.\d+$/.test(version)) { console.error("Versão inválida: use algo como 1.2.0"); process.exit(1); }

// 1. versão em todos os lugares
edit(at("index.html"), s => s.replace(/const VERSION = "[^"]*";/, `const VERSION = "${version}";`));
writeFileSync(at("version.json"), JSON.stringify({ version }) + "\n");
edit(at("sw.js"), s => s.replace(/const CACHE = "prumo-[^"]*";/, `const CACHE = "prumo-${version}";`));
cfg.version = version;
writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + "\n");

// 2. recursos do app
const res = join(DESK, "resources");
mkdirSync(join(res, "icons"), { recursive: true });
const html = readFileSync(at("index.html"), "utf8")
  .replace("<head>", "<head>\n<script>window.PRUMO_DESKTOP = true;</script>")
  .replace(/<link rel="manifest"[^>]*>\n/, "")
  .replace("</body>", '<script src="js/neutralino.js"></script>\n<script src="desktop.js"></script>\n</body>');
writeFileSync(join(res, "index.html"), html);
copyFileSync(at("icons", "icon-192.png"), join(res, "icons", "app.png"));
copyFileSync(at("icons", "tray.png"), join(res, "icons", "tray.png"));
copyFileSync(at("icons", "icon.ico"), join(res, "icons", "app.ico"));

const neu = join(ROOT, "node_modules", ".bin", "neu");
if (!existsSync(join(DESK, "bin", "neutralino-win_x64.exe"))) execSync(`"${neu}" update`, { cwd: DESK, stdio: "inherit" });
rmSync(join(DESK, "dist"), { recursive: true, force: true });
execSync(`"${neu}" build`, { cwd: DESK, stdio: "inherit" });

// 3. arquivos publicados
const dist = join(DESK, "dist", "Prumo");
const pack = join(DESK, "dist", "pack", "Prumo");
mkdirSync(pack, { recursive: true });
mkdirSync(APP, { recursive: true });
copyFileSync(join(dist, "Prumo-win_x64.exe"), join(pack, "Prumo.exe"));
copyFileSync(join(dist, "resources.neu"), join(pack, "resources.neu"));
copyFileSync(join(dist, "resources.neu"), join(APP, "resources.neu"));
const zip = join(APP, "Prumo-Windows.zip");
rmSync(zip, { force: true });
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${pack}' -DestinationPath '${zip}'"`, { stdio: "inherit" });
writeFileSync(join(APP, "update.json"), JSON.stringify({
  applicationId: cfg.applicationId,
  version,
  resourcesURL: SITE + "app/resources.neu",
  data: {},
}, null, 2) + "\n");

console.log(`\nPrumo ${version} pronto. Agora: git add -A, git commit e git push.`);
