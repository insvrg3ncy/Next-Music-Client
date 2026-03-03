const { getPaths, defaultConfig } = require("../config.js");
const fs = require("fs");

let config;

function loadConfig() {
    const { nextMusicDirectory, addonsDirectory, configFilePath } = getPaths();

    if (!fs.existsSync(nextMusicDirectory))
        fs.mkdirSync(nextMusicDirectory, { recursive: true });

    if (!fs.existsSync(addonsDirectory))
        fs.mkdirSync(addonsDirectory, { recursive: true });

    if (!fs.existsSync(configFilePath)) {
        fs.writeFileSync(
            configFilePath,
            JSON.stringify(defaultConfig, null, 2),
            "utf-8",
        );
        config = structuredClone(defaultConfig);
        return config;
    }

    try {
        const raw = fs.readFileSync(configFilePath, "utf-8");
        config = JSON.parse(raw);
    } catch {
        config = structuredClone(defaultConfig);
        fs.writeFileSync(
            configFilePath,
            JSON.stringify(config, null, 2),
            "utf-8",
        );
    }

    return config;
}

function getConfig() {
    if (!config) return loadConfig();
    return config;
}

module.exports = { getConfig };
