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
const { trayIconPath } = require("../config.js");
const path = require("path");

let infoWindow = null;
const infoPath = path.join(__dirname, "../renderer/info/info.html");

const trayIcon = nativeImage
    .createFromPath(trayIconPath)
    .resize({ width: 24, height: 24 });

function createTray(
    iconPath,
    mainWindow,
    nextMusicDirectory,
    addonsDirectory,
    configFilePath,
) {
    const tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: `💖 Next Music ${CURRENT_VERSION} ⚡`,
            enabled: false,
        },
        { type: "separator" },
        {
            label: "Open Next Music folder",
            click: async () => {
                if (!nextMusicDirectory) {
                    console.error("nextMusicDirectory is not defined");
                    return;
                }
                const result = await shell.openPath(
                    path.normalize(nextMusicDirectory),
                );
                if (result) {
                    console.error("Failed to open path:", result);
                }
            },
        },
        {
            label: "Open addons folder",
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
            label: "Open config",
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
            label: "Download extensions",
            click: () =>
                shell.openExternal(
                    "https://github.com/Web-Next-Music/Next-Music-Extensions",
                ),
        },
        {
            label: "Donate",
            click: () => shell.openExternal("https://boosty.to/diramix"),
        },
        { type: "separator" },
        {
            label: "Info",
            click: () => createInfoWindow(iconPath),
        },
        {
            label: "Check updates",
            click: () => {
                checkForUpdates();
            },
        },
        {
            label: "Restart",
            click: () => {
                app.relaunch();
                app.exit(0);
            },
        },
        {
            label: "Quit",
            click: () => {
                // Снимаем все обработчики close, чтобы можно было выйти
                mainWindow.removeAllListeners("close");
                app.quit();
            },
        },
    ]);

    tray.setToolTip("Next Music");
    tray.setContextMenu(contextMenu);

    tray.on("click", () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

function createInfoWindow(icon) {
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

module.exports = { createTray };
