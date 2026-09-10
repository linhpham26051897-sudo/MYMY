const socket = io();

const params = new URLSearchParams(location.search);

const room = params.get("room");
const username = params.get("username");

document.getElementById("roomName").innerHTML = room;

// URL LiveKit Cloud của bạn
const LIVEKIT_URL = "wss://mymy-h3gfjpvp.livekit.cloud";

let lkRoom;
let localTrack;
let micEnabled = true;

// ================= BẮT ĐẦU CUỘC GỌI =================

async function startCall() {

    document.getElementById("callStatus").innerHTML = "📡 Đang kết nối...";

    // Lấy token từ server
    const res = await fetch(
        `/token?room=${room}&username=${username}`
    );

    const data = await res.json();

    // Tạo Room LiveKit
    lkRoom = new LivekitClient.Room();

    // Kết nối
    await lkRoom.connect(LIVEKIT_URL, data.token);
    lkRoom.on("trackSubscribed", (track) => {

    if (track.kind === "audio") {

        const audio = track.attach();

        document.body.appendChild(audio);

        audio.play();

    }

});

    // Xin quyền Microphone
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
    });

    localTrack = stream.getAudioTracks()[0];

    // Publish microphone
    await lkRoom.localParticipant.setMicrophoneEnabled(true);

    document.getElementById("callStatus").innerHTML =
        "🟢 Đã kết nối";

    startTimer();

}

// ================= ĐỒNG HỒ =================

let second = 0;

function startTimer(){

    setInterval(()=>{

        second++;

        const m =
            String(Math.floor(second/60)).padStart(2,"0");

        const s =
            String(second%60).padStart(2,"0");

        document.getElementById("timer").innerHTML =
            `${m}:${s}`;

    },1000);

}

// ================= MIC =================

let micOn = true;

document.getElementById("micBtn").onclick = async () => {

    micOn = !micOn;

    await lkRoom.localParticipant.setMicrophoneEnabled(micOn);

    document.getElementById("micBtn").innerHTML =
        micOn ? "🎤" : "🔇";

};

// ================= LOA =================

let speaker = true;

document.getElementById("speakerBtn").onclick = ()=>{

    speaker = !speaker;

    document.getElementById("speakerBtn").style.opacity =
        speaker ? "1" : ".5";

};

// ================= CAMERA (ĐỂ SAU) =================

document.getElementById("cameraBtn").onclick = ()=>{

    alert("🎥 Video sẽ làm ở Bài 8.");

};

// ================= CÚP MÁY =================

document.getElementById("hangupBtn").onclick = async ()=>{

    if(lkRoom){
        await lkRoom.disconnect();
    }

    location.href = "index.html";

};

// ================= QUAY LẠI =================

document.getElementById("backBtn").onclick = ()=>{

    location.href =
        `chat.html?room=${encodeURIComponent(room)}&username=${username}`;

};

startCall();