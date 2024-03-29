from app import socketio, db
from flask_socketio import Namespace, emit, join_room, leave_room, \
    close_room, rooms, disconnect, send
from flask import request, session
from flask_login import current_user
from app.models import User, Message, Friendship
import datetime
import functools

def authenticated_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            disconnect()
        else:
            return f(*args, **kwargs)
    return wrapped

class ChatIO(Namespace):

    @authenticated_only
    def on_join(self):
        session['sid'] = request.sid
        current_user.user_info.status = "online"
        db.session.commit()
        # cache.set('users_status_%s' % current_user.username, session[current_user.username])
        emit('status', {'user': current_user.username, 'status': 'user_online'}, room=current_user.key[0], include_self=False)
        ### Ignore bcz of GET -> =
        for friend in current_user.friendships:
            join_room(friend.chatKey)

    @authenticated_only
    def on_leave(self):
        # room = message.get('room', None)
        session.pop('sid')
        current_user.user_info.status = "offline"
        current_user.user_info.last_seen = datetime.datetime.now()
        db.session.commit()
        # cache.set('users_status_%s' % current_user.username, session[current_user.username])
        emit('status', {'user': current_user.username, 'status': 'user_offline'}, room=current_user.key[0], include_self=False)
        # if room:
        #     leave_room(room)
        # else:
        #     for room in current_user.rooms:
        #         leave_room(room)


    @authenticated_only
    def on_text(self, message):
        recipient = message['recipient']
        body = message['msg']

        recipient_user = db.session.query(User).filter_by(username=recipient).first()
        friendship_chat = Friendship.query.filter((Friendship.friend_a_id==current_user.id)&(Friendship.friend_b_id==recipient_user.id)).first()
        room = friendship_chat.chatKey

        ## Saving to message table
        message = Message(message=body, seen=False, created_at=datetime.datetime.now(), senderID=current_user.id, reciverID=recipient_user.id)
        db.session.add(message)
        db.session.commit()

        emit('message', {'user': current_user.username, 'msg': body}, room=room, include_self=False, broadcast=False)


    @authenticated_only
    def on_typing(self, message):
        recipient = message['recipient']
        recipient_user = db.session.query(User).filter_by(username=recipient).first()
        friendship_chat = Friendship.query.filter((Friendship.friend_a_id==current_user.id)&(Friendship.friend_b_id==recipient_user.id)).first()
        room = friendship_chat.chatKey

        status = message['status']
        if status == '1':
            emit('status', {'user': current_user.username, 'status': 'typing'}, room=room, include_self=False)
        if status == '0':
            emit('status', {'user': current_user.username, 'status': 'not_typing'}, room=room, include_self=False)


    @authenticated_only
    def on_disconnect(self):
        print("Executing user logged in")
        current_user.user_info.status = "offline"
        emit('status', {'user': current_user.username, 'status': 'user_offline'}, room=current_user.key[0], include_self=False)
        print('Client Disconnected', request.sid)

    @authenticated_only
    def on_connect(self):
        print('Client connected', request.sid)


socketio.on_namespace(ChatIO('/api/chat'))
