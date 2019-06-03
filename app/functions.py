from app import socketio
from flask_socketio import Namespace, emit, join_room, leave_room, \
    close_room, rooms, disconnect, send
from flask import request, session

class ChatIO(Namespace):

    def on_join(self, message):
        room = message['room']
        session['name'] = message['name']
        join_room(room)

    def on_leave(self, message):
        print("Leaving")
        room = message['room']
        emit('status', {'user': session.get('name'), 'msg': "User offline"}, room=room)
        leave_room(room)

    def on_text(self, message):
        room = message['room']
        print("Sending message")
        emit('message', {'user': session.get('name'), 'msg': message['msg']}, room=room, include_self=False)


    def on_disconnect(self):
        print("Discconect")
        emit('status', {'user': session.get('name'), 'msg': "User offline"}, room=room)
        disconnect()

    def on_connect(self):
        print('Client connected', request.sid)


socketio.on_namespace(ChatIO('/api/chat'))
