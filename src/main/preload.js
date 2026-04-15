const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openExternal: (url) => ipcRenderer.send('open-external', url),
    
    // --- RESTORED: STANDARD DOWNLOAD ---
    downloadMod: (url) => ipcRenderer.send('download-file', url),
    
    // --- DIRECT DOWNLOAD TO .Mblalalalalllala--
    filename),
    
    // LAUNCHER IPC METHODS

    onLaunchError: (callback) => ipcRenderer.on('launch-error', (event, error) => callback(error)),

// LOCAL MOD INSPECTOR METHODS
    getLocalMods: () => ipcRenderer.invoke('get-local-mods'),
    getTrashMods: er-from-trash', filename),
    
    // ✨ NEW: Opens the physical folder on your PC
    openModsFolder: () => ipcRenderer.send('open-mods-folder'),

    // SYSTEM TRAY & CLEANUP METHODS
    // SYSTEM TRAY & CLEANUP METHODS
    onCleanupAndQuit: (callback) => ipcRenderer.on('cleanup-and-quit', () => callback()),
    forceQuit: () => ipcRenderer.send('force-quit')
});
