const {
    Tray,
    Menu,
    shell,
    BrowserWindow,
    nativeImage,
    app,
} = require("electron");
const { checkForUpdates } = require("../lib/updater");
const { version: CURRENT_VERSION } = require("../../package.json");
const { trayIconPath, getPaths } = require("../config.js");
const { getConfig, setLanguage } = require("../lib/configManager.js");
const {
    initLanguages,
    loadLanguage,
    getAvailableLanguages,
    getCurrentLangCode,
    t,
} = require("../lib/langManager.js");
const path = require("path");

let infoWindow = null;
let trayInstance = null;
let mainWindowRef = null;

const infoPath = path.join(__dirname, "../renderer/info/info.html");

const trayIcon = nativeImage
    .createFromPath(trayIconPath)
    .resize({ width: 24, height: 24 });

// ─── Инициализация языка ───────────────────────────────────────────────────

/**
 * Вызывается один раз при старте приложения.
 * Копирует встроенные языки и загружает язык из конфига.
 */
function setupLanguage() {
    const { languagesDirectory } = getPaths();
    const config = getConfig();
    const langCode = config?.programSettings?.language || "en";
    initLanguages(languagesDirectory, langCode);
}

// ─── Построение меню ───────────────────────────────────────────────────────

function buildContextMenu(nextMusicDirectory, addonsDirectory, configFilePath) {
    const { languagesDirectory } = getPaths();
    const availableLanguages = getAvailableLanguages(languagesDirectory);
    const currentLangCode = getCurrentLangCode();

    // Подменю языков: каждый язык — radio-пункт
    const languageSubmenu = availableLanguages.map((langCode) => ({
        label: langCode,
        type: "radio",
        checked: langCode === currentLangCode,
        click: () => {
            if (langCode === getCurrentLangCode()) return;

            // Загружаем язык и сохраняем в конфиг
            loadLanguage(languagesDirectory, langCode);
            setLanguage(langCode);

            // Перестраиваем меню трея с новым языком
            rebuildTrayMenu(
                nextMusicDirectory,
                addonsDirectory,
                configFilePath,
            );
        },
    }));

    return Menu.buildFromTemplate([
        {
            label: t("tray.appTitle", { version: CURRENT_VERSION }),
            enabled: false,
        },
        { type: "separator" },
        {
            label: t("tray.openMusicFolder"),
            click: async () => {
                if (!nextMusicDirectory) {
                    console.error("nextMusicDirectory is not defined");
                    return;
                }
                const result = await shell.openPath(
                    path.normalize(nextMusicDirectory),
                );
                if (result) console.error("Failed to open path:", result);
            },
        },
        {
            label: t("tray.openAddonsFolder"),
            click: async () => {
                if (!addonsDirectory) {
                    console.error("addonsDirectory is not defined");
                    return;
                }
                const result = await shell.openPath(
                    path.normalize(addonsDirectory),
                );
                if (result) console.error("Failed to open path:", result);
            },
        },
        {
            label: t("tray.openConfig"),
            click: async () => {
                if (!configFilePath) {
                    console.error("configFilePath is not defined");
                    return;
                }
                const result = await shell.openPath(
                    path.normalize(configFilePath),
                );
                if (result) console.error("Failed to open path:", result);
            },
        },
        { type: "separator" },
        {
            label: t("tray.downloadExtensions"),
            click: () =>
                shell.openExternal(
                    "https://github.com/Web-Next-Music/Next-Music-Extensions",
                ),
        },
        {
            label: t("tray.donate"),
            click: () => shell.openExternal("https://boosty.to/diramix"),
        },
        { type: "separator" },
        {
            label: t("tray.language"),
            submenu: languageSubmenu,
        },
        { type: "separator" },
        {
            label: t("tray.info"),
            click: () => createInfoWindow(),
        },
        {
            label: t("tray.checkUpdates"),
            click: () => checkForUpdates(),
        },
        {
            label: t("tray.restart"),
            click: () => {
                app.relaunch();
                app.exit(0);
            },
        },
        {
            label: t("tray.quit"),
            click: () => {
                mainWindowRef?.removeAllListeners("close");
                app.quit();
            },
        },
    ]);
}

function rebuildTrayMenu(nextMusicDirectory, addonsDirectory, configFilePath) {
    if (!trayInstance) return;
    trayInstance.setContextMenu(
        buildContextMenu(nextMusicDirectory, addonsDirectory, configFilePath),
    );
}

// ─── Создание трея ─────────────────────────────────────────────────────────

function createTray(
    iconPath,
    mainWindow,
    nextMusicDirectory,
    addonsDirectory,
    configFilePath,
) {
    mainWindowRef = mainWindow;

    // Инициализируем язык перед построением меню
    setupLanguage();

    trayInstance = new Tray(trayIcon);

    trayInstance.setToolTip("Next Music");
    trayInstance.setContextMenu(
        buildContextMenu(nextMusicDirectory, addonsDirectory, configFilePath),
    );

    trayInstance.on("click", () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

// ─── Информационное окно ───────────────────────────────────────────────────

function createInfoWindow() {
    if (infoWindow) {
        infoWindow.focus();
        return;
    }

    infoWindow = new BrowserWindow({
        width: 585,
        height: 360,
        useContentSize: true,
        resizable: false,
        autoHideMenuBar: true,
        alwaysOnTop: true,
        backgroundColor: "#030117",
        icon: trayIcon,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    infoWindow.loadFile(infoPath);
    infoWindow.setMenu(null);

    infoWindow.on("closed", () => {
        infoWindow = null;
    });
}

module.exports = { createTray, setupLanguage, t };
