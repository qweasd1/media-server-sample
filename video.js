var firebase = require("firebase-admin");
const {google} = require('googleapis');
const fs = require('fs')
const path = require('path')


const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
  return new Promise((resolve, reject) =>{
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, resolve);
      oAuth2Client.setCredentials(JSON.parse(token));
      resolve(oAuth2Client)
    });
  })

}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const readline = require('readline')
  const SCOPES = ["https://www.googleapis.com/auth/drive"]
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}


let drive


async function listVideoFile(videoFoderId) {
  const files = []
  let nextPageToken = null
  while(true){
    const query = {
      pageSize: 1000,
      q: `'${videoFoderId}' in parents`,
      fields: 'nextPageToken, files(id, name,modifiedTime)'
    }

    if(nextPageToken){
      query["pageToken"] = nextPageToken
    }
    const res = await drive.files.list(query)
    const _files = res.data.files;
    files.push(..._files)
    if (_files.length) {
      nextPageToken = res.data.nextPageToken
    } else {
      nextPageToken = null
    }

    if(!nextPageToken){
      break
    }
  }
  return files

}

async function downloadFile(drive,fileId,outputStream){
  return new Promise(async (resolve,reject)=>{
    outputStream.once("finish",()=>{
      resolve()
    })
    const gres =  await drive.files.get({
      fileId,
      alt: 'media'
    },{responseType: 'stream'})
    const fileSize = gres.headers["content-length"]
    let finished = 0
    let progress = 0
    console.log(`start download ${fileId}`);
    gres.data.on("data",(data)=>{
      finished += data.length
      const currentProgress = (finished / fileSize).toFixed(2)
      if(currentProgress - progress > 0){
        progress = currentProgress
        console.log(`finish ${progress}`);
      }

    })
    gres.data.pipe(outputStream)
  })


}

async function syncVideos(drive, videos){
  const videoRootPath = "/Users/zhendongwang/Documents/projects/playground/video-stream-sample/videos"
  // const videoFiles = fs.readdirSync()
  for(let video of videos){
    const outputStream = fs.createWriteStream(path.join(videoRootPath,video.name))
    await downloadFile(drive, video.id,outputStream)
  }
}

async function main(){
  const credential = JSON.parse(fs.readFileSync('credentials.json'))
  const auth = await authorize(credential)
  drive = google.drive({version: 'v3', auth});
  const folderId = "19sAE_EqX10z0pGZ4lxuWclVvcQTUA9K8"
  const videos = await listVideoFile(folderId)
  console.log(videos);
  await syncVideos(drive,videos)
}

main()




// var admin = require("firebase-admin");
// var serviceAccount = require("/Users/zhendongwang/Documents/projects/playground/video-stream-sample/firebase/serviceAccountKey.json");
//
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://saftie-video.firebaseio.com"
// });
//
//
// var db = admin.database();
//
// var ref = db.ref("videos");
//
// ref.once("value",(data)=>{
//   console.log(data.val());
// })
//
// ref.set({
//   "video1":{
//     "title":"some",
//     "filename":"some"
//   },
//   "video2":{
//     "title":"some",
//     "filename":"some"
//   }
// })


