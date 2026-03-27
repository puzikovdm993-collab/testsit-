/**
 * modals.js - Модуль с HTML-шаблонами модальных окон
 * Экспортирует функцию для рендеринга модальных окон в DOM
 */

export const modalsHTML = `
<!-- Модальное окно выбора способа сохранения -->
<div class="modal" id="saveMethodModal">
    <div class="modal-content">
        <div class="modal-title">
            <span>Сохранить изображение</span>
            <button style="background:none;border:none;color:white;cursor:pointer;">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <p>Выберите способ сохранения:</p>
            </div>
            <div class="modal-row" style="display: flex; flex-direction: column; gap: 10px;">
                <button class="modal-btn" style="width:100%; text-align:left;" onclick="saveToLocal()">
                    <i class="fas fa-desktop"></i> Локально на компьютер
                </button>
                <button class="modal-btn" style="width:100%; text-align:left;" onclick="saveToServer()">
                    <i class="fas fa-server"></i> На сервер
                </button>
                <div id="serverMessage" style="margin-top:10px; display:none; padding:8px; background:#e8f5e8; border:1px solid #4CAF50; border-radius:3px;">
                    <span id="serverMessageText"></span>
                </div>
                <div id="serverProgress" style="margin-top:10px; display:none;">
                    <div style="width:100%; height:20px; background:#f0f0f0; border-radius:3px; overflow:hidden;">
                        <div id="progressBar" style="width:0%; height:100%; background:#4CAF50; transition:width 0.3s;"></div>
                    </div>
                    <div id="progressText" style="font-size:11px; text-align:center; margin-top:4px;">0%</div>
                </div>
            </div>
            <div class="modal-row" id="serverImagesList" style="display:none; max-height:200px; overflow-y:auto; border:1px solid #ccc; padding:8px; margin-top:10px;">
                <h4 style="margin-bottom:8px;">Изображения на сервере:</h4>
                <div id="imagesList"></div>
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="closeSaveMethodModal()">Отмена</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно выбора способа загрузки -->
<div class="modal" id="loadMethodModal">
    <div class="modal-content" style=" width: 300px; height: 200px">
        <div class="modal-title">
            <span>Загрузка изображение</span>
            <button style="background:none;border:none;color:white;cursor:pointer;">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <p>Выберите способ загрузки:</p>
            </div>
            <div class="modal-row" style="display: flex; flex-direction: column; gap: 10px;">
                <button class="modal-btn" style="width:100%; text-align:left;" onclick="loadToLocal()">
                    Локально с компьютера
                </button>
                <button class="modal-btn" style="width:100%; text-align:left;" onclick="loadToServer()">
                    С сервера
                </button>
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="closeLoadMethodModal()">Отмена</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно загрузки с сервера (каталоги) -->
<div class="modal" id="loadFromServerModal">
    <div class="modal-content" style="width: 800px; max-width: 90vw;">
        <div class="modal-title">
            <span>Загрузка изображений с сервера</span>
            <button onclick="closeLoadFromServerModal()">✕</button>
        </div>
        <div class="modal-body">
            <!-- Панель навигации -->
            <div class="modal-row" style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
                <button class="modal-btn" id="serverNavBack" onclick="navigateBack()" disabled title="Назад">←</button>
                <span id="currentServerPath" style="flex:1; background:#f5f5f5; padding:4px 8px; border-radius:3px;">/</span>
                <input type="text" id="imageSearch" class="modal-input" placeholder="Поиск..." style="width: 200px;">
                <select id="sortImages" class="modal-input" style="width: 120px;">
                    <option value="name">Имя (А-Я)</option>
                    <option value="size_asc">Размер (↑)</option>
                    <option value="size_desc">Размер (↓)</option>
                </select>
                <button class="modal-btn" onclick="refreshServerImages()">🔄 Обновить</button>
                <button class="modal-btn" onclick="confirmClearAllImages()" style="background:#ffebee; color:#c62828;">🗑 Очистить все</button>
            </div>

            <!-- Контейнер для списка файлов/папок -->
            <div id="serverFilesContainer" style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
                <table class="server-files-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 8px; text-align: left;">Имя</th>
                            <th style="padding: 8px; text-align: right;">Размер</th>
                            <th style="padding: 8px; text-align: left;">Дата изменения</th>
                            <th style="padding: 8px; text-align: center;">Действие</th>
                        </tr>
                    </thead>
                    <tbody id="serverFilesList">
                        <!-- Динамически заполняется -->
                    </tbody>
                </table>
            </div>

            <div id="loadServerMessage" style="margin-top:10px; display:none; padding:8px; border-radius:3px;"></div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="closeLoadFromServerModal()">Закрыть</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно сохранения на сервер -->
<div class="modal" id="filenameModal">
    <div class="modal-content" style="width:450px;">
        <div class="modal-title">
            <span>Сохранение на сервер</span>
            <button onclick="closeFilenameModal()">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <label>Имя файла:</label>
                <input type="text" id="serverFilename" class="modal-input" value="drawing">
            </div>

            <div class="modal-row">
                <label>Формат:</label>
                <select id="serverFormat" class="modal-input">
                    <option value="tpt">TPT (Текстовая матрица)</option>
                </select>
            </div>
            <div class="modal-row">
                <label style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="addTimestamp" checked>
                    <span>Добавить дату к имени файла</span>
                </label>
            </div>

            <!-- Индикатор загрузки и сообщения -->
            <div id="uploadStatus" style="display:none; margin-top:15px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                    <div class="fas fa-spinner fa-spin"></div>
                    <span id="uploadMessage">Загрузка на сервер...</span>
                </div>
                <div style="width:100%; height:4px; background:#eee; border-radius:2px; overflow:hidden;">
                    <div id="uploadProgressBar" style="width:0%; height:100%; background:#0078d7;"></div>
                </div>
                <div style="font-size:11px; color:#666; margin-top:5px; text-align:center;">
                    <span id="uploadProgressText">0%</span>
                </div>
            </div>

            <div id="uploadResult" style="display:none; margin-top:15px; padding:10px; border-radius:4px; background:#e8f5e8; border:1px solid #4CAF50;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="fas fa-check-circle" style="color:#4CAF50;"></div>
                    <span id="resultMessage">Изображение успешно сохранено!</span>
                </div>
                <div style="font-size:11px; color:#2e7d32; margin-top:5px;">
                    <span id="resultDetails"></span>
                </div>
            </div>

            <div id="uploadError" style="display:none; margin-top:15px; padding:10px; border-radius:4px; background:#ffebee; border:1px solid #f44336;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="fas fa-exclamation-triangle" style="color:#f44336;"></div>
                    <span id="errorMessage">Ошибка загрузки</span>
                </div>
                <div style="font-size:11px; color:#c62828; margin-top:5px;">
                    <span id="errorDetails"></span>
                </div>
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" id="uploadButton" onclick="uploadToServer()">Загрузить</button>
            <button class="modal-btn" onclick="closeFilenameModal()" id="cancelButton">Отмена</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно для выбора из недавних файлов -->
<div class="modal" id="recentFilesModal">
    <div class="modal-content" style="width: 500px;">
        <div class="modal-title">
            <span>Недавние файлы</span>
            <button style="background:none;border:none;color:white;cursor:pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div id="recentFilesContainer">
                <!-- Здесь будут отображаться недавние файлы -->
            </div>
            <div class="modal-row" style="margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <button onclick="clearRecentFiles()" class="modal-btn" style="padding: 4px 12px; background: #ffebee; color: #c62828;">
                        <i class="fas fa-trash"></i> Очистить список
                    </button>
                    <span style="font-size: 11px; color: #666;" id="recentFilesCount">Загрузка...</span>
                </div>
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="closeRecentFilesModal()">Закрыть</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно для изменения размера холста -->
<div class="modal" id="resizeModal">
    <div class="modal-content">
        <div class="modal-title">
            <span>Изменение размера</span>
            <button style="background:none;border:none;color:white;cursor:pointer;">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <label>Ширина:</label>
                <input type="number" id="newWidth" class="modal-input" value="800">
            </div>
            <div class="modal-row">
                <label>Высота:</label>
                <input type="number" id="newHeight" class="modal-input" value="600">
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="applyResize()">OK</button>
            <button class="modal-btn" onclick="closeResizeModal()">Отмена</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно для медианного фильтра -->
<div class="modal" id="medianModal">
    <div class="modal-content">
        <div class="modal-title">
            <span>Медианный фильтр</span>
            <button style="background:none;border:none;color:white;cursor:pointer;">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <label>Размер апертуры:</label>
                <input type="number" id="newAperture" class="modal-input" value="3">
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="applyMedianFilter()">OK</button>
            <button class="modal-btn" onclick="closeMedianModal()">Отмена</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно для сохранения -->
<div class="modal" id="saveModal">
    <div class="modal-content">
        <div class="modal-title">
            <span>Сохранение</span>
            <button style="background:none;border:none;color:white;cursor:pointer;">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <label>Имя:</label>
                <input type="string" id="saveName" class="modal-input" value="Result">
            </div>
            <div class="modal-row">
                <label>Формат сохранения:</label>
                <select id="saveFormat" class="modal-select">
                    <option value="tpt">.tpt</option>
                    <option value="png">.png</option>
                </select>
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="applySave()">OK</button>
            <button class="modal-btn" onclick="closeSaveModal()">Отмена</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно для нормализации -->
<div class="modal" id="normalizModal">
    <div class="modal-content">
        <div class="modal-title">
            <span>Нормализация</span>
            <button style="background:none;border:none;color:white;cursor:pointer;">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <label>min:</label>
                <input type="number" id="normalizBegin" class="modal-input" value="0">
            </div>
            <div class="modal-row">
                <label>max:</label>
                <input type="number" id="normalizEnd" class="modal-input" value="1">
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="applyNormalisatioFilter()">OK</button>
            <button class="modal-btn" onclick="closeNormalisatioModal()">Отмена</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно для аппроксимации -->
<div class="modal" id="approximationModal">
    <div class="modal-content">
        <div class="modal-title">
            <span>Аппроксимация</span>
            <button style="background:none;border:none;color:white;cursor:pointer;">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <label>Порядок поверхности аппроксимации:</label>
                <input type="number" id="node_order" class="modal-input" value="3">
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="applyApproximationFilter()">OK</button>
            <button class="modal-btn" onclick="closeApproximationModal()">Отмена</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно для порога -->
<div class="modal" id="thresholdModal">
    <div class="modal-content">
        <div class="modal-title">
            <span>Порог</span>
            <button style="background:none;border:none;color:white;cursor:pointer;">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <label>min:</label>
                <input type="number" id="thresholdMin" class="modal-input" value="0">
            </div>
            <div class="modal-row">
                <label>меньше min:</label>
                <input type="number" id="thresholdLessMin" class="modal-input" value="0">
            </div>
            <div class="modal-row">
                <label>max:</label>
                <input type="number" id="thresholdMax" class="modal-input" value="1">
            </div>
            <div class="modal-row">
                <label>>max:</label>
                <input type="number" id="thresholdMoreMax" class="modal-input" value="1">
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="applyThresholdFilter()">OK</button>
            <button class="modal-btn" onclick="closeThresholdModal()">Отмена</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно для просмотра canvas -->
<div class="modal" id="canvasPreviewModal">
    <div class="modal-content" style="width: 80%; max-width: 800px; height: 70%; max-height: 600px;">
        <div class="modal-title">
            <span>Предпросмотр изображения</span>
            <button style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2em; line-height: 1;">✕</button>
        </div>
        <div class="modal-body" style="height: 80%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <canvas id="previewCanvas" width="600" height="400" style="border: 1px solid #ccc; max-width: 100%; max-height: 80%;"></canvas>

            <div style="margin-top: 10px; width: 100%; display: flex; align-items: center;">
                <label style="margin-right: 10px;">Масштаб: </label>
                <input type="range" id="scaleSlider" min="0.1" max="2.0" step="0.1" value="1.0"
                       oninput="updateCanvasScale()" style="flex: 1;">
                <span id="scaleValue" style="margin-left: 10px; width: 40px; text-align: right;">100%</span>
            </div>
        </div>
        <div class="modal-buttons" style="display: flex; justify-content: flex-end;">
            <button class="modal-btn" onclick="closeCanvasPreview()">Закрыть</button>
            <button class="modal-btn" style="background-color: #4CAF50; color: white;"
                    onclick="saveCanvasAsPng()">Сохранить как PNG</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>


<!-- Модальное окно для графика -->
<div class="modal" id="graphModal">
    <div class="modal-content" style=" width: 400px; height: 300px">
        <div class="modal-title">
            <span>Профильные характеристики ...</span>
            <button onclick="closeGraphModal()">✕</button>
        </div>
        <div class="modal-body">
            <div class="graph-panel">
                <h3>График(профиль)</h3>
                <div class="graph-container">
                    <div id="graphCanvas"></div>
                </div>
            </div>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно перемещения файла -->
<div class="modal" id="moveFileModal">
    <div class="modal-content" style="width: 450px;">
        <div class="modal-title">
            <span>Переместить файл</span>
            <button onclick="closeMoveModal()">✕</button>
        </div>
        <div class="modal-body">
            <p><strong>Файл:</strong> <span id="moveSourceFile"></span></p>
            <label for="moveDestinationFolder">Выберите целевую папку:</label>
            <select id="moveDestinationFolder" class="modal-input" style="width:100%; margin-bottom: 12px;">
                <option value="/">/ (корень)</option>
            </select>
            <p style="text-align:center; margin:8px 0;">— или —</p>
            <label for="moveCustomPath">Введите путь вручную:</label>
            <input type="text" id="moveCustomPath" class="modal-input"
                   placeholder="например: папка/подпапка/" style="width:100%; margin-bottom: 12px;">
            <p style="font-size:12px; color:#666;">* Имя файла сохранится, изменится только путь.</p>
            <div id="moveMessage" style="margin-top:10px; display:none;"></div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="executeMove()">Переместить</button>
            <button class="modal-btn" onclick="closeMoveModal()">Отмена</button>
        </div>
    </div>
</div>

<!-- Модальное окно обзора сервера (универсальное) -->
<div class="modal" id="serverBrowserModal">
    <div class="modal-content" style="width: 800px; max-width: 90vw; height: 600px; max-height: 90vh; display: flex; flex-direction: column;">
        <div class="modal-title">
            <span id="serverBrowserTitle">Обзор сервера</span>
            <button onclick="closeServerBrowser()">✕</button>
        </div>
        <div class="modal-body" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 12px;">
            <!-- Панель навигации -->
            <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
                <button class="modal-btn" id="browserNavBack" onclick="browserNavigateBack()" disabled title="Назад">←</button>
                <span id="browserCurrentPath" style="flex:1; background:#f5f5f5; padding:4px 8px; border-radius:3px; font-family: monospace;">/</span>
                <input type="text" id="browserSearch" class="modal-input" placeholder="Поиск..." style="width: 200px;">
                <select id="browserSort" class="modal-input" style="width: 120px;">
                    <option value="name">Имя (А-Я)</option>
                    <option value="size_asc">Размер (↑)</option>
                    <option value="size_desc">Размер (↓)</option>
                </select>
                <button class="modal-btn" onclick="refreshBrowser()">🔄 Обновить</button>
                <button class="modal-btn" onclick="promptNewFolder()" title="Создать новую папку">➕ Новая папка</button>
            </div>

            <!-- Таблица файлов -->
            <div style="flex: 1; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
                <table class="server-files-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f5f5f5; position: sticky; top: 0;">
                            <th style="padding: 8px; text-align: left;">Имя</th>
                            <th style="padding: 8px; text-align: right;">Размер</th>
                            <th style="padding: 8px; text-align: left;">Дата изменения</th>
                            <th style="padding: 8px; text-align: center;">Действие</th>
                        </tr>
                    </thead>
                    <tbody id="browserFilesList">
                        <!-- динамическое содержимое -->
                    </tbody>
                </table>
            </div>

            <!-- Строка состояния -->
            <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #666;">
                <span id="browserStats"></span>
                <span id="browserSelectedInfo"></span>
            </div>

            <!-- Дополнительная панель для режима сохранения -->
            <div id="browserSavePanel" style="display: none; margin-top: 12px; padding: 12px; background: #f9f9f9; border-radius: 4px; border: 1px solid #ddd;">
                <label>Имя файла:</label>
                <input type="text" id="browserSaveFilename" class="modal-input" style="width: 100%; margin-bottom: 8px;" placeholder="введите имя файла">
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="modal-btn" onclick="browserSaveHere()">Сохранить сюда</button>
                </div>
            </div>
        </div>
        <div class="modal-buttons" style="padding: 8px 16px;">
            <button class="modal-btn" id="browserActionBtn" onclick="browserAction()">Выбрать</button>
            <button class="modal-btn" onclick="closeServerBrowser()">Отмена</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно для истории действий (адаптивное по высоте) -->
<div class="modal" id="historyModal" aria-modal="true" role="dialog" aria-labelledby="historyModalTitle">
    <div class="modal-content"
         style="width: 580px;
                max-width: 95vw;
                min-height: 480px;
                max-height: 92vh;
                display: flex;
                flex-direction: column;">

        <!-- Заголовок -->
        <div class="modal-title" id="historyModalTitle"
             style="display: flex; justify-content: space-between; align-items: center;
                    padding: 12px 16px; background: #007bff; color: white; font-weight: bold;">
            <span>История изменений</span>
            <button onclick="closeHistoryModal()"
                    aria-label="Закрыть"
                    style="background: none; border: none; color: white; cursor: pointer; font-size: 1.4em; line-height: 1;">
                ✕
            </button>
        </div>

        <!-- Основное тело окна — полностью адаптивное -->
        <div class="modal-body"
             style="flex: 1 1 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    padding: 16px;
                    background: #f9f9f9;
                    overflow: hidden;">

            <!-- 1. Статистика -->
            <section class="history-stats" style="flex: 0 0 auto; padding: 12px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-around; text-align: center;">
                    <div>
                        <strong>Действий:</strong><br>
                        <span id="totalActionsCount" style="font-size: 1.35em; color: #007bff;">0</span>
                    </div>
                    <div>
                        <strong>Позиция:</strong><br>
                        <span id="currentActionPosition" style="font-size: 1.35em; color: #007bff;">0</span>
                    </div>
                </div>
            </section>

            <!-- 2. Таймлайн -->
            <section class="history-timeline" style="flex: 0 0 auto; padding: 12px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold; font-size: 14px;">Временная шкала</span>
                    <div style="display: flex; gap: 8px;">
                        <button class="modal-btn" onclick="undo()" style="padding: 5px 10px;" title="Отменить (Ctrl+Z)">←</button>
                        <button class="modal-btn" onclick="redo()" style="padding: 5px 10px;" title="Повторить (Ctrl+Y)">→</button>
                    </div>
                </div>
                <div style="position: relative; height: 32px;">
                    <input type="range" id="historySlider" min="0" max="0" value="0" step="1"
                           style="width: 100%; position: absolute; top: 50%; transform: translateY(-50%);"
                           oninput="debounceTemporaryRestore(this.value)"
                           onchange="jumpToHistoryState(this.value)">
                    <div class="history-markers" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: center; pointer-events: none;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 12px; color: #666;">
                    <span>Начало</span>
                    <span>Текущее</span>
                    <span>Конец</span>
                </div>
            </section>

            <!-- 3. Список действий — АДАПТИВНЫЙ ПО ВЫСОТЕ -->
            <section class="history-list-container"
                     style="flex: 1 1 auto;
                            min-height: 0;
                            display: flex;
                            flex-direction: column;
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            overflow: hidden;">

                <ul id="historyListBody"
                    style="list-style: none;
                           padding: 0;
                           margin: 0;
                           flex: 1 1 auto;
                           overflow-y: auto;
                           overflow-x: hidden;">
                    <!-- Динамически заполняется через JS -->
                </ul>
            </section>

            <!-- 4. Опции внизу -->
            <section class="history-options" style="flex: 0 0 auto; padding: 12px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="autoSaveHistory" checked>
                        Автосохранение истории
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px;">
                        Макс. действий:
                        <input type="number" id="maxHistorySize" value="50" min="10" max="200" step="10"
                               style="width: 70px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                    </label>
                    <button class="modal-btn" onclick="clearHistory()"
                            style="background: #dc3545; color: white;">
                        Очистить историю
                    </button>
                </div>
            </section>

        </div>

        <!-- Кнопки внизу -->
        <div class="modal-buttons"
             style="padding: 12px 16px; border-top: 1px solid #ddd; display: flex; justify-content: flex-end; gap: 10px;">
            <button class="modal-btn" onclick="closeHistoryModal()"
                    style="background: #6c757d; color: white;">Закрыть</button>
            <button class="modal-btn" onclick="jumpToSelectedState()"
                    style="background: #28a745; color: white;">Перейти к выбранному</button>
        </div>

        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно прогресса -->
<div class="modal" id="progressModal">
    <div class="modal-content" style="width: 400px;">
        <div class="modal-title">
            <span id="progressModalTitle">Выполнение операции</span>
            <button onclick="closeProgressModal()" style="background:none;border:none;color:white;cursor:pointer;">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <p id="progressMessage" class="progress-message">Идёт обработка...</p>
            </div>
            <div class="modal-row progress-container">
                <div class="progress-bar">
                    <div id="progressBarFill" class="progress-bar-fill"></div>
                </div>
                <div class="progress-text">
                    <span id="progressPercent">0%</span>
                </div>
            </div>
            <div class="modal-row" id="progressCancelRow" style="display:flex; justify-content:center;">
                <button class="modal-btn" id="progressCancelBtn" style="background:#dc3545; color:white;">Отмена</button>
            </div>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно управления сервером (две панели) -->
<div class="modal" id="serverCommanderModal">
    <div class="modal-content" style="width: 1200px; max-width: 95vw; height: 700px; max-height: 90vh; display: flex; flex-direction: column;">
        <div class="modal-title">
            <span>Управление файлами на сервере</span>
            <button onclick="closeServerCommander()">✕</button>
        </div>
        <div class="modal-body" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 8px;">

            <!-- Отображение текущих путей -->
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <div style="flex: 1; display: flex; align-items: center; gap: 4px;">
                    <span>Левая:</span>
                    <input type="text" id="leftPath" class="modal-input" readonly style="flex: 1; background: #f5f5f5;">
                </div>
                <div style="flex: 1; display: flex; align-items: center; gap: 4px;">
                    <span>Правая:</span>
                    <input type="text" id="rightPath" class="modal-input" readonly style="flex: 1; background: #f5f5f5;">
                </div>
            </div>

            <!-- Две панели -->
            <div style="display: flex; gap: 8px; flex: 1; overflow: hidden;">
                <!-- Левая панель -->
                <div class="server-panel" id="leftPanel" style="flex: 1; display: flex; flex-direction: column; border: 1px solid #ccc; border-radius: 4px; overflow: hidden;">
                    <div class="panel-header" style="background: #e0e0e0; padding: 4px 8px; font-weight: bold;">Левая панель</div>
                    <div class="panel-content" style="flex: 1; overflow-y: auto; background: white; padding: 4px;">
                        <table class="server-files-table" style="width: 100%;">
                            <tbody id="leftPanelList">
                                <!-- Заполняется динамически -->
                            </tbody>
                        </table>
                    </div>
                </div>
                <!-- Правая панель -->
                <div class="server-panel" id="rightPanel" style="flex: 1; display: flex; flex-direction: column; border: 1px solid #ccc; border-radius: 4px; overflow: hidden;">
                    <div class="panel-header" style="background: #e0e0e0; padding: 4px 8px; font-weight: bold;">Правая панель</div>
                    <div class="panel-content" style="flex: 1; overflow-y: auto; background: white; padding: 4px;">
                        <table class="server-files-table" style="width: 100%;">
                            <tbody id="rightPanelList">
                                <!-- Заполняется динамически -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Панель кнопок (внизу) -->
            <div style="margin-top: 8px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                <button class="modal-btn" onclick="createFolderInActivePanel()">➕ Создать папку</button>
                <button class="modal-btn" id="commanderSelectBtn" onclick="commanderSelect()">Выбрать</button>
                <button class="modal-btn" onclick="refreshBothPanels()">🔄 Обновить</button>
                <button class="modal-btn" onclick="closeServerCommander()">✖ Закрыть</button>
            </div>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>



<!-- Модальное окно для поиск окружности-->
<div class="modal" id="roundSearchingModal">
    <div class="modal-content" style="width:450px;">
        <div class="modal-title">
            <span>Поиск окружности</span>
            <button onclick="closeRoundSearchingModal()">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <label style="display:flex; align-items:center; gap:8px;">
                    <input type="radio" name="shape" id="chooseCircle" value="circle" checked>
                    <span>Окружность</span>
                </label>

                <label style="display:flex; align-items:center; gap:8px;">
                    <input type="radio" name="shape" id="chooseEllipse" value="ellipse">
                    <span>Эллипс</span>
                </label>
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" id="uploadButton" onclick="applyRoundSearchingFilter()">Ок</button>
            <button class="modal-btn" onclick="closeRoundSearchingModal()" id="cancelButton">Отмена</button>
        </div>
        <div class="modal-resize-handle"></div>
    </div>
</div>

<!-- Модальное окно вывода парамеров окружности-->
<div class="modal " id="resultRoundSearchingModal">
    <div class="modal-content" style="width: 300px;height: 150px;">
        <div class="modal-title">
            <span>Параметры окружности (в пикселях)</span>
            <button onclick="closeResultRoundSearchingModal()">✕</button>
        </div>
        <div class="modal-body">
            <div class="modal-row">
                <div class="form-group">
                    <label for="centerX">Центр (X):</label>
                    <output id="centerX" class="output-value"></output>
                </div>

                <div class="form-group">
                    <label for="centerY">Центр (Y):</label>
                    <output id="centerY" class="output-value"></output>
                </div>

                <div class="form-group">
                    <label for="radius">Радиус:</label>
                    <output id="radius" class="output-value"></output>
                </div>
            </div>
        </div>
        <div class="modal-buttons">
            <button class="modal-btn" onclick="closeResultRoundSearchingModal()">Ок</button>
        </div>
    </div>
</div>
`;

/**
 * Рендерит модальные окна в указанный контейнер
 * @param {HTMLElement|string} container - Контейнер или селектор контейнера
 */
export function renderModals(container = '#modals-container') {
    const el = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
    
    if (el) {
        el.innerHTML = modalsHTML;
        console.log('Модальные окна успешно загружены');
    } else {
        console.error('Контейнер для модальных окон не найден:', container);
    }
}

/**
 * Автозапуск при загрузке модуля (если есть контейнер)
 */
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        renderModals();
    });
}
