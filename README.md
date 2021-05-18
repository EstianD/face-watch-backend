## Description

This is the backend code(API) for the face-watch app. Refer to the [face-watch-frontend](https://github.com/EstianD/facewatch-frontend-repo-2) repo for a better description of the project.

## Functionality
This code contains all the API endpoints for the Face-watch application and uses mongodb to store the necessary data.<br/>
User Authentication.<br/>
File uploads(S3).<br/>
API endpoints to create indexes on S3 for facial data.<br/>
Serverless lambda functions that handles the facial rekognition.<br/> 

## .env File Config

For this API to work a few things is needed. An AWS ID aswell as an AWS SECRET key is required. The API makes use of AWS S3, AWS LAMBDA, AWS Gateway API and AWS REKOGNITION. When creating a IAM user on AWS, that user needs to have permissions configured to access all of these services.

A .env file needs to be added with the following variables.

MONGODB_URI=<br/>
JWT_SECRET=<br/>
PORT=<br/>
AWS_ID=<br/>
AWS_SECRET=

## Installation

clone repo<br/>
### Insall dependencies
npm i 
### Configure .env file
(Refer to the section above.)

## Scripts

In the project directory:

### `npm run dev`

Runs the app in the development mode.<br />
Open [http://localhost:{PORT}](http://localhost:{PORT}) to view it in the browser.

### `npm run start`

Runs the problem in production mode.
