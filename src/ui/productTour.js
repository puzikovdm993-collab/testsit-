// productTour.js - Product Tour / Onboarding Module

(function() {
    'use strict';

    // Конфигурация туров
    const tourSteps = [
        {
            id: 'tab-file',
            title: 'Вкладка "Файл"',
            description: 'Здесь вы можете открывать изображения, сохранять результаты работы и управлять открытыми файлами. Используйте кнопку "Открытые файлы" для переключения между несколькими изображениями.',
            position: 'bottom'
        },
        {
            id: 'tab-edit',
            title: 'Вкладка "Правка"',
            description: 'Отменяйте (Ctrl+Z) и повторяйте (Ctrl+Y) действия, а также просматривайте историю изменений (Ctrl+H).',
            position: 'bottom'
        },
        {
            id: 'tab-view',
            title: 'Вкладка "Вид"',
            description: 'Управляйте масштабом изображения: увеличивайте, уменьшайте, сбрасывайте к 100% или подгоняйте по размеру окна.',
            position: 'bottom'
        },
        {
            id: 'tab-image',
            title: 'Вкладка "Изображение"',
            description: 'Выполняйте геометрические преобразования: обрезку, поворот на 90°, 180°, 270° и зеркальное отражение.',
            position: 'bottom'
        },
        {
            id: 'tab-filters',
            title: 'Вкладка "Фильтры"',
            description: 'Применяйте фильтры для выделения контуров, поиска объектов (окружности, оси симметрии), предварительной обработки и медианной фильтрации.',
            position: 'bottom'
        },
        {
            id: 'tab-adjustments',
            title: 'Вкладка "Регулировка"',
            description: 'Настраивайте параметры изображения: яркость, контраст, баланс цвета, тон, насыщенность, уровни и кривые.',
            position: 'bottom'
        },
        {
            id: 'tab-tools',
            title: 'Вкладка "Инструменты"',
            description: 'Доступ к специализированным инструментам: Code Lab для пользовательских скриптов, СРТИ для фильтрации и Фотохронометрия.',
            position: 'bottom'
        },
        {
            id: 'tab-modes',
            title: 'Вкладка "Режимы"',
            description: 'Переключайтесь в режим Workflow для создания сценариев обработки изображений.',
            position: 'bottom'
        },
        {
            id: 'tab-options',
            title: 'Вкладка "Настройки"',
            description: 'Настройте интерфейс: отображение цветовой шкалы, выбор палитры и тему оформления (светлая/тёмная).',
            position: 'bottom'
        },
        {
            id: 'help-btn',
            title: 'Помощь',
            description: 'Откройте это справочное окно в любое время для просмотра подробной информации о функционале приложения.',
            position: 'left'
        },
        {
            id: 'toolbar-cursor',
            title: 'Панель инструментов',
            description: 'Используйте инструменты слева: Курсор для выбора и получения информации о пикселях, Профиль для построения графика интенсивности, Лассо для выделения областей.',
            position: 'right'
        },
        {
            id: 'canvasWrapper',
            title: 'Рабочая область',
            description: 'Здесь отображается изображение. Используйте колесо мыши для масштабирования, перетаскивание для перемещения при большом масштабе.',
            position: 'top'
        }
    ];

    let currentStep = 0;
    let isTourActive = false;
    let tooltipElement = null;

    // Проверка, пройден ли онбординг
    function isTourCompleted() {
        return localStorage.getItem('productTourCompleted') === 'true';
    }

    // Отметить онбординг как пройденный
    function markTourCompleted() {
        localStorage.setItem('productTourCompleted', 'true');
    }

    // Сбросить статус онбординга
    function resetTour() {
        localStorage.removeItem('productTourCompleted');
    }

    // Найти элемент по селектору
    function findElement(selector) {
        // Пробуем разные варианты селекторов
        let element = document.getElementById(selector) ||
                      document.querySelector(selector) ||
                      document.querySelector(`[data-tab="${selector.replace('tab-', '')}"]`) ||
                      document.querySelector(`#${selector}`);
        
        // Специальные случаи
        if (selector === 'toolbar-cursor') {
            element = document.querySelector('.tools-panel') || 
                      document.querySelector('[title*="Курсор"]') ||
                      document.querySelector('.tool-btn');
        }
        
        if (selector === 'help-btn') {
            element = document.querySelector('.help-btn') ||
                      document.querySelector('[onclick="showHelpModal()"]');
        }
        
        return element;
    }

    // Создать tooltip элемент
    function createTooltip() {
        if (tooltipElement) {
            tooltipElement.remove();
        }

        tooltipElement = document.createElement('div');
        tooltipElement.className = 'tour-tooltip';
        tooltipElement.innerHTML = `
            <div class="tour-tooltip-header">
                <h4 class="tour-tooltip-title"></h4>
                <button class="tour-tooltip-close" onclick="window.productTour.end()">×</button>
            </div>
            <div class="tour-tooltip-body">
                <p class="tour-tooltip-description"></p>
            </div>
            <div class="tour-tooltip-footer">
                <button class="tour-tooltip-btn tour-tooltip-btn-prev" onclick="window.productTour.prev()">← Назад</button>
                <span class="tour-tooltip-progress"></span>
                <button class="tour-tooltip-btn tour-tooltip-btn-next" onclick="window.productTour.next()">Далее →</button>
                <button class="tour-tooltip-btn tour-tooltip-btn-finish" onclick="window.productTour.finish()">Завершить</button>
            </div>
        `;

        document.body.appendChild(tooltipElement);
        return tooltipElement;
    }

    // Позиционировать tooltip относительно элемента
    function positionTooltip(element, position) {
        if (!tooltipElement || !element) return;

        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();
        
        let top, left;

        switch(position) {
            case 'bottom':
                top = rect.bottom + window.scrollY + 10;
                left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'top':
                top = rect.top + window.scrollY - tooltipRect.height - 10;
                left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
                break;
            case 'left':
                top = rect.top + window.scrollY + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.left + window.scrollX - tooltipRect.width - 10;
                break;
            case 'right':
                top = rect.top + window.scrollY + (rect.height / 2) - (tooltipRect.height / 2);
                left = rect.right + window.scrollX + 10;
                break;
            default:
                top = rect.bottom + window.scrollY + 10;
                left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
        }

        // Ограничения экрана
        top = Math.max(10, Math.min(top, window.innerHeight + window.scrollY - tooltipRect.height - 10));
        left = Math.max(10, Math.min(left, window.innerWidth + window.scrollX - tooltipRect.width - 10));

        tooltipElement.style.top = `${top}px`;
        tooltipElement.style.left = `${left}px`;
    }

    // Показать шаг тура
    function showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= tourSteps.length) {
            end();
            return;
        }

        currentStep = stepIndex;
        const step = tourSteps[currentStep];
        const element = findElement(step.id);

        if (!element) {
            console.warn(`Элемент для шага ${step.id} не найден, переходим к следующему`);
            next();
            return;
        }

        // Подсветка элемента
        highlightElement(element);

        // Создание и обновление tooltip
        if (!tooltipElement) {
            createTooltip();
        }

        const titleEl = tooltipElement.querySelector('.tour-tooltip-title');
        const descEl = tooltipElement.querySelector('.tour-tooltip-description');
        const progressEl = tooltipElement.querySelector('.tour-tooltip-progress');
        const prevBtn = tooltipElement.querySelector('.tour-tooltip-btn-prev');
        const nextBtn = tooltipElement.querySelector('.tour-tooltip-btn-next');
        const finishBtn = tooltipElement.querySelector('.tour-tooltip-btn-finish');

        titleEl.textContent = step.title;
        descEl.textContent = step.description;
        progressEl.textContent = `${currentStep + 1} из ${tourSteps.length}`;

        // Управление кнопками
        prevBtn.style.visibility = currentStep === 0 ? 'hidden' : 'visible';
        
        if (currentStep === tourSteps.length - 1) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            finishBtn.style.display = 'none';
        }

        // Позиционирование
        setTimeout(() => {
            positionTooltip(element, step.position);
        }, 10);

        // Плавная прокрутка к элементу
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Подсветка элемента
    function highlightElement(element) {
        // Убрать предыдущие подсветки
        document.querySelectorAll('.tour-highlighted').forEach(el => {
            el.classList.remove('tour-highlighted');
        });

        // Добавить подсветку текущему элементу
        element.classList.add('tour-highlighted');
    }

    // Убрать подсветку
    function removeHighlight() {
        document.querySelectorAll('.tour-highlighted').forEach(el => {
            el.classList.remove('tour-highlighted');
        });
    }

    // Начать тур
    function start() {
        if (isTourActive) return;
        
        isTourActive = true;
        currentStep = 0;
        
        // Добавить стили если их нет
        addTourStyles();
        
        // Блокировка взаимодействия с UI во время тура
        document.body.classList.add('tour-active');
        
        showStep(0);
        
        console.log('🎯 Product Tour started');
    }

    // Следующий шаг
    function next() {
        if (currentStep < tourSteps.length - 1) {
            showStep(currentStep + 1);
        }
    }

    // Предыдущий шаг
    function prev() {
        if (currentStep > 0) {
            showStep(currentStep - 1);
        }
    }

    // Завершить тур
    function finish() {
        markTourCompleted();
        end();
        
        // Показать сообщение о завершении
        showCompletionMessage();
    }

    // Завершить тур без отметки о прохождении
    function end() {
        isTourActive = false;
        removeHighlight();
        
        if (tooltipElement) {
            tooltipElement.remove();
            tooltipElement = null;
        }
        
        document.body.classList.remove('tour-active');
        
        console.log('🎯 Product Tour ended');
    }

    // Показать сообщение о завершении
    function showCompletionMessage() {
        const message = document.createElement('div');
        message.className = 'tour-completion-message';
        message.innerHTML = `
            <div class="tour-completion-content">
                <i class="fas fa-check-circle"></i>
                <span>Онбординг завершён! Вы всегда можете запустить его снова через меню "Помощь".</span>
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => message.remove(), 300);
        }, 4000);
    }

    // Добавить CSS стили для тура
    function addTourStyles() {
        if (document.getElementById('tour-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'tour-styles';
        styles.textContent = `
            /* Product Tour Styles */
            .tour-highlighted {
                outline: 3px solid #007acc !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 20px rgba(0, 122, 204, 0.5) !important;
                z-index: 10000 !important;
                position: relative !important;
                transition: all 0.3s ease !important;
            }

            .tour-tooltip {
                position: absolute;
                z-index: 10001;
                background: var(--modal-bg, #252526);
                border: 1px solid var(--modal-border, #3c3c3c);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                border-radius: 0;
                min-width: 280px;
                max-width: 350px;
                font-family: inherit;
                animation: tourTooltipFadeIn 0.3s ease-out;
            }

            @keyframes tourTooltipFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.95) translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            .tour-tooltip-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: var(--modal-header-bg, #333333);
                border-bottom: 1px solid var(--modal-border, #3c3c3c);
            }

            .tour-tooltip-title {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                color: var(--modal-text, #cccccc);
            }

            .tour-tooltip-close {
                background: transparent;
                border: none;
                color: var(--modal-text-muted, #858585);
                cursor: pointer;
                font-size: 20px;
                line-height: 1;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .tour-tooltip-close:hover {
                color: var(--vscode-error, #f48771);
            }

            .tour-tooltip-body {
                padding: 16px;
            }

            .tour-tooltip-description {
                margin: 0;
                font-size: 13px;
                color: var(--modal-text, #cccccc);
                line-height: 1.5;
            }

            .tour-tooltip-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: var(--modal-header-bg, #333333);
                border-top: 1px solid var(--modal-border, #3c3c3c);
            }

            .tour-tooltip-btn {
                height: 28px;
                padding: 0 12px;
                font-size: 12px;
                font-weight: 500;
                border: 1px solid var(--modal-border, #3c3c3c);
                background: var(--modal-bg, #252526);
                color: var(--modal-text, #cccccc);
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .tour-tooltip-btn:hover {
                background: var(--vscode-bg-hover, #2a2d2e);
            }

            .tour-tooltip-btn-next,
            .tour-tooltip-btn-finish {
                background: var(--vscode-accent, #007acc);
                border-color: var(--vscode-accent, #007acc);
                color: #ffffff;
            }

            .tour-tooltip-btn-next:hover,
            .tour-tooltip-btn-finish:hover {
                background: var(--vscode-accent-hover, #0062a3);
            }

            .tour-tooltip-progress {
                font-size: 12px;
                color: var(--modal-text-muted, #858585);
            }

            body.tour-active {
                pointer-events: none;
            }

            body.tour-active .tour-tooltip,
            body.tour-active .tour-highlighted,
            body.tour-active .tour-tooltip * {
                pointer-events: auto;
            }

            .tour-completion-message {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10002;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease;
            }

            .tour-completion-message.show {
                opacity: 1;
                transform: translateY(0);
            }

            .tour-completion-content {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 20px;
                background: var(--modal-bg, #252526);
                border: 1px solid var(--vscode-accent, #007acc);
                color: var(--modal-text, #cccccc);
                font-size: 13px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            }

            .tour-completion-content i {
                color: var(--vscode-accent, #007acc);
                font-size: 18px;
            }

            /* Адаптивность для мобильных */
            @media (max-width: 768px) {
                .tour-tooltip {
                    min-width: 260px;
                    max-width: 90vw;
                }

                .tour-tooltip-footer {
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .tour-tooltip-btn {
                    flex: 1;
                    min-width: 80px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // Экспорт функций в глобальную область видимости
    window.productTour = {
        start,
        end,
        next,
        prev,
        finish,
        isTourCompleted,
        resetTour,
        getCurrentStep: () => currentStep,
        getTotalSteps: () => tourSteps.length,
        isActive: () => isTourActive
    };

    // Автоматический запуск при первом посещении
    document.addEventListener('DOMContentLoaded', function() {
        // Небольшая задержка для полной загрузки страницы
        setTimeout(() => {
            if (!isTourCompleted()) {
                console.log('🎯 Первый визит - запуск онбординга');
                start();
            }
        }, 1000);
    });

    console.log('✅ Product Tour module loaded');
})();
