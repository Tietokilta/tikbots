docker stop summer-body-bot
docker container rm summer-body-bot
docker build -t summer-body-bot .
docker run -d --name summer-body-bot summer-body-bot
