// ──────────────────────────────────────────────
// Tofu Translate - bootstrap.js
// Entry point for Zotero 7/9 bootstrapped plugin
// ──────────────────────────────────────────────

var chromeHandle;

/**
 * Install: called when the plugin is first installed.
 */
function install(data, reason) {
  // Will be called after startup() in Zotero 7+
}

/**
 * Startup: called when Zotero starts or plugin is enabled.
 */
async function startup({ id, version, rootURI }, reason) {
  try {
    Zotero.debug("Tofu Translate: Starting up...");

    // Register chrome:// URI so modules can be loaded
    registerChrome(rootURI);

    // Load the main plugin module
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/tofu-translate.js");

    // Initialize the plugin
    await TofuTranslate.init({ id, version, rootURI });

    // Add UI to existing windows
    TofuTranslate.addToAllWindows();

    // Run any async startup tasks
    await TofuTranslate.main();

    Zotero.debug("Tofu Translate: Started successfully.");
  } catch (e) {
    Zotero.debug("Tofu Translate: Startup FAILED — " + e);
    if (e.stack) Zotero.debug(e.stack);
    throw e;
  }
}

/**
 * Register chrome:// URLs for resource loading.
 */
function registerChrome(rootURI) {
  let aomStartup = Cc["@mozilla.org/addons/addon-manager-startup;1"]
    .getService(Ci.amIAddonManagerStartup);
  let manifestURI = Services.io.newURI(rootURI + "manifest.json");
  chromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "tofu-translate", "chrome/content/"],
    ["locale", "tofu-translate", "en-US", "locale/en-US/"],
    ["locale", "tofu-translate", "zh-CN", "locale/zh-CN/"],
  ]);
}

/**
 * Shutdown: called when Zotero shuts down or plugin is disabled.
 */
function shutdown({ id, version, rootURI }, reason) {
  Zotero.debug("Tofu Translate: Shutting down...");

  try {
    // Remove from all windows
    if (typeof TofuTranslate !== "undefined") {
      TofuTranslate.removeFromAllWindows();
      TofuTranslate.shutdown();
    }
  } catch (e) {
    Zotero.debug("Tofu Translate: Shutdown cleanup error — " + e);
  }

  // Destroy chrome registration
  if (chromeHandle) {
    try {
      chromeHandle.destruct();
    } catch (e) {}
    chromeHandle = null;
  }

  Zotero.debug("Tofu Translate: Shut down complete.");
}

/**
 * Uninstall: called when the plugin is removed.
 */
function uninstall(data, reason) {
  try {
    Zotero.Prefs.clearBranch("extensions.tofu-translate.");
  } catch (e) {}
  Zotero.debug("Tofu Translate: Uninstalled.");
}
