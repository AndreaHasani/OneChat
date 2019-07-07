from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from app.config import Configuration
from flask_login import LoginManager
from flask_restful import Api
from flask_session import Session

import os

application = Flask(__name__)
APP_DIR = os.path.dirname(os.path.realpath(__file__))
application.config.from_object(Configuration)
socketio = SocketIO(application, binary=True, manage_session=False)
db = SQLAlchemy(application)
api = Api(application)
Session(application)

#Login
login_manager = LoginManager()
login_manager.init_app(application)

from app.restful import Attachments, ChatMessages

api.add_resource(Attachments, '/v1/chat/attachments')
api.add_resource(ChatMessages, '/v1/chat/messages')

## Adding Resource

from app.views import *
