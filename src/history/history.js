
// ============ Система истории (Undo/Redo) ============

// Сброс истории для файла
function resetHistory(file) {
    file.history = [];
    file.historyIndex = -1;
}

// Добавление состояния в историю
function pushState(file) {
    file.historyIndex++;
    file.history = file.history.slice(0, file.historyIndex);
    file.history.push(captureState(file));

    if (file.history.length > maxHistory) {
        file.history.shift();
        file.historyIndex--;
    }

    // Обновляем окно истории, если оно открыто
    if (typeof isHistoryModalOpen === 'function' && isHistoryModalOpen()) {
        updateHistoryModal();
    }
}

// Восстановление состояния canvas из снимка
function restoreState(file, state) {
    file.canvas.width = state.w;
    file.canvas.height = state.h;
    file.ctx = file.canvas.getContext('2d', { willReadFrequently: true });
    file.ctx.putImageData(state.data, 0, 0);
    if (file.id === activeFileId) {
        canvas = file.canvas;
        ctx = file.ctx;
        applyZoom();
        updateCanvasSize();
    }
}

// Сохранение текущего состояния
function saveState() {
    const file = getActiveFile();
    if (!file) return;
    pushState(file);
}

// Перерисовка canvas из последнего состояния истории
function redrawFromHistory() {
    const file = getActiveFile();
    if (!file) return;

    if (file.historyIndex < 0) return;
    const state = file.history[file.historyIndex];
    // Проверка соответствия размеров
    if (file.canvas.width !== state.w || file.canvas.height !== state.h) {
        restoreState(file, state);
        return;
    }
    file.ctx.putImageData(state.data, 0, 0);
}

// Отмена последнего действия
function undo() {
    const file = getActiveFile();
    if (!file) return;
    if (file.historyIndex > 0) {
        file.historyIndex--;
        restoreState(file, file.history[file.historyIndex]);
    }
}

// Повтор отмененного действия
function redo() {
    const file = getActiveFile();
    if (!file) return;
    if (file.historyIndex < file.history.length - 1) {
        file.historyIndex++;
        restoreState(file, file.history[file.historyIndex]);
    }
}

// Улучшенный захват состояния — автоматически определяет название действия
function captureState(file) {
    let action = 'Изменение';

    // Приоритет 1: если в текущем инструменте есть понятное название
    if (currentTool) {
        const toolNames = {
            'cursor' : 'Курсор',
            'profile': 'Профиль',
            'lasso': 'Лассо',
            'move' : 'Перемещение выделения'           
        };
        if (toolNames[currentTool]) action = toolNames[currentTool];
    }

    return {
        w: file.canvas.width,
        h: file.canvas.height,
        data: file.ctx.getImageData(0, 0, file.canvas.width, file.canvas.height),
        timestamp: Date.now(),
        action: action
    };
}

// ====================== СОХРАНЕНИЕ И ЗАГРУЗКА ИСТОРИИ ======================

// Сохранение истории всех открытых файлов в localStorage
function saveHistoryToStorage() {
    const projectId = localStorage.getItem('activeProjectId');
    if (!projectId) return;
    
    const historyData = {};
    openFiles.forEach(file => {
        // Сохраняем историю с конвертацией ImageData в массив для JSON
        historyData[file.id] = {
            historyIndex: file.historyIndex,
            filename: file.filename,
            canvasWidth: file.canvas?.width || 0,
            canvasHeight: file.canvas?.height || 0,
            history: file.history.map(state => ({
                w: state.w,
                h: state.h,
                timestamp: state.timestamp,
                action: state.action,
                // Конвертируем ImageData.data в обычный массив для JSON
                imageData: state.data ? Array.from(state.data.data) : null
            }))
        };
    });
    
    try {
        localStorage.setItem(`project_history_${projectId}`, JSON.stringify(historyData));
        console.log('✅ История сохранена в localStorage');
    } catch (e) {
        console.warn('⚠️ Не удалось сохранить историю (возможно превышен лимит localStorage):', e);
    }
}

// Загрузка истории из localStorage
function loadHistoryFromStorage() {
    const projectId = localStorage.getItem('activeProjectId');
    if (!projectId) return false;
    
    const savedData = localStorage.getItem(`project_history_${projectId}`);
    if (!savedData) return false;
    
    try {
        const historyData = JSON.parse(savedData);
        
        // Для каждого сохраненного файла восстанавливаем историю
        Object.keys(historyData).forEach(fileId => {
            const file = openFiles.find(f => f.id === fileId);
            if (!file) {
                console.log(`⚠️ Файл ${fileId} не найден среди открытых, пропускаем историю`);
                return;
            }
            
            const savedFileHistory = historyData[fileId];
            file.historyIndex = savedFileHistory.historyIndex || -1;
            file.history = savedFileHistory.history.map(state => {
                // Восстанавливаем ImageData из массива
                let imageData = null;
                if (state.imageData && Array.isArray(state.imageData)) {
                    const arr = new Uint8ClampedArray(state.imageData);
                    imageData = new ImageData(arr, state.w, state.h);
                }
                
                return {
                    w: state.w,
                    h: state.h,
                    timestamp: state.timestamp,
                    action: state.action,
                    data: imageData
                };
            });
            
            console.log(`✅ История загружена для файла ${file.filename}`);
            
            // Восстанавливаем последнее состояние изображения на canvas
            if (file.history.length > 0 && file.historyIndex >= 0) {
                const lastState = file.history[file.historyIndex];
                if (lastState.data) {
                    file.canvas.width = lastState.w;
                    file.canvas.height = lastState.h;
                    file.ctx = file.canvas.getContext('2d', { willReadFrequently: true });
                    file.ctx.putImageData(lastState.data, 0, 0);
                    
                    // Если это активный файл, обновляем глобальные переменные
                    if (file.id === activeFileId) {
                        canvas = file.canvas;
                        ctx = file.ctx;
                        applyZoom();
                        updateCanvasSize();
                    }
                    console.log(`✅ Изображение восстановлено для файла ${file.filename}`);
                }
            }
        });
        
        return true;
    } catch (e) {
        console.error('❌ Ошибка загрузки истории:', e);
        return false;
    }
}

// Экспорт истории в JSON файл (для скачивания)
function exportHistoryToFile() {
    const file = getActiveFile();
    if (!file || file.history.length === 0) {
        alert('История пуста');
        return;
    }
    
    const exportData = {
        filename: file.filename,
        historyLength: file.history.length,
        currentIndex: file.historyIndex,
        history: file.history.map((state, idx) => ({
            index: idx,
            action: state.action,
            timestamp: state.timestamp,
            dimensions: `${state.w}x${state.h}`
        }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.filename}_history.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Автосохранение истории каждые 30 секунд
let historyAutoSaveInterval = null;

function startHistoryAutoSave() {
    if (historyAutoSaveInterval) clearInterval(historyAutoSaveInterval);
    historyAutoSaveInterval = setInterval(() => {
        if (typeof saveHistoryToStorage === 'function') {
            saveHistoryToStorage();
        }
    }, 30000); // 30 секунд
    console.log('✅ Автосохранение истории запущено (каждые 30 сек)');
}

function stopHistoryAutoSave() {
    if (historyAutoSaveInterval) {
        clearInterval(historyAutoSaveInterval);
        historyAutoSaveInterval = null;
    }
}