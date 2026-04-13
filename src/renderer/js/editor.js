// src/renderer/js/editor.js

let filerobotEditor = null;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('filerobot-editor');
    container.innerHTML = '<div style="display:flex; height:100%; align-items:center; justify-content:center; color:#A0A5B5;"><h2>📥 Click "Add Image" in the top right to start editing</h2></div>';
});

function loadIntoEditor(imageSource) {
    const container = document.getElementById('filerobot-editor');
    
    if (filerobotEditor) {
        filerobotEditor.terminate();
    } else {
        container.innerHTML = '';
    }

    const config = {
        source: imageSource,
        onSave: (editedImageObject, designState) => {
            const finalImageData = editedImageObject.imageBase64;

    const reader = new FileReader();
    reader.onload = function(f) {
        loadIntoEditor(f.target.result);
        event.target.value = ''; 
    };
    reader.readAsDataURL(file);
}
