#Each instruction in this file creates a new layer
#Here we are getting our node as Base image
FROM node:latest
#Creating a new directory for app files and setting path in the container
RUN mkdir -p /usr/src/app
#setting working directory in the container
WORKDIR /usr/src/app
#copying the package.json file(contains dependencies) from project source dir to container dir
COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app
# installing the dependencies into the container
RUN yarn
#copying the source code of Application into the container dir
COPY . /usr/src/app
#container exposed network port number
EXPOSE 7500
RUN yarn build
#command to run within the container
CMD ["yarn", "start"]