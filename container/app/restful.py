from flask_restful import Resource, reqparse, url_for
from app.models import User, Message, Friendship, Attachment
from app import socketio, db
from flask_login import current_user
from werkzeug import datastructures
from flask import session, current_app
from mimetypes import guess_extension
import datetime
import os

chat_args = reqparse.RequestParser()
chat_args.add_argument('user', type=str, help='Getting message from $user')
chat_args.add_argument('receiver', type=str, help='Getting message from $user')

attachments_args = chat_args.copy()
attachments_args.add_argument(
    'file', type=datastructures.FileStorage, help='File to upload', location='files')
attachments_args.add_argument(
    'file_name', type=str, help='File name', location='form')
attachments_args.add_argument(
    'file_size', type=int, help='File size', location='form')
attachments_args.add_argument(
    'file_type', type=str, help='File type', location='form')
attachments_args.add_argument(
    'file_extension', type=str, help='File Extension', location='form')
attachments_args.add_argument(
    'file_id', type=str, help='File Id', location='form')


class ChatMessages(Resource):
    def post(self):
        if current_user.is_authenticated:
            args = chat_args.parse_args()
            user = User.query.filter_by(username=args['user']).first()
            receiver = User.query.filter_by(username=args['receiver']).first()
            db_messages = Message.query.filter((
                (Message.senderID == user.id) & (Message.reciverID == receiver.id)) | ((Message.senderID == receiver.id) & (Message.reciverID == user.id))).all()

            messages = [
            ]
            for m in db_messages:
                message = {}
                if m.senderID == user.id:
                    message['sender'] = user.username
                    message['receiver'] = receiver.username
                else:
                    message['sender'] = receiver.username
                    message['receiver'] = user.username
                if m.attachment:
                    try:
                        extension = guess_extension(m.attachment[0].type).replace('.', '')
                    except AttributeError:
                        extension = ''
                    message['attachment'] = {
                        'title': m.attachment[0].file_name,
                        'id': m.attachment[0].attachment_id,
                        'extension': extension,
                        'link': url_for('download', u=message['sender'], id=m.attachment[0].attachment_id)
                    }
                message['text'] = m.message
                messages.append(message)

            return {'messages': messages}
        else:
            return {'status': "Error 401: Unauthorized"}


class Attachments(Resource):
    def post(self):
        if current_user.is_authenticated:
            args = attachments_args.parse_args()
            file = args['file']
            file_name = args['file_name']
            file_size = args['file_size']
            file_type = args['file_type']
            file_id = args['file_id']
            file_extension = args['file_extension']
            recipient = args['receiver']
            sender = current_user.username


            file.save(os.path.join(current_app.root_path, 'static',
                                   'uploads', '{}_{}'.format(sender, file_id)))


            recipient_user = User.query.filter_by(username=recipient).first()
            friendship_chat = Friendship.query.filter((Friendship.friend_a_id == current_user.id) & (
                Friendship.friend_b_id == recipient_user.id)).first()
            room = friendship_chat.chatKey


            # Saving to message table
            message = Message(message='', seen=False, created_at=datetime.datetime.now(
            ), senderID=current_user.id, reciverID=recipient_user.id)
            attachment = Attachment(
                attachment_id=file_id, type=file_type, message=message, file_name=file_name)
            db.session.add(message)
            db.session.add(attachment)
            db.session.commit()
            try:
                socketio.emit('attachments', {'file': file.read(), 'type': file_type, 'extension': file_extension,
                                              'title': file_name, 'size': file_size}, room=room, namespace='/api/chat', skip_sid=session['sid'])
            except KeyError:
                return {'status': "KeyError: Couldn't send attachments"}
            return {'status': "succesful"}

        else:
            return {'status': "Error 401: Unauthorized"}
