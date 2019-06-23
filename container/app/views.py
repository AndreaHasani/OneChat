from flask import Flask, render_template, request, session, jsonify, abort, redirect, url_for
from flask_login import login_required, login_user, logout_user, current_user
from app.models import User
from app import application, login_manager, db, socketio
from app.functions import *


@application.route("/", methods=["GET", "POST"])
def index():
    if current_user.is_authenticated:
        return render_template("index.html", user=current_user.username, friends=current_user.friends, user_status=session.get('users', None))
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        user = db.session.query(User).filter_by(username=username).first()
        try:
            if password == user.password:
                login_user(user)
                session[current_user.username] = {"status": "online"}
                return redirect(url_for('index'))
            else:
                abort(401)
        except Exception as e:
            abort(500)
            raise

    else:
        return render_template("login.html")


@application.route("/upload", methods=["POST"])
def upload():
    if current_user.is_authenticated:
        file = request.files['file'].read()
        recipient = request.form['recipient']
        recipient_user = db.session.query(User).filter_by(username=recipient).first()
        room = recipient_user.key[0]
        socketio.emit('attachments', { 'file': file, 'size': request.form['file_size'],
                                      'type': request.form['file_type'], 'name': request.form['file_name']}, room=room, namespace='/api/chat')
        return jsonify(status="success")
    else:
        return redirect(url_for('index'))


@login_manager.user_loader
def load_user(userid):
    return User.query.get(userid)
