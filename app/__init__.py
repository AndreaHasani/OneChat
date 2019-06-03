from flask import Flask, render_template, request
from flask_socketio import SocketIO

import os

application = Flask(__name__)
APP_DIR = os.path.dirname(os.path.realpath(__file__))
application.config.from_pyfile('config.py')
socketio = SocketIO(application)

from app.views import *
