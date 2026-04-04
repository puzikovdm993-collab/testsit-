// ==================== Project Manager (MinIO Storage) ====================
// Все данные о проектах хранятся только в MinIO, без localStorage/IndexedDB

let currentProject = null;
let lastProjectId = null; // ID последнего открытого проекта

/**
 * Инициализация менеджера проектов при старте приложения
 * Загружает последний активный проект из MinIO или создает новый
 */
async function initProjectManager() {
    console.log('🔄 Инициализация менеджера проектов...');
    
    try {
        // Получаем список проектов
        const projects = await listProjects();
        
        if (projects && projects.length > 0) {
            // Сортируем проекты по дате изменения (последний сверху)
            projects.sort((a, b) => {
                return new Date(b.last_modified) - new Date(a.last_modified);
            });
            
            // Загружаем последний проект
            const lastProject = projects[0];
            console.log('📁 Найден последний проект:', lastProject.id);
            
            const loadedProject = await loadProject(lastProject.id);
            if (loadedProject) {
                lastProjectId = lastProject.id;
                console.log('✅ Проект загружен при старте:', lastProject.id);
                return loadedProject;
            }
        }
        
        // Если проектов нет или не удалось загрузить - создаем новый
        console.log('ℹ️ Проекты не найдены, создаем новый проект');
        const newProject = await createNewProject("Новый проект");
        return newProject;
        
    } catch (error) {
        console.error('❌ Ошибка инициализации менеджера проектов:', error);
        // В случае ошибки создаем новый проект
        return await createNewProject("Новый проект");
    }
}

/**
 * Создать новый проект и сохранить его в MinIO
 */
async function createNewProject(projectName = "Новый проект") {
    const projectId = 'proj_tis_' + Date.now();
    const now = new Date().toISOString();
    
    const projectData = {
        project: {
            id: projectId,
            name: projectName,
            type: "tis",
            createdAt: now,
            rootPath: "/workspace/projects/" + projectId,
            settings: {
                theme: "dark",
                fontSize: 14,
                autoSave: true
            }
        },
        history: {
            lastOpened: now,
            activeFileId: null,
            files: [],
            uiState: {
                sidebarVisible: true,
                terminalHeight: 200,
                panelLayout: "vertical"
            }
        }
    };
    
    try {
        const response = await fetch('/save_project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentProject = projectData;
            console.log('✅ Проект создан:', projectId);
            updateProjectUI(projectData);
            return projectData;
        } else {
            throw new Error(result.error || 'Ошибка сохранения проекта');
        }
    } catch (error) {
        console.error('❌ Ошибка создания проекта:', error);
        alert('Ошибка создания проекта: ' + error.message);
        return null;
    }
}

/**
 * Сохранить текущий проект в MinIO
 */
async function saveCurrentProject() {
    if (!currentProject) {
        console.warn('Нет активного проекта для сохранения');
        return false;
    }
    
    // Обновляем timestamp
    currentProject.history.lastOpened = new Date().toISOString();
    
    // Собираем информацию об открытых файлах
    currentProject.history.files = getOpenFilesInfo();
    currentProject.history.activeFileId = getActiveFileId();
    
    // Сохраняем UI состояние
    currentProject.history.uiState = getUIState();
    
    try {
        const response = await fetch('/save_project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentProject)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Проект сохранён:', currentProject.project.id);
            return true;
        } else {
            throw new Error(result.error || 'Ошибка сохранения проекта');
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения проекта:', error);
        alert('Ошибка сохранения проекта: ' + error.message);
        return false;
    }
}

/**
 * Загрузить проект из MinIO по ID
 */
