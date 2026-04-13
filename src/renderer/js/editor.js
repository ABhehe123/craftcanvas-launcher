// src/renderer/js/editor.js

let filerobotEditor = null;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('filerobot-editor');
    container.innerHTML = '<div style="display:flex; height:100%; align-items:center; justify-content:center; color:#A0A5B5;"><h2>📥 Click "Add Image" in the top right to start editing</h2></div>';
});

// Fixed: The upload function needed to be separated from the editor load!
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(f) {
        loadIntoEditor(f.target.result);
        event.target.value = ''; // Reset input so you can upload the same image again if needed
    };
    reader.readAsDataURL(file);
}

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
            // Instantly download the edited image to the user's PC
            const a = document.createElement('a');
            a.href = finalImageData;
            a.download = 'CraftCanvas_Edit.png';
            a.click();
        }
    };

    filerobotEditor = new window.FilerobotImageEditor(container, config);
    filerobotEditor.render();
}