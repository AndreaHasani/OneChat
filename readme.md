# OneChat

OneChat is a flask socketio chat platform.

## Installation

This app uses docker for deployment. You will need to have docker and docker-compose installed to use it.

## Usage

First you will need to build the containers by running the following command.
```bash
docker-compose up
```

Then you will need to connect to mysql database container on port 3318 and create oneChat database.
After doing this you will need to run tests/dummy_values.py. This script will populate the database with dummy values for demo usage.
```bash
python ./tests/dummy_values.py
```

Now your good to go  
You can see the app on `localhost:3031`


## IMPORTANT

In app folder config.py depends on a file called secrets which contains confidential variables.  
Here is an example of what it may contain.

```python
class Secrets:
    SQLALCHEMY_DATABASE_URI = 'mysql://username:password@database/oneChat'
```


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
