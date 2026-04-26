"""
Пример реализации WebSocket на Flask с использованием Flask-SocketIO

Этот файл демонстрирует:
1. Подключение WebSocket к существующему Flask приложению
2. Обработку событий подключения/отключения клиентов
3. Отправку и получение сообщений в реальном времени
4. Вещание сообщений всем подключенным клиентам
5. Отправку сообщений в конкретную комнату
"""

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
import logging

# Создаем Flask приложение (или импортируем из app.py)
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Требуется для Flask-SocketIO

# Инициализируем SocketIO
# cors_allowed_origins="*" разрешает подключения с любых доменов (для разработки)
# Для продакшена укажите конкретные домены
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ==================== СОБЫТИЯ WEBSOCKET ====================

@app.route('/')
def index():
    """Главная страница с примером WebSocket клиента"""
    return render_template('websocket_demo.html')


@socketio.on('connect')
def handle_connect(auth=None):
    """
    Обрабатывает подключение нового клиента
    
    :param auth: данные аутентификации (если переданы при подключении)
    """
    client_id = request.sid
    logger.info(f"Клиент подключился: {client_id}")
    
    # Отправляем подтверждение подключения клиенту
    emit('server_response', {
        'type': 'connection',
        'message': f'Вы успешно подключены! Ваш ID: {client_id}',
        'client_id': client_id
    })
    
    # Можно отправить сообщение всем остальным клиентам о новом подключении
    emit('broadcast', {
        'type': 'user_joined',
        'message': f'Новый пользователь подключился'
    }, broadcast=True, include_self=False)
    
    return True  # Разрешить подключение


@socketio.on('disconnect')
def handle_disconnect():
    """Обрабатывает отключение клиента"""
    client_id = request.sid
    logger.info(f"Клиент отключился: {client_id}")
    
    # Уведомляем остальных клиентов
    emit('broadcast', {
        'type': 'user_left',
        'message': f'Пользователь отключился',
        'client_id': client_id
    }, broadcast=True, include_self=False)


@socketio.on('client_message')
def handle_client_message(data):
    """
    Обрабатывает сообщение от клиента и отправляет его всем
    
    :param data: данные сообщения (обычно словарь)
    """
    client_id = request.sid
    message = data.get('message', '')
    username = data.get('username', 'Аноним')
    
    logger.info(f"Сообщение от {client_id}: {message}")
    
    # Отправляем сообщение всем подключенным клиентам
    emit('new_message', {
        'type': 'chat',
        'username': username,
        'message': message,
        'client_id': client_id,
        'timestamp': datetime.now().isoformat()
    }, broadcast=True)


@socketio.on('join_room_event')
def handle_join_room(data):
    """
    Обрабатывает присоединение клиента к комнате
    
    :param data: {'room': 'название_комнаты'}
    """
    room = data.get('room')
    if not room:
        emit('error', {'message': 'Необходимо указать название комнаты'})
        return
    
    client_id = request.sid
    join_room(room)
    
    logger.info(f"Клиент {client_id} присоединился к комнате {room}")
    
    # Отправляем подтверждение клиенту
    emit('room_joined', {
        'type': 'room_join',
        'room': room,
        'message': f'Вы присоединились к комнате {room}'
    })
    
    # Уведомляем других участников комнаты
    emit('room_notification', {
        'type': 'user_joined_room',
        'room': room,
        'username': data.get('username', 'Аноним'),
        'client_id': client_id
    }, room=room, include_self=False)


@socketio.on('leave_room_event')
def handle_leave_room(data):
    """
    Обрабатывает выход клиента из комнаты
    
    :param data: {'room': 'название_комнаты'}
    """
    room = data.get('room')
    if not room:
        return
    
    client_id = request.sid
    leave_room(room)
    
    logger.info(f"Клиент {client_id} покинул комнату {room}")
    
    # Уведомляем других участников комнаты
    emit('room_notification', {
        'type': 'user_left_room',
        'room': room,
        'username': data.get('username', 'Аноним'),
        'client_id': client_id
    }, room=room)


@socketio.on('room_message')
def handle_room_message(data):
    """
    Отправляет сообщение только участникам конкретной комнаты
    
    :param data: {'room': 'название_комнаты', 'message': 'текст'}
    """
    room = data.get('room')
    message = data.get('message', '')
    username = data.get('username', 'Аноним')
    
    if not room:
        emit('error', {'message': 'Необходимо указать комнату'})
        return
    
    logger.info(f"Сообщение в комнату {room} от {request.sid}: {message}")
    
    # Отправляем сообщение только участникам комнаты
    emit('new_room_message', {
        'type': 'room_chat',
        'room': room,
        'username': username,
        'message': message,
        'client_id': request.sid,
        'timestamp': datetime.now().isoformat()
    }, room=room)


@socketio.on('private_message')
def handle_private_message(data):
    """
    Отправляет приватное сообщение конкретному клиенту
    
    :param data: {'to': 'client_id', 'message': 'текст'}
    """
    to_client = data.get('to')
    message = data.get('message', '')
    
    if not to_client:
        emit('error', {'message': 'Необходимо указать получателя'})
        return
    
    logger.info(f"Приватное сообщение от {request.sid} к {to_client}: {message}")
    
    # Отправляем сообщение конкретному клиенту
    emit('private_message_received', {
        'type': 'private',
        'from': request.sid,
        'message': message,
        'timestamp': datetime.now().isoformat()
    }, room=to_client)
    
    # Подтверждение отправителю
    emit('private_message_sent', {
        'type': 'private_sent_confirm',
        'to': to_client,
        'message': message
    })


@socketio.on('ping')
def handle_ping():
    """Обработчик ping для проверки соединения"""
    emit('pong', {'timestamp': datetime.now().isoformat()})


# ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

def send_to_all_clients(event_name, data):
    """
    Отправить событие всем подключенным клиентам
    
    :param event_name: имя события
    :param data: данные для отправки
    """
    socketio.emit(event_name, data, broadcast=True)


def send_to_room(room_name, event_name, data):
    """
    Отправить событие всем клиентам в комнате
    
    :param room_name: название комнаты
    :param event_name: имя события
    :param data: данные для отправки
    """
    socketio.emit(event_name, data, room=room_name)


def send_to_client(client_id, event_name, data):
    """
    Отправить событие конкретному клиенту
    
    :param client_id: ID клиента (request.sid)
    :param event_name: имя события
    :param data: данные для отправки
    """
    socketio.emit(event_name, data, room=client_id)


# Импортируем datetime для использования в функциях выше
from datetime import datetime


# ==================== ЗАПУСК ПРИЛОЖЕНИЯ ====================

if __name__ == '__main__':
    # Важно: использовать socketio.run() вместо app.run()
    # host='0.0.0.0' делает сервер доступным извне
    # port=5000 - порт по умолчанию
    # debug=True включает режим отладки (не используйте в продакшене)
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=5000, 
        debug=True,
        allow_unsafe_werkzeug=True  # Для режима отладки
    )
