# Использование настроек проектов и пользователя

## Обзор

Добавлена функциональность для хранения и управления настройками проектов и пользовательскими настройками с использованием localStorage. Настройки доступны во всех основных файлах приложения: `penpot-projects.html`, `index.html` и `workflow.html`.

## Кнопка настроек проекта

В карточке каждого проекта на странице `penpot-projects.html` добавлена кнопка "три точки" (⋮) в правом верхнем углу. При нажатии открывается меню с опциями:

- **⚙️ Настройки проекта** - открывает настройки конкретного проекта
- **📋 Дублировать** - создает копию проекта с сохранением настроек
- **🗑️ Удалить** - удаляет проект и его настройки

## Доступные функции JavaScript

### Для работы с настройками проекта:

```javascript
// Получить настройки конкретного проекта
const settings = getProjectSettings('proj_123');

// Сохранить настройки проекта
saveProjectSettings('proj_123', { theme: 'dark', zoom: 1.5 });
```

### Для работы с пользовательскими настройками:

```javascript
// Получить пользовательские настройки
const userSettings = getUserSettings();

// Сохранить пользовательские настройки
saveUserSettings({ language: 'ru', notifications: true });
```

### Для работы с текущим проектом:

```javascript
// Получить информацию о текущем активном проекте
const project = getCurrentProject();
// Возвращает: { id, name, type, settings }

// Проверить, есть ли активный проект
if (hasActiveProject()) {
    // Работа с проектом
}
```

## Структура хранения в localStorage

- `project_settings_<projectId>` - настройки конкретного проекта (JSON)
- `user_settings` - общие пользовательские настройки (JSON)
- `activeProjectId` - ID текущего активного проекта
- `activeProjectName` - имя текущего активного проекта
- `activeProjectType` - тип текущего активного проекта (classic, tis, workflow)

## Пример использования в index.html или workflow.html

```javascript
// При загрузке страницы получить настройки проекта
window.addEventListener('load', () => {
    if (hasActiveProject()) {
        const project = getCurrentProject();
        console.log(`Текущий проект: ${project.name}`);
        console.log(`Настройки:`, project.settings);
        
        // Применить настройки
        if (project.settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
    
    // Получить пользовательские настройки
    const userSettings = getUserSettings();
    console.log('Пользователь:', userSettings);
});

// Сохранение настроек при изменении
function onZoomChange(newZoom) {
    const project = getCurrentProject();
    if (project) {
        const settings = getProjectSettings(project.id);
        settings.zoom = newZoom;
        saveProjectSettings(project.id, settings);
    }
}
```

## Файлы с изменениями

1. **penpot-projects.html** - кнопка настроек в карточке проекта, меню действий, функции управления
2. **index.html** - общие функции для доступа к настройкам
3. **workflow.html** - общие функции для доступа к настройкам
