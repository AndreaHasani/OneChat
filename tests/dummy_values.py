from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Date, Text, Boolean, sql, Table, UniqueConstraint, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.associationproxy import association_proxy
import hashlib
import datetime

Base = declarative_base()


def genRandomKey(friend_a, friend_b):
    string = str(friend_a) + str(friend_b) + str(datetime.datetime.now())
    return hashlib.md5(string.encode('utf-8')).hexdigest()



class User(Base):
    __tablename__ = "users"

    id = Column('id', Integer(), primary_key=True, nullable=False)
    username = Column('username', String(128), nullable=False)
    password = Column('password', String(128), nullable=False)
    messages = relationship('Message', backref='user', primaryjoin="or_(User.id==Message.senderID, User.id ==Message.reciverID)")

    friendships = relationship('Friendship',
                               primaryjoin=lambda: User.id == Friendship.friend_a_id,
                               back_populates='friend_a')

    user_info = relationship('User_Info', backref='user', uselist=False)

    friends = association_proxy('friendships', 'friend_b',
                                creator=lambda friend: Friendship(friend_b=friend))

    user_info = relationship('User_Info', backref='user', uselist=False)

    # def befriend(self, friend):
    #     if friend not in self.friends:
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




class Friendship(Base):
    __tablename__ = "friendships"

    id = Column('id', Integer(), primary_key=True, nullable=False)
    chatKey = Column('key', String(128), nullable=False)
    friend_a_id = Column(ForeignKey('users.id'))
    friend_a = relationship('User',
                            primaryjoin=friend_a_id == User.id,
                            back_populates='friendships')

    friend_b_id = Column(ForeignKey('users.id'))
    friend_b = relationship('User',
                            primaryjoin=friend_b_id == User.id)


class Message(Base):
    __tablename__ = "message"

    id = Column('id', Integer(), primary_key=True, nullable=False)
    senderID = Column(Integer(), ForeignKey('users.id'))
    reciverID = Column(Integer(), ForeignKey('users.id'))
    message = Column('message', Text(), nullable=False)
    seen = Column('seen', Boolean(), nullable=False, default=0)
    created_at = Column('created_at', DateTime(), nullable=False)
    attachment = relationship('Attachment', backref='message')


class Attachment(Base):
    __tablename__ = "attachment"

    id = Column('id', Integer(), primary_key=True, nullable=False)
    attachment_id = Column(String(64), nullable=False)
    type = Column(String(64), nullable=False)
    messageID = Column(Integer(), ForeignKey("message.id"))
    file_name = Column(String(128), nullable=False)

class User_Info(Base):
    __tablename__ = "user_info"

    id = Column('id', Integer(), primary_key=True, nullable=False)
    userID = Column(Integer(), ForeignKey('users.id'))
    display_name = Column('display_name', String(128), nullable=True)
    last_seen = Column('last_seen', DateTime(), nullable=True)
    status = Column('status', String(128), nullable=True)
    gender = Column('gender', String(128), nullable=True)
    created_at = Column('created_at', DateTime(), nullable=True)

## Test

# class Friendship(Base):
#     __tablename__ = 'friendships'

#     id = Column('id', Integer, primary_key=True)
#     user_id = Column('user_id', Integer, ForeignKey('users.id'), index=True)
#     friend_id = Column('friend_id', Integer, ForeignKey('users.id'))
#     key = Column('key', String(128), default=genRandomKey)
#     UniqueConstraint('user_id', 'friend_id', name='unique_friendships')

# class User(Base):
#     __tablename__ = 'users'

#     id = Column('id', Integer(), primary_key=True, nullable=False)
#     username = Column('username', String(128), nullable=False)
#     password = Column('password', String(128), nullable=False)
#     # messages = relationship('Message', backref='user')

#     friends = relationship('User',
#                            secondary=Friendship.__table__,
#                            primaryjoin=id==Friendship.user_id,
#                            secondaryjoin=id==Friendship.friend_id)

#     def befriend(self, friend):
#         if friend not in self.friends:
#             self.friends.append(friend)
#             friend.friends.append(self)

#     def unfriend(self, friend):
#         if friend in self.friends:
#             self.friends.remove(friend)
#             friend.friends.remove(self)



# class Message(Base):
#     __tablename__ = "message"

#     id = Column('id', Integer(), primary_key=True,
#                 nullable=False, autoincrement=True)
#     roomID = Column(Integer(), ForeignKey('room.id'))
#     userID = Column(Integer(), ForeignKey('user.id'))
#     message = Column('message', Text(), nullable=False)
#     seen = Column('seen', Boolean(), nullable=False, default=0)
#     created_at = Column('created_at', Date(), nullable=False)


engine = create_engine('mysql://root:toor@0.0.0.0:3318/wemeet', echo=True)
Session = sessionmaker(bind=engine)
session = Session()

Base.metadata.create_all(bind=engine)
session.commit()
def creatingData():
    # Create tables

    # Create User
    demo = User(username="demo", password="demo")
    user = User(username="user", password="user")
    bliss = User(username="bliss", password="bliss")
    session.add(demo)
    session.add(user)
    session.add(bliss)

    # ## Adding asc
    demo.befriend(user)
    demo.befriend(bliss)
    bliss.befriend(user)
    bliss.befriend(demo)
    # demo.befriend(biss)
    # friendship = Friendship(chatkey="asdwadawd", friend_a=demo, friend_b=user)
    # friendship = Friendship(chatkey="asdwadawd", friend_a=demo, friend_b=biss)
    # session.add(friendship)
    session.commit()

def readingData():
    user = session.query(User).filter_by(username="bliss").first()
    return user


creatingData()
# data = readingData()
# for u in data.friendships:
#     print(u.chatKey)
