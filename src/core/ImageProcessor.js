/**
 * ImageProcessor - Современный сервис обработки изображений
 * Инкапсулирует логику из imageOps.js
 * Использует Web Workers для тяжелых вычислений (опционально)
 */

export class ImageProcessor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.originalData = null;
        this.currentData = null;
    }

    /**
     * Инициализация контекста
     * @param {HTMLCanvasElement} canvas 
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    }

    /**
     * Загрузка изображения
     * @param {File} file 
     * @returns {Promise<void>}
     */
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);
                this.originalData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                this.currentData = new ImageData(
                    new Uint8ClampedArray(this.originalData.data),
                    this.originalData.width,
                    this.originalData.height
                );
                resolve();
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Применение медианного фильтра с прогрессом
     * @param {number} radius - Радиус ядра
     * @param {Function} onProgress - Callback для обновления прогресса
     * @returns {Promise<void>}
     */
    async applyMedianFilter(radius, onProgress) {
        if (!this.currentData) throw new Error('No image loaded');

        const width = this.currentData.width;
        const height = this.currentData.height;
        const data = this.currentData.data;
        const output = new Uint8ClampedArray(data.length);

        const kernelSize = 2 * radius + 1;
        const totalPixels = kernelSize * kernelSize;

        // Этап 1: Инициализация (10%)
        onProgress(10, 'Инициализация буферов...');
        await this.sleep(50); // Даем UI обновиться

        // Этап 2: Обработка по каналам
        const channels = ['Red', 'Green', 'Blue'];
        
        for (let c = 0; c < 3; c++) {
            const startPercent = 20 + (c * 20);
            onProgress(startPercent, `Обработка канала ${channels[c]}...`);

            for (let y = 0; y < height; y++) {
                // Прогресс внутри канала
                const linePercent = startPercent + ((y / height) * 20 / 3);
                if (y % 10 === 0) {
                    onProgress(Math.floor(linePercent), `Канал ${channels[c]}: ${y}/${height} строк`);
                    await this.sleep(0); // Yield to UI
                }

                for (let x = 0; x < width; x++) {
                    const values = [];
                    
                    // Сбор соседей
                    for (let ky = -radius; ky <= radius; ky++) {
                        for (let kx = -radius; kx <= radius; kx++) {
                            const ny = Math.min(height - 1, Math.max(0, y + ky));
                            const nx = Math.min(width - 1, Math.max(0, x + kx));
                            const idx = (ny * width + nx) * 4 + c;
                            values.push(data[idx]);
                        }
                    }

                    // Сортировка и выбор медианы
                    values.sort((a, b) => a - b);
                    const median = values[Math.floor(totalPixels / 2)];
                    
                    const outIdx = (y * width + x) * 4 + c;
                    output[outIdx] = median;
                }
            }
        }

        // Этап 3: Копирование альфа-канала (80%)
        onProgress(80, 'Копирование альфа-канала...');
        for (let i = 3; i < data.length; i += 4) {
            output[i] = data[i];
        }

        // Этап 4: Применение (90-100%)
        onProgress(90, 'Рендеринг результата...');
        await this.sleep(50);
        
        this.currentData.data.set(output);
        this.ctx.putImageData(this.currentData, 0, 0);
        
        onProgress(100, 'Готово!');
        await this.sleep(100);
    }

    /**
     * Утилита для задержки (yield to main thread)
     * @param {number} ms 
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Сброс к оригиналу
     */
    reset() {
        if (this.originalData) {
            this.currentData = new ImageData(
                new Uint8ClampedArray(this.originalData.data),
                this.originalData.width,
                this.originalData.height
            );
            this.ctx.putImageData(this.currentData, 0, 0);
        }
    }

    /**
     * Получение текущих данных
     */
    getData() {
        return this.currentData;
    }
}

export const imageProcessor = new ImageProcessor();
