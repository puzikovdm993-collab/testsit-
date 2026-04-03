# API для управления проектами в MinIO

Этот документ описывает новые endpoints для сохранения и загрузки проектов в/из MinIO.

## Формат данных проекта

Проект хранится в формате JSON со следующей структурой:

```json
{
  "project": {
    "id": "proj_tis_89234",
    "name": "Мой TIS Проект",
    "type": "tis",
    "createdAt": "2023-10-27T10:00:00Z",
    "rootPath": "/workspace/projects/my-tis-project",
    "settings": {
      "theme": "dark",
      "fontSize": 14,
      "autoSave": true
    }
  },
  "history": {
    "lastOpened": "2023-10-27T14:30:00Z",
    "activeFileId": "file_003",
    "files": [
      {
        "id": "file_001",
        "path": "src/main.tis",
        "language": "tis",
        "wasOpen": true,
        "cursorPosition": { "line": 15, "column": 4 },
        "scrollTop": 120
      }
    ],
    "uiState": {
      "sidebarVisible": true,
      "terminalHeight": 200,
      "panelLayout": "vertical"
    }
  }
}
```

## Endpoints

### 1. Сохранение проекта

**POST** `/save_project`

Сохраняет проект в MinIO.

**Request Body:**
```json
{
  "project": {
    "id": "proj_tis_89234",
    "name": "Мой TIS Проект",
    ...
  },
  "history": {
    ...
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "project_id": "proj_tis_89234",
  "object_name": "projects/proj_tis_89234.json",
  "message": "Project saved successfully"
}
```

**cURL пример:**
```bash
curl -X POST http://localhost:15404/save_project \
  -H "Content-Type: application/json" \
  -d '{
    "project": {
      "id": "proj_tis_89234",
      "name": "Мой TIS Проект",
      "type": "tis",
      "createdAt": "2023-10-27T10:00:00Z",
      "rootPath": "/workspace/projects/my-tis-project",
      "settings": {
        "theme": "dark",
        "fontSize": 14,
        "autoSave": true
      }
    },
    "history": {
      "lastOpened": "2023-10-27T14:30:00Z",
      "activeFileId": "file_003",
      "files": [],
      "uiState": {}
    }
  }'
```

---

### 2. Загрузка проекта

**GET** `/load_project/<project_id>`

Загружает проект из MinIO по его ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj_tis_89234",
      "name": "Мой TIS Проект",
      ...
    },
    "history": {
      ...
    }
  }
}
```

**cURL пример:**
```bash
curl http://localhost:15404/load_project/proj_tis_89234
```

---

### 3. Список всех проектов

**GET** `/list_projects`

Возвращает список всех проектов в MinIO.

**Response (200 OK):**
```json
{
  "success": true,
  "projects": [
    {
      "id": "proj_tis_89234",
      "object_name": "projects/proj_tis_89234.json",
      "size": 1234,
      "last_modified": "2023-10-27 14:30:00",
      "etag": "abc123..."
    }
  ],
  "count": 1
}
```

**cURL пример:**
```bash
curl http://localhost:15404/list_projects
```

---

### 4. Удаление проекта

**DELETE** `/delete_project/<project_id>`

Удаляет проект из MinIO по его ID.

**Response (200 OK):**
```json
{
  "success": true,
  "project_id": "proj_tis_89234",
  "message": "Project deleted successfully"
}
```

**cURL пример:**
```bash
curl -X DELETE http://localhost:15404/delete_project/proj_tis_89234
```

---

## Конфигурация

Для работы с MinIO необходимо настроить переменные окружения в файле `.env`:

```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=test
MINIO_SECRET_KEY=test
MINIO_BUCKET=wtis
MINIO_REGION=us-east-1
MINIO_SECURE=False
```

Проекты хранятся в бакете `MINIO_BUCKET` с префиксом `projects/`.
