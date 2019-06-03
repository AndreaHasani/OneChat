import os
from app.secrets import Secrets


class Configuration:
    SQLALCHEMY_DATABASE_URI = Secrets.SQLALCHEMY_DATABASE_URI
    SQLALCHEMY_TRACK_MODIFICATIONS = True
    SECRET_KEY = os.urandom(24)
    DEBUG = True
