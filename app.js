// Claves para LocalStorage
const STORAGE_FILES_KEY = 'markdown_pwa_files';
const STORAGE_CURRENT_KEY = 'markdown_pwa_current_id';

// Estados del sistema
let files = JSON.parse(localStorage.getItem(STORAGE_FILES_KEY)) || [];
let currentFileId = localStorage.getItem(STORAGE_CURRENT_KEY) || null;
let isPreviewMode = false;

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const newFileBtn = document.getElementById('new-file-btn');
const deleteFileBtn = document.getElementById('delete-file-btn');
const fileList = document.getElementById('file-list');

const currentFileTitle = document.getElementById('current-file-title');
const markdownInput = document.getElementById('markdown-input');
const markdownPreview = document.getElementById('markdown-preview');

const pasteBtn = document.getElementById('paste-btn');
const toggleViewBtn = document.getElementById('toggle-view-btn');

// --- Control del Panel Lateral ---
menuBtn.addEventListener('click', () => sidebar.classList.add('open'));
closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));

// --- Gestión de Archivos ---

// Inicialización de datos
function init() {
  if (files.length === 0) {
    // Si no hay archivos, creamos un archivo por defecto para la primera vez
    const defaultFile = createNewFileObject('Primer Documento', '# Hola Mundo\n\nEste es tu nuevo editor de **Markdown**.\n\n- Escribe tu código aquí.\n- Usa el botón de **Pegar** para traer textos del portapapeles.\n- Haz clic en **Ver Formato** para previsualizarlo.');
    files.push(defaultFile);
    currentFileId = defaultFile.id;
    saveToStorage();
  }
  
  if (!currentFileId || !files.some(f => f.id === currentFileId)) {
    currentFileId = files[0].id;
  }
  
  renderFileList();
  loadActiveFile();
}

function createNewFileObject(title = 'Sin título', content = '') {
  return {
    id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    title: title,
    content: content,
    updatedAt: Date.now()
  };
}

function saveToStorage() {
  localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(files));
  localStorage.setItem(STORAGE_CURRENT_KEY, currentFileId);
}

function renderFileList() {
  fileList.innerHTML = '';
  files.sort((a, b) => b.updatedAt - a.updatedAt).forEach(file => {
    const li = document.createElement('li');
    li.className = `file-item ${file.id === currentFileId ? 'active' : ''}`;
    li.dataset.id = file.id;
    li.innerHTML = `<span class="file-title-text">${file.title}</span>`;
    
    li.addEventListener('click', () => {
      currentFileId = file.id;
      saveToStorage();
      renderFileList();
      loadActiveFile();
      sidebar.classList.remove('open'); // Cierra barra lateral en móviles
      
      // Regresa al modo editor si estaba en previsualización
      if (isPreviewMode) toggleView();
    });
    
    fileList.appendChild(li);
  });
}

function loadActiveFile() {
  const activeFile = files.find(f => f.id === currentFileId);
  if (activeFile) {
    currentFileTitle.value = activeFile.title;
    markdownInput.value = activeFile.content;
  }
}

// Crear un nuevo documento
newFileBtn.addEventListener('click', () => {
  const newFile = createNewFileObject('Nuevo Documento');
  files.push(newFile);
  currentFileId = newFile.id;
  saveToStorage();
  renderFileList();
  loadActiveFile();
  sidebar.classList.remove('open');
  if (isPreviewMode) toggleView();
});

// Eliminar el documento actual
deleteFileBtn.addEventListener('click', () => {
  const activeFile = files.find(f => f.id === currentFileId);
  if (!activeFile) return;

  if (confirm(`¿Estás seguro de eliminar el archivo "${activeFile.title}"?`)) {
    files = files.filter(f => f.id !== currentFileId);
    
    if (files.length === 0) {
      const defaultFile = createNewFileObject('Nuevo Documento');
      files.push(defaultFile);
      currentFileId = defaultFile.id;
    } else {
      currentFileId = files[0].id;
    }
    
    saveToStorage();
    renderFileList();
    loadActiveFile();
    if (isPreviewMode) toggleView();
  }
});

// Autoguardado al escribir o editar título
markdownInput.addEventListener('input', () => {
  const activeFile = files.find(f => f.id === currentFileId);
  if (activeFile) {
    activeFile.content = markdownInput.value;
    activeFile.updatedAt = Date.now();
    saveToStorage();
  }
});

currentFileTitle.addEventListener('input', (e) => {
  const activeFile = files.find(f => f.id === currentFileId);
  if (activeFile) {
    activeFile.title = e.target.value || 'Sin título';
    activeFile.updatedAt = Date.now();
    saveToStorage();
    
    // Actualiza el nombre en el panel lateral en tiempo real
    const sidebarItem = document.querySelector(`[data-id="${currentFileId}"] .file-title-text`);
    if (sidebarItem) {
      sidebarItem.textContent = activeFile.title;
    }
  }
});

// --- Funcionalidades Principales ---

// Pegar desde el portapapeles del dispositivo
pasteBtn.addEventListener('click', async () => {
  if (isPreviewMode) {
    // Si está en previsualización, forzamos regresar a la edición para poder pegar
    toggleView();
  }

  if (!navigator.clipboard || !navigator.clipboard.readText) {
    alert('Tu navegador o la configuración de seguridad no admite el acceso directo al portapapeles. Prueba a pegar manteniendo pulsada la pantalla.');
    return;
  }

  try {
    const text = await navigator.clipboard.readText();
    const start = markdownInput.selectionStart;
    const end = markdownInput.selectionEnd;
    const currentText = markdownInput.value;

    // Inserta en la posición actual del cursor
    markdownInput.value = currentText.substring(0, start) + text + currentText.substring(end);
    markdownInput.focus();
    markdownInput.selectionStart = markdownInput.selectionEnd = start + text.length;

    // Disparar evento de input para que autoguarde
    markdownInput.dispatchEvent(new Event('input'));
  } catch (err) {
    console.error('No se pudo leer del portapapeles:', err);
    alert('No se pudo acceder al portapapeles. Asegúrate de otorgar los permisos de acceso.');
  }
});

// Alternar entre editor y vista previa estructurada
function toggleView() {
  isPreviewMode = !isPreviewMode;
  
  if (isPreviewMode) {
    // Compila usando la librería marked.js
    const compiledHtml = marked.parse(markdownInput.value || '');
    markdownPreview.innerHTML = compiledHtml;
    
    markdownInput.classList.add('hidden');
    markdownPreview.classList.remove('hidden');
    toggleViewBtn.textContent = '✏️ Editar';
  } else {
    markdownInput.classList.remove('hidden');
    markdownPreview.classList.add('hidden');
    toggleViewBtn.textContent = '👁️ Ver Formato';
  }
}

toggleViewBtn.addEventListener('click', toggleView);

// --- Registro del Service Worker ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado correctamente.', reg.scope))
      .catch(err => console.error('Error al registrar el Service Worker.', err));
  });
}

// Iniciar app
init();