FROM node:18-bullseye

RUN npm install -g svg2img @bubblewrap/cli

RUN set -xe \
  && apt update \
  && apt install -y openjdk-17-jre openjdk-17-jdk lib32stdc++6 lib32z1 \
  && rm -rf /var/lib/apt/lists/*

RUN set -xe \
  && mkdir -p /root/.bubblewrap \
  && echo '{ "jdkPath": "/usr/lib/jvm/java-17-openjdk-amd64", "androidSdkPath": "" }' > /root/.bubblewrap/config.json

RUN yes | bubblewrap doctor

WORKDIR /app

ENTRYPOINT ["bubblewrap"]
