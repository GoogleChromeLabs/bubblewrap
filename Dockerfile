FROM node:18-bullseye

RUN npm install -g svg2img @bubblewrap/cli

RUN apt update && apt install -y openjdk-11-jre openjdk-11-jdk lib32stdc++6 lib32z1

RUN mkdir -p /root/.bubblewrap && \
  echo '{ "jdkPath": "/usr/lib/jvm/java-11-openjdk-amd64", "androidSdkPath": "" }' > /root/.bubblewrap/config.json

RUN yes | bubblewrap doctor

WORKDIR /app

ENTRYPOINT ["bubblewrap"]
