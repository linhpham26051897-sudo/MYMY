const socket = io();

const params = new URLSearchParams(location.search);

const room = params.get("room");
const username = params.get("username");

document.getElementById("roomName").innerHTML = room;

const LIVEKIT_URL =
"https://YOUR_PROJECT.livekit.cloud";

let lkRoom;






let localVideoTrack;
let localAudioTrack;

async function startCall(){

const res = await fetch(
`/token?room=${room}&username=${username}`
);

const data = await res.json();

lkRoom = new LivekitClient.Room();

await lkRoom.connect(
LIVEKIT_URL,
data.token
);

// Xin quyền Camera + Mic

await lkRoom.localParticipant.setCameraEnabled(true);

await lkRoom.localParticipant.setMicrophoneEnabled(true);

// Lấy camera của mình

const stream =
await navigator.mediaDevices.getUserMedia({
video:true,
audio:true
});

document.getElementById("localVideo").srcObject =
stream;

document.getElementById("callStatus").innerHTML =
"🟢 Đã kết nối";

subscribeRemote();

startTimer();

}



startCall();
function subscribeRemote(){

lkRoom.on(
"trackSubscribed",
(track)=>{

if(track.kind==="video"){

const video = track.attach();

video.style.width="100%";
video.style.height="100%";
video.style.objectFit="cover";

document.getElementById("remoteVideo").appendChild(video);

}

if(track.kind==="audio"){

const audio = track.attach();

document.body.appendChild(audio);

audio.play();

}

});

}
let mic=true;

micBtn.onclick=async()=>{

mic=!mic;

await lkRoom.localParticipant.setMicrophoneEnabled(mic);

micBtn.innerHTML=mic?"🎤":"🔇";

};
let camera=true;

cameraBtn.onclick=async()=>{

camera=!camera;

await lkRoom.localParticipant.setCameraEnabled(camera);

cameraBtn.innerHTML=camera?"📹":"🚫";

};

let facing="user";

switchCameraBtn.onclick = async ()=>{

facing =
facing==="user"
? "environment"
: "user";

const stream =
await navigator.mediaDevices.getUserMedia({
video:{
facingMode:facing
},
audio:true
});

document.getElementById("localVideo").srcObject=stream;

};


hangupBtn.onclick=async()=>{

await lkRoom.disconnect();

location.href="chat.html?room="+room+"&username="+username;

};

