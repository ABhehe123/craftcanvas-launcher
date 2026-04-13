const { app, BrowserWindow, ipcMain, shell, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs'); 
const os = require('os'); 
const { exec } = require('child_process'); 
const https = require('https'); 
const { Client, Authenticator } = require('minecraft-launcher-core');
const { Auth } = require('msmc'); 

// --- CENTRALIZED JAVA CONFIGURATION ---
const JAVA_EXEC = "C:\\Program Files\\Java\\jdk-17\\bin\\java.exe";


let mainWindow;
let tray = null;
let activeDownloadFolder = null; 

// --- ANTI-CORRUPTION FAILSAFE ---
app.on('before-quit', () => {
    if (activeDownloadFolder && fs.existsSync(activeDownloadFolder)) {
        console.log("App closed during download! Deleting corrupted files...");
        fs.rmSync(activeDownloadFolder, { recursive: true, force: true });
    }
});

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) app.quit();
else {
  
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

function createWindow () {
    mainWindow = new BrowserWindow({
      width: 1280, height: 800, backgroundColor: '#f8f9fd', autoHideMenuBar: true,
      icon: path.join(__dirname, '../../assets/icon.png'), 
      webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true }
    });
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // --- NEW: HIJACK THE CLOSE BUTTON ---
    mainWindow.on('close', (event) => {
        event.preventDefault(); // Stop the app from closing
        mainWindow.hide();      // Hide it to the system tray instead!
    });
  }

  const launcher = new Client();

  // ==========================================
  // FIXED: BULLETPROOF DOWNLOADER & API FETCH
  // ==========================================
  function fetchJson(url) {
      return new Promise((resolve, reject) => {
          https.get(url, { headers: { 'User-Agent': 'CraftCanvas-Launcher/1.0' } }, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                  try { resolve(JSON.parse(data)); } 
                  catch (e) { reject(e); }
              });
          }).on('error', reject);
      });
  }

  function downloadFile(requestUrl, dest) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      
      const options = {
          headers: {
              'User-Agent': 'CraftCanvas-Launcher/1.0',
              'Cache-Control': 'no-cache', // Prevents the 304 error
              'Pragma': 'no-cache'
          }
      };

      https.get(requestUrl, options, (response) => {
        // Handle Redirects safely
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
            file.close();
            let redirectUrl;
            // FIX: If the server gives a relative URL (like OptiFine does), build the full absolute URL!
            if (response.headers.location.startsWith('http')) {
                redirectUrl = response.headers.location;
            } else {
                const baseUrl = new URL(requestUrl);
                redirectUrl = `${baseUrl.protocol}//${baseUrl.host}${response.headers.location}`;
            }
            return downloadFile(redirectUrl, dest).then(resolve).catch(reject);
        }
        
        // Reject anything that isn't 200 OK
        if (response.statusCode !== 200) {
            file.close();
            fs.unlink(dest, () => {});
            return reject(new Error(`Download failed: HTTP Status ${response.statusCode} from ${requestUrl}`));
        }
        
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (err) => { 
          file.close(); 
          fs.unlink(dest, () => {}); 
          reject(err); 
      });
    });
  }

// --- HELPER: Run hidden terminal commands ---
  function execPromise(command) {
      return new Promise((resolve, reject) => {
          // FIX: Added { maxBuffer: 1024 * 1024 * 50 } to allow 50MB of console logs!
          exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout) => {
              if (error) reject(error); else resolve(stdout);
          });
      });
  }
app.whenReady().then(() => {
    
    // --- NEW: CREATE SYSTEM TRAY ---
    tray = new Tray(path.join(__dirname, '../../assets/icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open Craft CanvaS', click: () => mainWindow.show() },
        { label: 'Quit', click: () => {
            // Tell the frontend to delete messages, then it will send 'force-quit' back
            if (mainWindow) mainWindow.webContents.send('cleanup-and-quit');
            else app.exit(0);
        }}
    ]);
    tray.setToolTip('Craft CanvaS');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => mainWindow.show()); // Show app when tray icon is clicked
    // --- NEW: FILE SYSTEM PATHS ---
    const rootDataPath = process.platform === 'win32' ? path.join(app.getPath('appData'), '.minecraft') : 
                         process.platform === 'darwin' ? path.join(app.getPath('appData'), 'minecraft') : 
                         path.join(os.homedir(), '.minecraft');
                         
    const modsDir = path.join(rootDataPath, 'mods');
    const trashDir = path.join(rootDataPath, 'mods_trash');

    // Ensure folders exist for new players!
    if (!fs.existsSync(rootDataPath)) fs.mkdirSync(rootDataPath, { recursive: true });
    if (!fs.existsSync(modsDir)) fs.mkdirSync(modsDir, { recursive: true });
    if (!fs.existsSync(trashDir)) fs.mkdirSync(trashDir, { recursive: true });

