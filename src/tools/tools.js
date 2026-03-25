
// Управление инструментами

// Установка курсора для canvas
function setCanvasCursor() {
    const file = getActiveFile();
    if (!file) return;
    const cursor = currentTool === 'move' ? 'move' : 'crosshair';
    file.canvas.style.cursor = cursor;
}

// Установка активного инструмента
function setTool(tool) {
    currentTool = tool;

    // Показываем график только для профиля
    if (tool == 'profile') {
        document.getElementById('graphModal').classList.add('active');
    }
    if (tool !== 'profile') {
        document.getElementById('graphModal').classList.remove('active');
    }

    // Обновление UI кнопок
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const toolBtn = document.querySelector(`[data-tool="${tool}"]`);
    if (toolBtn) toolBtn.classList.add('active');
    updateToolInfo();
    setCanvasCursor();

    // Сброс лассо при переключении с него
    if (tool !== 'lasso') {
        lassoPoints = [];
        isLassoClosed = false;
    }

    // Подсказка для лассо
    if (tool === 'lasso') {
        const toolInfoElement = document.getElementById('toolInfo');
        if (toolInfoElement) {
            toolInfoElement.textContent = 'Инструмент: Лассо (Клик для начала, двойной клик для завершения)';
        }
    }

    // Если переключились с move во время перемещения – отменяем
    if (tool !== 'move' && isMoving) {
        isMoving = false;
        moveSelectionCanvas = null;
        redrawFromHistory();
        const file = getActiveFile();
        if (file) drawSelectionOverlay(file);
    }

    // Убираем нарисованный профиль при переключении с профиля
    if (tool !== 'profile') {
        const file = getActiveFile();
        if (file) {
            redrawFromHistory();
        }
        currentProfile = null;
        dragMode = 'none';
    }
}

// Обновление информации об инструменте в статус-баре
function updateToolInfo() {
    const toolNames = {
        cursor: 'Курсор',
        profile: 'Профиль',
        lasso: 'Лассо',
        move: 'Перемещение выделения'
    };
    const toolInfoElement = document.getElementById('toolInfo');
    if (toolInfoElement) {
        toolInfoElement.textContent = `Инструмент: ${toolNames[currentTool] || currentTool}`;
    }
}


// function setShape(shape)
// function toggleShapesPanel()
// function setBrushSize(size, ev)