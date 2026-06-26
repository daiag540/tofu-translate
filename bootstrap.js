// ──────────────────────────────────────────────
// Tofu Translate - bootstrap.js
// Entry point for Zotero 7 bootstrapped plugin
// ──────────────────────────────────────────────

var chromeHandle;

/**
 * Install: called when the plugin is first installed.
 */
function install(data, reason) {
  // Will be called after startup() in Zotero 7
}

/**
 * Startup: called when Zotero starts or plugin is enabled.
 */
async function startup({ id, version, rootURI }, reason) {
  Zotero.log("Tofu Translate: Starting up...");

  // Register chrome:// URI so modules can be loaded via ChromeUtils
  registerChrome(rootURI);

  // Load the main plugin module
  Services.scriptloader.loadSubScript(rootURI + "chrome/content/tofu-translate.js");

  // Initialize the plugin
  await TofuTranslate.init({ id, version, rootURI });

  // Add UI to existing windows
  TofuTranslate.addToAllWindows();

  // Run any async startup tasks
  await TofuTranslate.main();

  Zotero.log("Tofu Translate: Started successfully.");
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
  Zotero.log("Tofu Translate: Shutting down...");

  // Remove from all windows
  TofuTranslate.removeFromAllWindows();

  // Run cleanup
  TofuTranslate.shutdown();

  // Destroy chrome registration
  if (chromeHandle) {
    chromeHandle.destruct();
    chromeHandle = null;
  }

  // Null out the global reference
  // (Cu.unload not strictly needed but helps GC)
  Components.utils.forceGC();

  Zotero.log("Tofu Translate: Shut down complete.");
}

/**
 * Uninstall: called when the plugin is removed.
 */
function uninstall(data, reason) {
  // Clean up stored preferences
  Zotero.Prefs.clearBranch("extensions.tofu-translate.");
  Zotero.log("Tofu Translate: Uninstalled.");
}

// ── Window lifecycle (Zotero 7) ──────────────────────────────

function onMainWindowLoad({ window }) {
  TofuTranslate.addToWindow(window);
}

function onMainWindowUnload({ window }) {
  TofuTranslate.removeFromWindow(window);
}
