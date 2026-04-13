const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openExternal: (url) => ipcRenderer.send('open-external', url),
    
    // --- RESTORED: STANDARD DOWNLOAD ---
    downloadMod: (url) => ipcRenderer.send('download-file', url),
    
    // --- DIRECT DOWNLOAD TO .MINECRAFT ---
    downloadModDirect: (url, filename) => ipcRenderer.invoke('download-mod-direct', url, filename),
    
    // LAUNCHER IPC METHODS
    launchMinecraft: (options) => ipcRenderer.send('launch-minecraft', options),
    onLaunchProgress: (callback) => ipcRenderer.on('launch-progress', (event, data) => callback(data)),
    onLaunchComplete: (callback) => ipcRenderer.on('launch-complete', () => callback()),
    onLaunchError: (callback) => ipcRenderer.on('launch-error', (event, error) => callback(error)),

// LOCAL MOD INSPECTOR METHODS
    getLocalMods: () => ipcRenderer.invoke('get-local-mods'),
    getTrashMods: () => ipcRenderer.invoke('get-trash-mods'),
    moveToTrash: (filename) => ipcRenderer.invoke('move-to-trash', filename),
    recoverFromTrash: (filename) => ipcRenderer.invoke('recover-from-trash', filename),
    
    // ✨ NEW: Opens the physical folder on your PC
    openModsFolder: () => ipcRenderer.send('open-mods-folder'),

    // SYSTEM TRAY & CLEANUP METHODS
    // SYSTEM TRAY & CLEANUP METHODS
    onCleanupAndQuit: (callback) => ipcRenderer.on('cleanup-and-quit', () => callback()),
    forceQuit: () => ipcRenderer.send('force-quit')
});