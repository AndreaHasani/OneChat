from flask import Flask, render_template, request, session, jsonify, abort
from app.models import *
from app import application
from app.functions import *


@application.route("/", methods=["GET"])
def index():
    ## Only for demo
    return render_template("index.html", user="olia")


@application.route("/rxtx", methods=["GET"])
def rxt_user():
    return render_template("index.html", user="rxtx")
