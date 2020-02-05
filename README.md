This is a basic sample of how to do video streaming using Node.js and HTML5

# Install

- git clone
- npm install
- download ```credentials.json``` and generate token following this tutorial: https://developers.google.com/drive/api/v3/quickstart/nodejs
- create a ```vidoes``` folder
- change the ```folderId``` in ```video.js``` file to your folder id 
- npm start
- open browser and type `localhost:3000/videos/<video-name>`, you should see the video
- run ```video.js``` file to synchronize the video from google drive folder



# TODO
* setup & run the existing code
* add logic to synchronize video from google drive to firebase (create, update and delete logic)
    * load media from google drive to media server
    * store meta data in firebase see [here](https://firebase.google.com/docs/database/admin/start) if you don't know how to 
    store data to firebase through nodejs
* export firebase cloud functions which can let portal update video meta information (title, description) 
    


