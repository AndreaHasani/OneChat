from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand
from app import application, db
from app.models import *


migrate = Migrate(application, db, compare_type=True)
manager = Manager(application)


manager.add_command('db', MigrateCommand)



if __name__ == "__main__":
    manager.run()
