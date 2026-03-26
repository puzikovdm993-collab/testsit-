/**
 * WindowManager - Современный менеджер окон на основе ES6 Classes
 * Заменяет устаревшую логику из models.js
 */

export class WindowManager {
    constructor() {
        this.windows = new Map();
        this.zIndexCounter = 100;
        this.storageKey = 'app_window_state';
        
        // Привязка контекста
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.restoreState();
            this.attachGlobalListeners();
        });
    }

    /**
     * Регистрирует окно в системе
     * @param {string} id - ID элемента окна
     * @param {Object} options - Настройки (draggable, resizable, minSize)
     */
    registerWindow(id, options = {}) {
        const element = document.getElementById(id);
        if (!element) return console.warn(`Window #${id} not found`);

        const config = {
            element,
            id,
            isDragging: false,
            isResizing: false,
            startPos: { x: 0, y: 0 },
            startSize: { w: 0, h: 0 },
            resizeHandle: null,
            ...options
        };

        this.windows.set(id, config);
        this.setupInteractions(config);
        
        // Восстанавливаем сохраненную позицию если есть
        const savedState = this.getSavedState(id);
        if (savedState) {
            this.applyState(config, savedState);
        }
    }

    setupInteractions(config) {
        const { element, id } = config;
        const header = element.querySelector('.window-header');
        const resizer = element.querySelector('.window-resizer');

        if (config.draggable && header) {
            header.addEventListener('mousedown', (e) => this.startDrag(e, config));
        }

        if (config.resizable && resizer) {
            resizer.addEventListener('mousedown', (e) => this.startResize(e, config));
        }

        // Поднятие окна наверх при клике
        element.addEventListener('mousedown', () => this.bringToFront(config));
    }

    startDrag(e, config) {
        e.preventDefault();
        config.isDragging = true;
        config.startPos = { x: e.clientX, y: e.clientY };
        
        const rect = config.element.getBoundingClientRect();
        config.currentPos = { left: rect.left, top: rect.top };
        
        document.body.style.cursor = 'grabbing';
        config.element.style.transition = 'none'; // Отключаем анимацию для плавности
    }

    startResize(e, config) {
        e.preventDefault();
        config.isResizing = true;
        config.resizeHandle = e.target.dataset.side || 'se';
        config.startPos = { x: e.clientX, y: e.clientY };
        
        const rect = config.element.getBoundingClientRect();
        config.startSize = { w: rect.width, h: rect.height };
        
        document.body.style.cursor = this.getResizeCursor(config.resizeHandle);
    }

    attachGlobalListeners() {
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
    }

    handleMouseMove(e) {
        for (const config of this.windows.values()) {
            if (config.isDragging) {
                this.processDrag(e, config);
            } else if (config.isResizing) {
                this.processResize(e, config);
            }
        }
    }

    processDrag(e, config) {
        const dx = e.clientX - config.startPos.x;
        const dy = e.clientY - config.startPos.y;

        let newLeft = config.currentPos.left + dx;
        let newTop = config.currentPos.top + dy;

        // Ограничение границами экрана
        const maxLeft = window.innerWidth - config.element.offsetWidth;
        const maxTop = window.innerHeight - config.element.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        config.element.style.left = `${newLeft}px`;
        config.element.style.top = `${newTop}px`;
    }

    processResize(e, config) {
        const dx = e.clientX - config.startPos.x;
        const dy = e.clientY - config.startPos.y;
        const minW = config.minSize?.width || 200;
        const minH = config.minSize?.height || 150;

        let newW = config.startSize.w;
        let newH = config.startSize.h;

        if (config.resizeHandle.includes('e')) newW = config.startSize.w + dx;
        if (config.resizeHandle.includes('s')) newH = config.startSize.h + dy;
        if (config.resizeHandle.includes('w')) {
            newW = config.startSize.w - dx;
            // Тут нужна дополнительная логика для сдвига left при ресайзе слева
        }

        config.element.style.width = `${Math.max(minW, newW)}px`;
        config.element.style.height = `${Math.max(minH, newH)}px`;
        
        // Триггер события изменения размера для графиков
        if (config.element.querySelector('.plotly-graph-div')) {
            window.dispatchEvent(new Event('resize')); 
        }
    }

    handleMouseUp() {
        let changed = false;
        for (const config of this.windows.values()) {
            if (config.isDragging || config.isResizing) {
                config.isDragging = false;
                config.isResizing = false;
                config.element.style.transition = '';
                document.body.style.cursor = 'default';
                this.saveState(config);
                changed = true;
            }
        }
        if (changed) this.persistAllStates();
    }

    bringToFront(config) {
        this.zIndexCounter++;
        config.element.style.zIndex = this.zIndexCounter;
    }

    getResizeCursor(side) {
        const cursors = {
            'e': 'ew-resize', 'w': 'ew-resize',
            's': 'ns-resize', 'n': 'ns-resize',
            'se': 'nwse-resize', 'sw': 'nesw-resize'
        };
        return cursors[side] || 'default';
    }

    // --- Persistence Logic ---

    saveState(config) {
        const rect = config.element.getBoundingClientRect();
        const state = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            zIndex: parseInt(config.element.style.zIndex) || 100
        };
        localStorage.setItem(`${this.storageKey}_${config.id}`, JSON.stringify(state));
    }

    getSavedState(id) {
        const data = localStorage.getItem(`${this.storageKey}_${id}`);
        return data ? JSON.parse(data) : null;
    }

    applyState(config, state) {
        config.element.style.left = `${state.x}px`;
        config.element.style.top = `${state.y}px`;
        config.element.style.width = `${state.width}px`;
        config.element.style.height = `${state.height}px`;
        config.element.style.zIndex = state.zIndex;
        this.zIndexCounter = Math.max(this.zIndexCounter, state.zIndex);
    }

    persistAllStates() {
        // Можно сохранить список всех открытых окон
        const ids = Array.from(this.windows.keys());
        localStorage.setItem(`${this.storageKey}_list`, JSON.stringify(ids));
    }

    restoreState() {
        const list = JSON.parse(localStorage.getItem(`${this.storageKey}_list`) || '[]');
        // Логика восстановления списка, если окна динамические
    }
    
    destroy() {
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);
        this.windows.clear();
    }
}

// Экспорт единственного экземпляра (Singleton pattern)
export const windowManager = new WindowManager();
