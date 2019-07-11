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


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
