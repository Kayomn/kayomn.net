
FROM php:8.0
COPY . /usr/src/kayomn.net
WORKDIR /usr/src/kayomn.net
CMD ["php", "./index.html"]
