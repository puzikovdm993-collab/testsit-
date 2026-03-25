
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