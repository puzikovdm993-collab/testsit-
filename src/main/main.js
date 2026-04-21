// import { initRecentFiles } from '/src/recentFiles/recentFiles.js'; // Абсолютный путь (лучше)
// import { handleKeyDown, handleWheel  } from '/src/events/events.js'; // Абсолютный путь (лучше)
// import { closeOpenFilesDropdown } from '/src/fileManager/fileManager.js'; // Абсолютный путь (лучше)

function initDomElements()                     // заполняет объект dom
{
    dom = {
        windowTitle: document.getElementById('windowTitle'),
        canvasHost: document.getElementById('canvasHost'),
        canvasWrapper: document.getElementById('canvasWrapper'),
        cursorPos: document.getElementById('cursorPos'),
        canvasSize: document.getElementById('canvasSize'),
        zoomLevel: document.getElementById('zoomLevel'),
        shapesPanel: document.getElementById('shapesPanel'),
        shapesBtn: document.getElementById('shapesBtn'),
        resizeModal: document.getElementById('resizeModal'),
        newWidth: document.getElementById('newWidth'),
        newHeight: document.getElementById('newHeight'),
        textInputOverlay: document.getElementById('textInputOverlay'),
        textInput: document.getElementById('textInput'),
        colorPicker: document.getElementById('colorPicker'),
        saveMethodModal: document.getElementById('saveMethodModal'),
        filenameModal: document.getElementById('filenameModal'),
        loadFromServerModal: document.getElementById('loadFromServerModal'),
        recentFilesModal: document.getElementById('recentFilesModal'),
        recentFilesContainer: document.getElementById('recentFilesContainer'),
        recentFilesCount: document.getElementById('recentFilesCount'),
        medianModal: document.getElementById('medianModal'),
        medianAperture: document.getElementById('newAperture')
    };
}

// Функция переключения темы
function toggleTheme() {
    const body = document.body;
    const isLight = body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// Экспортируем функцию в глобальную область видимости для доступа из HTML
window.toggleTheme = toggleTheme;

// Применение сохраненной темы при загрузке
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}

document.addEventListener('DOMContentLoaded', function() {

    applySavedTheme();
    initDomElements();
    initRecentFiles();
    updateToolInfo();
    // Инициализируем состояние кнопок при загрузке (когда файлов еще нет)
    updateButtonsState();

    // ============ Инициализация графика Plotly ============
    const plotlyDiv = document.getElementById('graphCanvas');
    if (plotlyDiv) {
        Plotly.newPlot(plotlyDiv, [{
            x: [], y: [],
            type: 'scatter',
            mode: 'lines',
            line: { color: 'rgb(220, 60, 80)', width: 2.2 }
        }], {
            title: { text: '', font: { size: 14 } },
            xaxis: { title: 'Пиксель вдоль линии' },
            yaxis: {
                title: 'Интенсивность (R)',
                range: [0, 255],
                autorange: false
            },
            margin: { t: 30, l: 50, r: 35, b: 50 },
            showlegend: false,
            autosize: true
        }, { responsive: true, displayModeBar: false });
    }



    // Обработчик клика вне выпадающих списков
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('openFilesDropdown');
        const button = document.getElementById('openFilesDropdownBtn');

        if (dropdown && button && !dropdown.contains(event.target) && !button.contains(event.target)) {
            closeOpenFilesDropdown();
        }

        // Закрытие панели фигур при клике вне её
        if (dom.shapesPanel && !event.target.closest('#shapesBtn') && !event.target.closest('#shapesPanel')) {
            dom.shapesPanel.classList.remove('active');
        }
    });

    // Глобальные обработчики событий
    document.addEventListener('keydown', handleKeyDown);    // определяется в events.js
    document.addEventListener('wheel', handleWheel, { passive: false });
});
