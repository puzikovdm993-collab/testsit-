# Архитектура приложения WTIS

## 1. Обзор архитектуры

WTIS (Web-based Tomograph Instrumental System) построена по **клиент-серверной архитектуре** с разделением ответственности между frontend и backend компонентами.

### Архитектурная диаграмма

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Frontend (JavaScript)                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   index.html │  │ workflow.html│  │   CSS Styles    │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              src/ (Модульная система)               │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │  │
│  │  │  │ imageOps │ │  server  │ │fileManager│            │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘            │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │  │
│  │  │  │  models  │ │    ui    │ │  events  │            │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘            │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │  │
│  │  │  │   tabs   │ │ history  │ │ drawing  │            │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘            │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │  │
│  │  │  │recentFiles││   main   │ │  tools   │            │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘            │  │  │
│  │  │  ┌──────────┐                                       │  │  │
│  │  │  │ globals  │                                       │  │  │
│  │  │  └──────────┘                                       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐    │  │
│  │  │   Plotly.js     │  │   Canvas API + Font Awesome │    │  │
│  │  │ (3D Visualisation)│  │   (Rendering & Icons)      │    │  │
│  │  └─────────────────┘  └─────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER (Python/Flask)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      app.py (Backend)                     │  │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐ │  │
│  │  │   REST API      │  │   File Operations               │ │  │
│  │  │   Endpoints     │  │   (Local Storage)               │ │  │
│  │  └─────────────────┘  └─────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              MinIO Client (S3-compatible)           │  │  │
│  │  │         (Object Storage for Matrix Data)            │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ S3 Protocol
┌─────────────────────────────────────────────────────────────────┐
│                      MinIO Object Storage                       │
│                    (Matrix Data in JSON+Base64)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Компоненты системы

### 2.1 Frontend Architecture

#### Модульная структура

Frontend построен по **модульному принципу** с чётким разделением ответственности:

| Модуль | Ответственность | Зависимости |
|--------|----------------|-------------|
| **main.js** | Точка входа, инициализация приложения | globals, events, ui |
| **globals.js** | Глобальные константы и конфигурация | - |
| **models.js** | Структуры данных, сериализация/десериализация | globals |
| **imageOps.js** | Обработка изображений, фильтры, колормэпы | models, globals |
| **server.js** | HTTP-запросы к backend, загрузка/выгрузка файлов | models, globals |
| **fileManager.js** | Управление файлами, история открытых файлов | server, models, recentFiles |
| **ui.js** | Рендеринг UI компонентов, обновление интерфейса | globals, models |
| **events.js** | Обработчики событий, горячие клавиши | all modules |
| **tabs.js** | Логика переключения вкладок ribbon-интерфейса | ui, events |
| **history.js** | Стек отмены/повтора действий (Undo/Redo) | models, imageOps |
| **drawing.js** | Рисование на canvas (выделения, лассо) | ui, events |
| **tools.js** | Инструменты редактирования | drawing, imageOps |
| **recentFiles.js** | Список последних файлов (LocalStorage) | fileManager |

#### Поток данных во Frontend

```
User Action → Events → [Module Logic] → Models → UI Update
                      ↓
                  Server (if needed)
                      ↓
                  MinIO/Local Storage
```

#### Паттерны проектирования

- **Module Pattern** - каждый модуль инкапсулирован в IIFE (Immediately Invoked Function Expression)
- **Observer Pattern** - события DOM обрабатываются централизованно в events.js
- **Command Pattern** - история действий реализована через стек команд (history.js)
- **Singleton Pattern** - глобальное состояние хранится в globals.js

### 2.2 Backend Architecture

#### Flask Application (app.py)

Backend представляет собой **REST API** на базе Flask со следующими responsibilities:

1. **Serve Static Files** - отдача HTML, CSS, JS файлов
2. **File Operations** - работа с локальной файловой системой
3. **MinIO Integration** - объектное хранилище для матричных данных
4. **CORS Support** -跨源请求支持

#### Структура backend

```
app.py
├── Configuration (Env variables)
├── Routes
│   ├── Page Routes (/)
│   ├── Local File Routes (/list_local, /upload, /delete)
│   └── MinIO Routes (/list_minio, /upload_minio, /download_minio, etc.)
├── Helper Functions
│   ├── MinIO Client Initialization
│   ├── File Validation
│   └── Error Handling
└── Main Entry Point
```

#### Взаимодействие с MinIO

```python
# Flow: Client → Flask → MinIO
1. Client sends matrix data (JSON + Base64)
2. Flask validates and forwards to MinIO
3. MinIO stores object in bucket
4. Response returned to client
```

---

## 3. Слои архитектуры

### Layer 1: Presentation Layer (UI)
- **index.html** - главная страница с ribbon-интерфейсом
- **workflow.html** - рабочая область с canvas и панелями
- **CSS** - стилизация (index.css, workflow.css, modals.css)
- **Font Awesome** - иконки интерфейса

### Layer 2: Application Logic Layer
- **imageOps.js** - бизнес-логика обработки изображений
- **fileManager.js** - логика управления файлами
- **history.js** - логика отмены/повтора действий
- **tools.js** - инструменты редактирования

### Layer 3: Data Access Layer
- **server.js** - HTTP клиент для взаимодействия с backend
- **models.js** - модели данных и сериализация
- **recentFiles.js** - localStorage для истории файлов