// --- NEW: LOCAL MOD IPC HANDLERS ---
    ipcMain.handle('get-local-mods', () => {
        try {
            if (!fs.existsSync(modsDir)) return [];
            // FIX: Now accepts .JAR, .jar, and .zip files safely!
            return fs.readdirSync(modsDir)
                .filter(f => f.toLowerCase().endsWith('.jar') || f.toLowerCase().endsWith('.zip'))
                .map(f => ({ name: f }));
        } catch (e) {
            return [];
        }
    });
    ipcMain.handle('move-to-trash', (event, filename) => {
        try { 
            fs.renameSync(path.join(modsDir, filename), path.join(trashDir, filename)); 
            return true; 
        } catch (e) { 
            console.error("Move to trash error:", e);
            return false; 
        }
    });

    ipcMain.handle('recover-from-trash', (event, filename) => {
        try { 
            fs.renameSync(path.join(trashDir, filename), path.join(modsDir, filename)); 
            return true; 
        } catch (e) { 
            console.error("Recover from trash error:", e);
            return false; 
        }
        
    });
    // ✨ NEW: Opens the actual .minecraft/mods folder in Windows Explorer!
    ipcMain.on('open-mods-folder', () => {
        if (fs.existsSync(modsDir)) {
            shell.openPath(modsDir);
        }
    });
    

    ipcMain.handle('get-trash-mods', () => {
        try {
            if (!fs.existsSync(trashDir)) return [];
            return fs.readdirSync(trashDir)
                .filter(f => f.toLowerCase().endsWith('.jar') || f.toLowerCase().endsWith('.zip'))
                .map(f => ({ name: f }));
        } catch (e) {
            return [];
        }
    });

    // Directly download a mod into the exact mods folder!
    ipcMain.handle('download-mod-direct', async (event, url, filename) => {
        const dest = path.join(modsDir, filename);
        await downloadFile(url, dest);
        return true;
    });
    // --- NEW: LISTEN FOR FRONTEND CLEANUP COMPLETION ---
