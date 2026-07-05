const STORAGE_FILES_KEY = 'markdown_pwa_files';
const STORAGE_CURRENT_KEY = 'markdown_pwa_current_id';

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
const toggleText = document.getElementById('toggle-text');
const toggleIconContainer = document.getElementById('toggle-icon-container');

// Iconos vectoriales intercambiables
const EYE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>`;
const PEN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;

// --- Control del Panel Lateral ---
menuBtn.addEventListener('click', () => sidebar.classList.add('open'));
closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));

// --- Gestión de Archivos ---
function init() {
  if (files.length === 0) {
    const defaultFile = createNewFileObject(
      'Documento de Guía', 
      '# Mi Documento Markdown\n\nEste es un entorno de escritura minimalista con soporte fuera de línea.\n\n### Formato de muestra\n\n- **Negritas** para resaltar conceptos.\n- *Itálicas* para notas rápidas.\n- `Bloques de código` integrados.\n\n```javascript\n// Ejemplo de código limpio\nconst app = () => "Moderno y minimalista";\n```\n\nPresiona el botón **Ver Formato** para ver cómo queda renderizado.'
    );
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
    li.innerHTML = `
      <svg style="margin-right:0.5rem; flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
      <span class="file-title-text">${file.title}</span>
    `;
    
    li.addEventListener('click', () => {
      currentFileId = file.id;
      saveToStorage();
      renderFileList();
      loadActiveFile();
      sidebar.classList.remove('open');
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
  const newFile = createNewFileObject('Nuevo Archivo');
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

  if (confirm(`¿Deseas eliminar definitivamente el archivo "${activeFile.title}"?`)) {
    files = files.filter(f => f.id !== currentFileId);
    
    if (files.length === 0) {
      const defaultFile = createNewFileObject('Nuevo Archivo');
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
    
    const sidebarItem = document.querySelector(`[data-id="${currentFileId}"] .file-title-text`);
    if (sidebarItem) {
      sidebarItem.textContent = activeFile.title;
    }
  }
});

// --- Clipboard & Vista Previa ---

// Pegar desde el portapapeles del dispositivo con compatibilidad HTTP/HTTPS
pasteBtn.addEventListener('click', async () => {
  if (isPreviewMode) toggleView();

  if (!navigator.clipboard || !navigator.clipboard.readText) {
    alert('Tu navegador no permite acceso directo al portapapeles o no está utilizando una conexión segura (HTTPS).');
    return;
  }

  try {
    const text = await navigator.clipboard.readText();
    const start = markdownInput.selectionStart;
    const end = markdownInput.selectionEnd;
    const currentText = markdownInput.value;

    markdownInput.value = currentText.substring(0, start) + text + currentText.substring(end);
    markdownInput.focus();
    markdownInput.selectionStart = markdownInput.selectionEnd = start + text.length;

    markdownInput.dispatchEvent(new Event('input'));
  } catch (err) {
    console.error('No se pudo acceder al portapapeles:', err);
    alert('No se otorgaron permisos para leer el portapapeles.');
  }
});

// Alternar entre editor y vista previa
function toggleView() {
  isPreviewMode = !isPreviewMode;
  
  if (isPreviewMode) {
    const compiledHtml = marked.parse(markdownInput.value || '');
    markdownPreview.innerHTML = compiledHtml;
    
    markdownInput.classList.add('hidden');
    markdownPreview.classList.remove('hidden');
    
    toggleText.textContent = 'Editar';
    toggleIconContainer.innerHTML = PEN_ICON;
  } else {
    markdownInput.classList.remove('hidden');
    markdownPreview.classList.add('hidden');
    
    toggleText.textContent = 'Ver Formato';
    toggleIconContainer.innerHTML = EYE_ICON;
  }
}

toggleViewBtn.addEventListener('click', toggleView);

// --- Registro del Service Worker ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registrado', reg.scope))
      .catch(err => console.error('Error al registrar SW', err));
  });
}

init();