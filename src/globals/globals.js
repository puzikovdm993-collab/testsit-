
// Глобальные переменные (настройки и состояние приложения)


let currentTool = 'cursor';       // Текущий инструмент (по умолчанию — текст)
let isDrawing = false;          // Флаг, указывающий, ведётся ли рисование
let startX = 0, startY = 0;     // Начальные координаты рисунка (X и Y)
let lastX = 0, lastY = 0;       // Последние координаты курсора для плавного рисования
let zoom = 1;                   // Коэффициент масштабирования холста
let openFiles = [];             // Список открытых файлов/картинок
let activeFileId = null;        // ID активного файла (для работы с несколькими файлами)
let canvas = null;              // Ссылка на HTML-элемент холста
let ctx = null;                 // Ссылка на контекст рисования холста (2D)

// Переменные для перемещения выделения
let isMoving = false;
let moveStartX = 0, moveStartY = 0;
let moveOffsetX = 0, moveOffsetY = 0;
let moveSelectionCanvas = null;
let moveMaskData = null;
let moveBBox = { minX:0, minY:0, maxX:0, maxY:0, width:0, height:0 };

// Переменные для работы с выделением и инструментом "Лассо" (lasso)
let selection = null;       // Объект текущего выделения 
let selectionData = null;   // Данные выделения 
let lassoPoints = [];       // Массив точек, собранных инструментом лассо
let isLassoClosed = false;  // Флаг, указывающий, замкнута ли область лассо

// Переменные для профиля
let currentProfile = null;              // Текущий профиль
let dragMode = 'none';                  // Режим перетаскивания (none, move, scale, rotate)
let dragOffsetX = 0, dragOffsetY = 0;   // Смещение для перетаскивания (для drag-and-drop)
let originalProfile = null;             // Исходный профиль до трансформации (для отмены изменений)  

// DOM-элементы (заполняются в main.js)
let dom = {};

// Константы
const maxHistory = 50;  // Максимальное количество шагов в истории (undo/redo)
const RECENT_FILES_KEY = 'paint_recent_files';// Ключ для хранения в localStorage списка недавних файлов
const MAX_RECENT_FILES = 20;// Максимальное количество файлов в списке "Недавно открытые"

// Геттер активного файла
function getActiveFile() {
    // Ищем файл с ID, равным activeFileId, и возвращаем его
    // Если файл не найден — возвращаем null
    return openFiles.find(f => f.id === activeFileId) || null;
}

// Создание объекта session
const session = {
    aperture: 3,
    saveName:"result",
    saveFormat:"tpt",
    normbegin: 0,
    normend: 2,
    node_orderApproximation:3,
    thresholdmin:0,
    thresholdlessmin:0,
    thresholdmax:1,
    thresholdmoremax:1
};