async function loadProject(projectId) {
    try {
        const response = await fetch(`/load_project/${projectId}`);
        const result = await response.json();
        
        if (result.success) {
            currentProject = result.data;
            console.log('✅ Проект загружен:', projectId);
            applyLoadedProject(currentProject);
            return currentProject;
        } else {
            throw new Error(result.error || 'Проект не найден');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки проекта:', error);
        alert('Ошибка загрузки проекта: ' + error.message);
        return null;
    }
}

/**
 * Получить список всех проектов из MinIO
 */
async function listProjects() {
    try {
        const response = await fetch('/list_projects');
        const result = await response.json();
        
        if (result.success) {
            console.log('📋 Найдено проектов:', result.count);
            return result.projects;
        } else {
            throw new Error(result.error || 'Ошибка получения списка проектов');
        }
    } catch (error) {
        console.error('❌ Ошибка получения списка проектов:', error);
        return [];
    }
}

/**
 * Удалить проект из MinIO
 */
async function deleteProject(projectId) {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) {
        return false;
    }
    
    try {
        const response = await fetch(`/delete_project/${projectId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Проект удалён:', projectId);
            if (currentProject && currentProject.project.id === projectId) {
                currentProject = null;
                updateProjectUI(null);
            }
            return true;
        } else {
            throw new Error(result.error || 'Ошибка удаления проекта');
        }
    } catch (error) {
        console.error('❌ Ошибка удаления проекта:', error);
        alert('Ошибка удаления проекта: ' + error.message);
        return false;
    }
}

/**
 * Получить информацию об открытых файлах
 */
function getOpenFilesInfo() {
    // Эта функция должна быть реализована в fileManager.js
    // Возвращает массив файлов с их состоянием
    if (typeof window.openFiles !== 'undefined') {
        return window.openFiles.map(file => ({
            id: file.id || 'file_' + Date.now(),
            path: file.filename || '',
            language: getFileLanguage(file.filename),
            wasOpen: true,
            cursorPosition: { line: 0, column: 0 },
            scrollTop: 0
        }));
    }
    return [];
}

/**
 * Получить ID активного файла
 */
function getActiveFileId() {
    if (typeof window.getActiveFile === 'function') {
        const activeFile = window.getActiveFile();
        return activeFile ? activeFile.id : null;
    }
    return null;
}

/**
 * Получить текущее состояние UI
 */
function getUIState() {
    return {
        sidebarVisible: true,
        terminalHeight: 200,
        panelLayout: "vertical"
    };
}

/**
 * Определить язык файла по расширению
 */
function getFileLanguage(filename) {
    if (!filename) return 'text';
    const ext = filename.split('.').pop().toLowerCase();
    const langMap = {
        'tis': 'tis',
        'json': 'json',
        'md': 'markdown',
        'txt': 'text',
        'js': 'javascript',
        'py': 'python',
        'html': 'html',
        'css': 'css'
    };
    return langMap[ext] || 'text';
}

/**
 * Обновить UI после загрузки/создания проекта
 */
function updateProjectUI(project) {
    const projectTitle = document.getElementById('windowTitle');
    if (projectTitle) {
        projectTitle.textContent = project ? 
            `${project.project.name} - TIS Editor` : 
            'TIS Editor';
    }
    
    // Можно добавить индикацию текущего проекта в интерфейсе
    console.log('Текущий проект:', project ? project.project.name : 'Нет');
}

/**
 * Применить загруженный проект к текущему состоянию приложения
 */
function applyLoadedProject(project) {
    updateProjectUI(project);
    
    // Восстановить файлы из истории
    if (project.history && project.history.files) {
        console.log('Восстановление файлов проекта:', project.history.files.length);
        // Здесь можно добавить логику открытия файлов
    }
    
    // Восстановить настройки
    if (project.project && project.project.settings) {
        const settings = project.project.settings;
        if (settings.theme) {
            document.body.setAttribute('data-theme', settings.theme);
        }
        if (settings.fontSize) {
            document.body.style.fontSize = settings.fontSize + 'px';
        }
    }
}

/**
 * Проверить наличие активного проекта
 */
function hasActiveProject() {
    return currentProject !== null;
}

/**
 * Получить текущий активный проект
 */
function getCurrentProject() {
    return currentProject;
}

// Экспорт функций для использования в других модулях
if (typeof window !== 'undefined') {
    window.initProjectManager = initProjectManager;
    window.createNewProject = createNewProject;
    window.saveCurrentProject = saveCurrentProject;
    window.loadProject = loadProject;
    window.listProjects = listProjects;
    window.deleteProject = deleteProject;
    window.hasActiveProject = hasActiveProject;
    window.getCurrentProject = getCurrentProject;
    window.setupAutoSave = setupAutoSave;
}

/**
 * Настроить периодическое автосохранение проекта
 */
function setupAutoSave() {
    // Автосохранение каждые 30 секунд
    const AUTO_SAVE_INTERVAL = 30000;
    
    setInterval(async () => {
        if (hasActiveProject()) {
            console.log('🔄 Автосохранение проекта...');
            await saveCurrentProject();
        }
    }, AUTO_SAVE_INTERVAL);
    
    // Сохранение при закрытии/обновлении страницы
    window.addEventListener('beforeunload', async (event) => {
        if (hasActiveProject()) {
            console.log('💾 Сохранение проекта перед закрытием...');
            try {
                await saveCurrentProject();
            } catch (error) {
                console.error('Ошибка сохранения перед закрытием:', error);
            }
        }
    });
    
    console.log(`✅ Автосохранение настроено (интервал: ${AUTO_SAVE_INTERVAL / 1000} сек)`);
}
