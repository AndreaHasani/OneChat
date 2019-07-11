from flask import Flask, render_template, request, session, jsonify, abort, redirect, url_for, send_from_directory
from flask_login import login_required, login_user, logout_user, current_user
from app.models import User, Attachment
from app import application, login_manager, db, socketio
from app.functions import *
import os


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


@application.route("/d", methods=["GET"])
def download():
    if current_user.is_authenticated:
        user = request.args.get('u', None)
        file_id = request.args.get('id', None)
        uploads = os.path.join(application.root_path, application.config['UPLOAD_FOLDER'])
        file = Attachment.query.filter_by(attachment_id=file_id).first()
        return send_from_directory(directory=uploads, filename="%s_%s" % (user, file_id), as_attachment=True, attachment_filename=file.file_name)
    else:
        return redirect(url_for('index'))


@login_manager.user_loader
def load_user(userid):
    return User.query.get(userid)
