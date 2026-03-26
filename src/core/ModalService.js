/**
 * ModalService - Сервис управления модальными окнами
 * Заменяет прямые манипуляции с DOM в ui.js
 */

export class ModalService {
    constructor() {
        this.activeModal = null;
        this.overlay = null;
        this.initOverlay();
    }

    initOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 999; display: none;
        `;
        this.overlay.addEventListener('click', () => this.closeActive());
        document.body.appendChild(this.overlay);
    }

    /**
     * Открывает модальное окно по ID
     * @param {string} modalId - ID модального окна
     * @param {Object} data - Данные для передачи в модалку
     */
    open(modalId, data = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return console.error(`Modal #${modalId} not found`);

        this.activeModal = modal;
        this.overlay.style.display = 'block';
        modal.classList.add('active');
        modal.style.display = 'flex'; // Или block, зависит от CSS

        // Инициализация содержимого
        this.initializeContent(modal, data);
        
        // Фокус на первый инпут если есть
        const firstInput = modal.querySelector('input, select, button');
        if (firstInput) firstInput.focus();
    }

    closeActive() {
        if (!this.activeModal) return;
        
        this.activeModal.classList.remove('active');
        this.activeModal.style.display = 'none';
        this.overlay.style.display = 'none';
        this.activeModal = null;
    }

    initializeContent(modal, data) {
        // Пример динамического заполнения
        if (data.title) {
            const titleEl = modal.querySelector('.modal-title');
            if (titleEl) titleEl.textContent = data.title;
        }
        
        // Специфичная логика для разных типов модалок может быть вынесена в отдельные хендлеры
    }

    /**
     * Показывает прогресс бар
     * @param {number} percent - Процент выполнения (0-100)
     * @param {string} message - Сообщение пользователю
     * @param {boolean} allowCancel - Можно ли отменить
     */
    showProgress(percent, message = '', allowCancel = true) {
        const modal = document.getElementById('progressModal');
        if (!modal) return;

        const bar = modal.querySelector('.progress-bar-fill');
        const text = modal.querySelector('.progress-text');
        const cancelBtn = modal.querySelector('.cancel-btn');

        if (bar) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        if (text) text.textContent = message;
        if (cancelBtn) cancelBtn.style.display = allowCancel ? 'block' : 'none';

        if (!modal.classList.contains('active')) {
            this.open('progressModal');
        }
    }

    hideProgress() {
        this.closeActive();
    }

    /**
     * Устанавливает обработчик отмены
     * @param {Function} callback 
     */
    onCancel(callback) {
        const btn = document.querySelector('#progressModal .cancel-btn');
        if (btn) {
            // Удаляем старые слушатели клонированием
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', callback);
        }
    }
}

export const modalService = new ModalService();