// --- UPDATED: CLEANUP TRASH ON QUIT ---
    ipcMain.on('force-quit', () => {
        try {
            if (fs.existsSync(trashDir)) {
                fs.rmSync(trashDir, { recursive: true, force: true });
                console.log("Trash emptied successfully.");
            }
        } catch (e) { console.error("Could not empty trash"); }
        app.exit(0); 
    });
    createWindow();

    ipcMain.on('open-external', (event, url) => { shell.openExternal(url); });
    ipcMain.on('download-file', (event, url) => { mainWindow.webContents.downloadURL(url); });

    ipcMain.on('launch-minecraft', async (event, { username, version, loader, isPremium }) => {
        try {
            let authConfig;
            let rootDataPath = process.platform === 'win32' ? path.join(app.getPath('appData'), '.minecraft') : 
                               process.platform === 'darwin' ? path.join(app.getPath('appData'), 'minecraft') : 
                               path.join(os.homedir(), '.minecraft');

            let targetVersion = version; 

            if (loader && loader !== 'vanilla') {
                const versionsDir = path.join(rootDataPath, 'versions');
                if (!fs.existsSync(versionsDir)) fs.mkdirSync(versionsDir, { recursive: true });

                const vanillaJarPath = path.join(versionsDir, version, `${version}.jar`);
                if (!fs.existsSync(vanillaJarPath)) {
                    if (mainWindow) mainWindow.webContents.send('launch-error', `Missing Base Game: Play Vanilla ${version} once before installing mods!`);
                    return; 
                }

                const existingVersions = fs.readdirSync(versionsDir);
                const alreadyInstalled = existingVersions.find(f => f.toLowerCase().includes(loader) && f.includes(version));

                if (alreadyInstalled) {
                    targetVersion = alreadyInstalled; 
                } else {
                    const tempInstaller = path.join(app.getPath('temp'), `${loader}-installer.jar`);

                    try {
                        if (loader === 'fabric') {
                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Downloading Fabric...`, percentage: 10 });
                            await downloadFile("https://maven.fabricmc.net/net/fabricmc/fabric-installer/1.0.1/fabric-installer-1.0.1.jar", tempInstaller);
                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Building Fabric Profile...`, percentage: 20 });
                            
                            await execPromise(`"${JAVA_EXEC}" -jar "${tempInstaller}" client -dir "${rootDataPath}" -mcversion ${version}`);
                        } 
                        else if (loader === 'forge') {
                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Locating latest Forge...`, percentage: 10 });
                            const forgeData = await fetchJson(`https://bmclapi2.bangbang93.com/forge/minecraft/${version}`);
                            if (!forgeData || forgeData.length === 0) throw new Error("Forge not available for this version.");
                            
                            const latestForge = forgeData[0].version; 
                            const fullForgeVersion = `${version}-${latestForge}`; 
                            const forgeUrl = `https://bmclapi2.bangbang93.com/maven/net/minecraftforge/forge/${fullForgeVersion}/forge-${fullForgeVersion}-installer.jar`;

                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Downloading Forge...`, percentage: 15 });
                            await downloadFile(forgeUrl, tempInstaller);
                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Building Forge (This takes a minute)...`, percentage: 30 });
                            
                            await execPromise(`"${JAVA_EXEC}" -jar "${tempInstaller}" --installClient "${rootDataPath}"`);
                        }
                        else if (loader === 'neoforge') {
                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Locating latest NeoForge...`, percentage: 10 });
                            const neoData = await fetchJson(`https://bmclapi2.bangbang93.com/neoforge/list/${version}`);
                            if (!neoData || neoData.length === 0) throw new Error("NeoForge not available for this version.");
                            
                            const latestNeo = neoData[0].version; 
                            const neoUrl = `https://bmclapi2.bangbang93.com/maven/net/neoforged/neoforge/${latestNeo}/neoforge-${latestNeo}-installer.jar`;

                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Downloading NeoForge...`, percentage: 15 });
                            await downloadFile(neoUrl, tempInstaller);
                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Building NeoForge...`, percentage: 30 });
                            
                            await execPromise(`"${JAVA_EXEC}" -jar "${tempInstaller}" --installClient "${rootDataPath}"`);
                        }
                        else if (loader === 'quilt') {
                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Downloading Quilt...`, percentage: 10 });
                            await downloadFile("https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/0.11.2/quilt-installer-0.11.2.jar", tempInstaller);
                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Building Quilt Profile...`, percentage: 20 });
                            
                            await execPromise(`"${JAVA_EXEC}" -jar "${tempInstaller}" client ${version} --install-dir="${rootDataPath}"`);
                        }
                        else if (loader === 'optifine') {
                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Locating latest OptiFine...`, percentage: 10 });
                            const ofData = await fetchJson(`https://bmclapi2.bangbang93.com/optifine/${version}`);
                            if (!ofData || ofData.length === 0) throw new Error("OptiFine not available for this version.");
                            
                            const latestOF = ofData[0];
                            const ofUrl = `https://bmclapi2.bangbang93.com/optifine/${version}/${latestOF.type}/${latestOF.patch}`;

                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `Downloading OptiFine...`, percentage: 15 });
                            await downloadFile(ofUrl, tempInstaller);
                            if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `ACTION REQUIRED: Please click 'Install' on the popup window!`, percentage: 30 });
                            
                            await execPromise(`"${JAVA_EXEC}" -jar "${tempInstaller}"`);
                        }

                        const versionsAfter = fs.readdirSync(versionsDir);
                        const newFolder = versionsAfter.find(f => !existingVersions.includes(f));
                        
                        if (newFolder) {
                            targetVersion = newFolder; 
                        } else {
                            throw new Error("Installer failed to create a new profile.");
                        }

                    } catch (err) {
                        console.error("Auto-Installer Error:", err);
                        if (mainWindow) mainWindow.webContents.send('launch-error', `Installation Failed: ${err.message}`);
                        return; 
                    }
                }
            }

            if (isPremium) {
                if (mainWindow) mainWindow.webContents.send('launch-progress', { task: 'Waiting for Microsoft Login...', percentage: 10 });
                const authManager = new Auth("select_account");
                const xboxManager = await authManager.launch("electron");
                const token = await xboxManager.getMinecraft();
                authConfig = token.mclc(); 
            } else {
                authConfig = Authenticator.getAuth(username || "DevPlayer");
            }

            const opts = {
                authorization: authConfig,
                root: rootDataPath,
                version: { 
                    number: version, 
                    type: "release",
                    custom: targetVersion !== version ? targetVersion : undefined 
                }, 
                memory: { max: "6G", min: "2G" },
                javaPath: JAVA_EXEC 
            };

            const versionFolder = path.join(rootDataPath, "versions", targetVersion);
            activeDownloadFolder = versionFolder; 
            
            if (fs.existsSync(versionFolder)) {
                if (mainWindow) mainWindow.webContents.send('launch-progress', { task: 'Verifying local game files...', percentage: 50 });
            } else {
                if (mainWindow) mainWindow.webContents.send('launch-progress', { task: 'Downloading fresh game assets...', percentage: 0 });
            }

            launcher.removeAllListeners('download-status');

            launcher.on('download-status', (e) => {
                const percentage = Math.round((e.current / e.total) * 100);
                if (percentage % 5 === 0) {
                    const prefix = fs.existsSync(versionFolder) ? "Verifying" : "Downloading";
                    if (mainWindow) mainWindow.webContents.send('launch-progress', { task: `${prefix}: ${e.name}`, percentage });
                }
            });

            launcher.on('debug', (e) => console.log('[Launcher]:', e));
            launcher.on('data', (e) => console.log('[Minecraft]:', e));

launcher.launch(opts).then((minecraftProcess) => {
                activeDownloadFolder = null; 
                if (mainWindow) {
                    mainWindow.webContents.send('launch-complete');
                    // --- NEW: MINIMIZE WHEN PLAYING GAME ---
                    mainWindow.minimize(); 
                }
                if (minecraftProcess) {
                    minecraftProcess.on('close', (code) => {
                        console.log("Minecraft closed with exit code:", code);
                    });
                }
            }).catch((err) => {
                console.error("Failed to launch:", err);
                if (mainWindow) mainWindow.webContents.send('launch-error', err.message);
            });

        } catch (err) {
            if (mainWindow) mainWindow.webContents.send('launch-error', err.message);
        }
    });

    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}