### Layer 4: Backend Layer
- **Flask API** - REST endpoints
- **File System** - локальное хранилище
- **MinIO Client** - S3-compatible object storage

### Layer 5: Storage Layer
- **Local Storage** - временные файлы на сервере
- **MinIO** - постоянное хранилище матриц
- **LocalStorage (Browser)** - недавние файлы, настройки

---

## 4. Поток выполнения операций

### 4.1 Загрузка изображения

```
1. User clicks "Open File" button
   ↓
2. events.js captures click event
   ↓
3. fileManager.js opens file dialog
   ↓
4. File read as ArrayBuffer/Base64
   ↓
5. models.js parses image data
   ↓
6. imageOps.js processes image matrix
   ↓
7. ui.js renders image on canvas
   ↓
8. history.js saves state for undo
   ↓
9. recentFiles.js updates localStorage
```

### 4.2 Применение фильтра

```
1. User selects filter from ribbon
   ↓
2. events.js captures selection
   ↓
3. imageOps.js applies filter algorithm
   ↓
4. models.js updates matrix data
   ↓
5. ui.js re-renders canvas with new data
   ↓
6. history.js pushes previous state to stack
```

### 4.3 Сохранение в MinIO

```
1. User clicks "Save to MinIO"
   ↓
2. fileManager.js prepares data
   ↓
3. models.js serializes matrix to JSON+Base64
   ↓
4. server.js sends POST /upload_minio
   ↓
5. Flask receives request
   ↓
6. Flask uploads to MinIO via boto3
   ↓
7. MinIO confirms storage
   ↓
8. Response propagated back to UI
   ↓
9. ui.js shows success notification
```

---

## 5. Ключевые архитектурные решения

### 5.1 Модульность
- Каждый функциональный блок выделен в отдельный модуль
- Минимальные зависимости между модулями
- Чёткие интерфейсы взаимодействия

### 5.2 Разделение ответственности
- **UI Module** - только рендеринг, без бизнес-логики
- **ImageOps Module** - только обработка, без UI
- **Server Module** - только HTTP, без обработки данных

### 5.3 История действий (Undo/Redo)
- Реализована через стек состояний
- Хранит до 50 предыдущих состояний
- Использует Command pattern для отката операций

### 5.4 Работа с большими данными
- Матрицы хранятся в оптимизированном формате
- Base64 кодирование для передачи через JSON
- Потоковая обработка для больших файлов

### 5.5 Интеграция с облачным хранилищем
- S3-compatible API через MinIO
- Абстракция хранилища в server.js
- Поддержка как локальных, так и облачных файлов

---

## 6. Безопасность и надёжность

### 6.1 Безопасность
- CORS настроен для конкретного origin
- Валидация входных данных на backend
- Environment variables для чувствительных данных

### 6.2 Надёжность
- Обработка ошибок на всех уровнях
- Graceful degradation при недоступности MinIO
- LocalStorage backup для критичных данных

### 6.3 Производительность
- Canvas rendering оптимизирован для больших изображений
- Debouncing для частых событий
- Lazy loading для тяжёлых операций

---

## 7. Расширяемость

### Точки расширения

1. **Новые фильтры** - добавить в imageOps.js
2. **Новые форматы файлов** - расширить models.js
3. **Новые хранилища** - реализовать адаптер в server.js
4. **Новые инструменты** - добавить в tools.js и drawing.js
5. **Новые UI компоненты** - расширить ui.js

### Plugin Architecture (потенциальная)
- Модульная структура позволяет легко добавлять плагины
- Events system поддерживает кастомные события
- Models могут быть расширены новыми типами данных

---

## 8. Диаграмма последовательности (Sequence Diagram)

### Открытие и обработка файла

```
User          events.js      fileManager.js    imageOps.js      ui.js        server.js      Flask        MinIO
 │                │                │                │              │              │            │            │
 ├─Click Open────▶│                │                │              │              │            │            │
 │                ├─Open Dialog───▶│                │              │              │            │            │
 │                │                │                │              │              │            │            │
 │                │◀─File Selected─┤                │              │              │            │            │
 │                │                │                │              │              │            │            │
 │                │                ├─Read File─────▶│              │              │            │            │
 │                │                │                │              │              │            │            │
 │                │                │◀─Matrix Data───┤              │              │            │            │
 │                │                │                │              │              │            │            │
 │                │                │                ├─Process─────▶│              │            │            │
 │                │                │                │              │              │            │            │
 │                │                │                │◀─Render Data─┤              │            │            │
 │                │                │                │              │              │            │            │
 │                │                │                │              ├─Draw Canvas─▶│            │            │
 │                │                │                │              │              │            │            │
 │◀─Image Shown───┼────────────────┼────────────────┼──────────────┤              │            │            │
 │                │                │                │              │              │            │            │
```

---

## 9. Заключение

Архитектура WTIS представляет собой **современное веб-приложение** с:

- ✅ Чётким разделением ответственности (SoC)
- ✅ Модульной структурой кода
- ✅ Поддержкой отмены/повтора действий
- ✅ Интеграцией с облачным хранилищем
- ✅ Масштабируемым дизайном
- ✅ Хорошей расширяемостью

Данная архитектура позволяет легко поддерживать и развивать проект, добавляя новые функции без нарушения существующей структуры.
