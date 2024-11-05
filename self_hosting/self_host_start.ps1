cd ..
docker compose -f docker-compose-dev.yml run --rm web python /dokuly_image/dokuly/manage.py makemigrations
docker compose -f docker-compose-dev.yml run --rm web python /dokuly_image/dokuly/manage.py migrate
docker compose -f docker-compose-dev.yml up