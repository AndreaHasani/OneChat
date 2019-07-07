from app import application, db
from flask_login import UserMixin
from sqlalchemy.ext.associationproxy import association_proxy
import hashlib
import datetime


def genRandomKey(friend_a, friend_b):
    string = str(friend_a) + str(friend_b) + str(datetime.datetime.now())
    return hashlib.md5(string.encode('utf-8')).hexdigest()


class User(db.Model, UserMixin):
    __tablename__ = "users"

    id = db.Column('id', db.Integer(), primary_key=True, nullable=False)
    username = db.Column('username', db.String(128), nullable=False)
    password = db.Column('password', db.String(128), nullable=False)
    messages = db.relationship('Message', primaryjoin="or_(User.id==Message.senderID, User.id ==Message.reciverID)")

    friendships = db.relationship('Friendship',
                                  primaryjoin=lambda: User.id == Friendship.friend_a_id,
                                  back_populates='friend_a')
    friends = association_proxy('friendships', 'friend_b',
                                creator=lambda friend: Friendship(friend_b=friend))

    user_info = db.relationship('User_Info', backref='user', uselist=False)

    key = association_proxy('friendships', 'chatKey',
                                creator=lambda friend: Friendship(friend_b=friend))

    # def befriend(self, friend):
    #     if friend not in self.friends:
    #         # key = genRandomKey(friend.id, self.id)
    #         self.friends.append(friend_b=friend)
    #         friend.friends.append(friend_b=self)

    # Without association proxy
    def befriend(self, friend):
        key = genRandomKey(friend.id, self.id)
        if friend not in [friendship.friend_b
                          for friendship in self.friendships]:
            self.friendships.append(Friendship(friend_a=self, friend_b=friend, chatKey=key))
            friend.friendships.append(Friendship(friend_a=friend,
                                                 friend_b=self, chatKey=key))

    def unfriend(self, friend):
        if friend in self.friends:
            self.friends.remove(friend)
            friend.friends.remove(self)


    def __init__(self, **args):
        super().__init__(**args)
        User_Info(user=self)


class Friendship(db.Model):
    __tablename__ = "friendships"

    id = db.Column('id', db.Integer(), primary_key=True, nullable=False)
    chatKey = db.Column('key', db.String(128), nullable=False)
    friend_a_id = db.Column(db.ForeignKey('users.id'))
    friend_a = db.relationship('User',
                               primaryjoin=friend_a_id == User.id,
                               back_populates='friendships')

    friend_b_id = db.Column(db.ForeignKey('users.id'))
    friend_b = db.relationship('User',
                               primaryjoin=friend_b_id == User.id)

    def __init__(self, friend_a=None, friend_b=None, **kwargs):
        super().__init__(**kwargs)
        if friend_a:
            self.friend_a = friend_a
        if friend_b:
            self.friend_b = friend_b


class Message(db.Model):
    __tablename__ = "message"

    id = db.Column('id', db.Integer(), primary_key=True, nullable=False)
    senderID = db.Column(db.Integer(), db.ForeignKey('users.id'), nullable=False)
    reciverID = db.Column(db.Integer(), db.ForeignKey('users.id'), nullable=False)
    message = db.Column('message', db.Text(), nullable=False)
    seen = db.Column('seen', db.Boolean(), nullable=False, default=0)
    created_at = db.Column('created_at', db.Date(), nullable=False)
    attachment = db.relationship('Attachment', backref='message')

class Attachment(db.Model):
    __tablename__ = "attachment"

    id = db.Column('id', db.Integer(), primary_key=True, nullable=False)
    attachment_id = db.Column(db.String(64), nullable=False)
    type = db.Column(db.String(64), nullable=False)
    messageID = db.Column(db.Integer(), db.ForeignKey("message.id"), nullable=False)
    file_name = db.Column(db.String(128), nullable=False)




class User_Info(db.Model):
    __tablename__ = "user_info"

    id = db.Column('id', db.Integer(), primary_key=True, nullable=False)
    userID = db.Column(db.Integer(), db.ForeignKey('users.id'))
    status = db.Column('status', db.String(128), nullable=True)
    display_name = db.Column('display_name', db.String(128), nullable=True)
    last_seen = db.Column('last_seen', db.DateTime(), nullable=True)
    gender = db.Column('gender', db.String(128), nullable=True)
    created_at = db.Column('created_at', db.DateTime(), nullable=True)
