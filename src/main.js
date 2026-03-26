/**
 * main.js - Точка входа приложения
 * Инициализирует модули и связывает их вместе
 */

import { windowManager } from './core/WindowManager.js';
import { modalService } from './core/ModalService.js';
import { imageProcessor } from './core/ImageProcessor.js';

class App {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.init();
    }

    async init() {
        // 1. Инициализация процессора изображений
        imageProcessor.init(this.canvas);

        // 2. Регистрация окон
        this.registerWindows();

        // 3. Настройка событий UI
        this.setupEventListeners();

        console.log('Application initialized with modern modules');
    }

    registerWindows() {
        // Регистрируем draggable/resizable окна
        windowManager.registerWindow('historyWindow', {
            draggable: true,
            resizable: true,
            minSize: { width: 300, height: 200 }
        });

        windowManager.registerWindow('settingsWindow', {
            draggable: true,
            resizable: false
        });
        
        // Добавить другие окна по необходимости
    }

    setupEventListeners() {
        // Обработчик загрузки файла
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        await imageProcessor.loadImage(file);
                        modalService.closeActive();
                    } catch (err) {
                        console.error('Failed to load image:', err);
                        alert('Ошибка загрузки изображения');
                    }
                }
            });
        }

        // Обработчик медианного фильтра
        const medianBtn = document.getElementById('medianFilterBtn');
        if (medianBtn) {
            medianBtn.addEventListener('click', async () => {
                const radius = 2; // Можно вынести в настройки
                
                modalService.showProgress(0, 'Запуск медианного фильтра...', true);
                
                // Установка обработчика отмены
                modalService.onCancel(() => {
                    console.log('Operation cancelled by user');
                    // Логика отмены через флаг в imageProcessor
                });

                try {
                    await imageProcessor.applyMedianFilter(radius, (percent, message) => {
                        modalService.showProgress(percent, message, percent < 100);
                    });
                    
                    setTimeout(() => modalService.hideProgress(), 500);
                } catch (err) {
                    modalService.hideProgress();
                    alert('Ошибка фильтрации: ' + err.message);
                }
            });
        }

        // Кнопка сброса
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                imageProcessor.reset();
            });
        }
    }
}

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
