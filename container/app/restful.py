from flask_restful import Resource, reqparse
from app.models import User, Message

chat_args = reqparse.RequestParser()
chat_args.add_argument('user', type=str, help='Getting message from $user')
chat_args.add_argument('receiver', type=str, help='Getting message from $user')

class ChatMessages(Resource):
    def post(self):
        args = chat_args.parse_args()
        user = User.query.filter_by(username=args['user']).first()
        receiver = User.query.filter_by(username=args['receiver']).first()
        db_messages = Message.query.filter((
            (Message.senderID==user.id)&(Message.reciverID==receiver.id))|((Message.senderID==receiver.id)&(Message.reciverID==user.id))).all()

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
            message['text'] = m.message
            messages.append(message)

        return {'messages': messages}


class Attachments(Resource):
    def get(self):
        return {'hello': 'world'}
