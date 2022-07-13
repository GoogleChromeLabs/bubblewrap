FROM node:18-alpine

RUN npm install -g svg2img @bubblewrap/cli

RUN apk add --update openjdk11-jdk

RUN mkdir -p /root/.bubblewrap && \
  echo '{ "jdkPath": "/usr/lib/jvm/java-11-openjdk", "androidSdkPath": "" }' > /root/.bubblewrap/config.json

RUN yes | bubblewrap doctor

WORKDIR /app

ENTRYPOINT ["bubblewrap"]
