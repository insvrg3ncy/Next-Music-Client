const {
    Tray,
    Menu,
    shell,
    BrowserWindow,
    nativeImage,
    app,
    ipcMain,
} = require("electron");
const { checkForUpdates } = require("../lib/updater");
const { version: CURRENT_VERSION } = require("../../package.json");
const { trayIconPath, getPaths } = require("../config.js");
const { getConfig } = require("../lib/configManager.js");
const {
    createSettingsWindow,
    setTrayRebuilder,
} = require("./window/settingsWindow/createSettingsWindow.js");
const { initLanguages, t } = require("../lib/langManager.js");
const { createInfoWindow } = require("./window/createInfoWindow.js");
const { createInfoV2Window } = require("./window/createInfoV2Window.js");
const config = getConfig();
const path = require("path");

let trayInstance = null;
let mainWindowRef = null;

const trayIcon = nativeImage
    .createFromPath(trayIconPath)
    .resize({ width: 24, height: 24 });

function setupLanguage() {
    const { languagesDirectory } = getPaths();
    const config = getConfig();
    const langCode = config?.programSettings?.language || "en";
    initLanguages(languagesDirectory, langCode);
}

function buildContextMenu(nextMusicDirectory, addonsDirectory, configFilePath) {
    const { languagesDirectory } = getPaths();

    return Menu.buildFromTemplate([
        {
            label: t("tray.appTitle", { version: CURRENT_VERSION }),
            enabled: false,
        },
        { type: "separator" },
        {
            label: t("tray.openFolders"),
            submenu: [
                {
                    label: t("tray.openMusicFolder"),
                    click: async () => {
                        if (!nextMusicDirectory) return;
                        await shell.openPath(
                            path.normalize(nextMusicDirectory),
                        );
                    },
                },
                {
                    label: t("tray.openAddonsFolder"),
                    click: async () => {
                        if (!addonsDirectory) return;
                        await shell.openPath(path.normalize(addonsDirectory));
                    },
                },
                {
                    label: t("tray.openLanguageFolder"),
                    click: async () => {
                        if (!languagesDirectory) return;
                        await shell.openPath(
                            path.normalize(languagesDirectory),
                        );
                    },
                },
                {
                    label: t("tray.openConfig"),
                    click: async () => {
                        if (!configFilePath) return;
                        await shell.openPath(path.normalize(configFilePath));
                    },
                },
            ],
        },
        {
            label: t("tray.settings"),
            click: () => createSettingsWindow(),
        },
        { type: "separator" },
        {
            label: t("tray.extensionRepository"),
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
            label: t("tray.info"),
            click: () => selInfoVer(),
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

function createTray(
    iconPath,
    mainWindow,
    nextMusicDirectory,
    addonsDirectory,
    configFilePath,
) {
    mainWindowRef = mainWindow;

    setupLanguage();

    trayInstance = new Tray(trayIcon);
    trayInstance.setToolTip("Next Music");
    trayInstance.setContextMenu(
        buildContextMenu(nextMusicDirectory, addonsDirectory, configFilePath),
    );

    setTrayRebuilder(() =>
        rebuildTrayMenu(nextMusicDirectory, addonsDirectory, configFilePath),
    );

    trayInstance.on("click", () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

function selInfoVer() {
    if (config?.labs?.nm_info_v2 == false) {
        createInfoWindow();
    } else {
        createInfoV2Window();
    }
}

ipcMain.on("close-window", () => {
    const infoWindow = BrowserWindow.getFocusedWindow();
    if (infoWindow) infoWindow.close();
});

ipcMain.on("get-lang-info", (event) => {
    const { languagesDirectory } = getPaths();
    const langCode = getConfig().programSettings?.language ?? "en";
    event.returnValue = { languagesDirectory, langCode };
});

module.exports = { createTray, setupLanguage, t };
