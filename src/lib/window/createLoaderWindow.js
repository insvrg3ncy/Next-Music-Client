const { BrowserWindow } = require("electron");
const { appIcon } = require("../../config");
const path = require("path");

const loaderPath = path.join(__dirname, "../../renderer/loader/loader.html");

function createLoaderWindow() {
    loaderWindow = new BrowserWindow({
        width: 240,
        height: 280,
        backgroundColor: "#000",
        show: true,
        resizable: false,
        fullscreenable: false,
        movable: true,
        frame: false,
        transparent: false,
        roundedCorners: true,
        icon: appIcon,
    });
    loaderWindow.loadURL(`file://${loaderPath}`);
    return loaderWindow;
}

module.exports = { createLoaderWindow };
