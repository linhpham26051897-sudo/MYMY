// ======================================================
// MYMY CALL.JS V5 - LIVEKIT
// ======================================================

import {
    Room,
    RoomEvent,
    createLocalVideoTrack
} from "https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.esm.mjs";

const params = new URLSearchParams(window.location.search);

const roomName = params.get("room");
const username = params.get("username");
const callType = params.get("type") || "video";

if (!roomName || !username) {
    location.href = "index.html";
}

// ================= HTML =================

const roomTitle = document.getElementById("roomTitle");
const callStatus = document.getElementById("callStatus");
const waitingText = document.getElementById("waitingText");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const micBtn = document.getElementById("micBtn");
const cameraBtn = document.getElementById("cameraBtn");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const speakerBtn = document.getElementById("speakerBtn");
const hangupBtn = document.getElementById("hangupBtn");
const backBtn = document.getElementById("backBtn");

const timer = document.getElementById("callTimer");

roomTitle.textContent = roomName;

// ================= LIVEKIT =================

const room = new Room();

let micEnabled = true;
let cameraEnabled = callType === "video";
let seconds = 0;
let interval;

// ================= TIMER =================

function startTimer() {

    clearInterval(interval);

    interval = setInterval(() => {

        seconds++;

        const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
        const ss = String(seconds % 60).padStart(2, "0");

        timer.textContent = `${mm}:${ss}`;

    }, 1000);

}

// ================= CONNECT =================

async function connectRoom() {

    callStatus.textContent = "📞 Đang kết nối...";

    const res = await fetch(
        `/livekit-token?room=${roomName}&username=${username}`
    );

    const { token, url } = await res.json();

    await room.connect(url, token);

    callStatus.textContent = "🟢 Đã kết nối";
    waitingText.style.display = "none";

    startTimer();

    // Micro
    await room.localParticipant.setMicrophoneEnabled(true);

    // Camera
    if (callType === "video") {

        await room.localParticipant.setCameraEnabled(true);

        const videoTrack = await createLocalVideoTrack();

        videoTrack.attach(localVideo);

    } else {

        localVideo.style.display = "none";
        cameraBtn.style.display = "none";
        switchCameraBtn.style.display = "none";

    }

}

connectRoom();

// ================= NHẬN VIDEO NGƯỜI KHÁC =================

room.on(RoomEvent.TrackSubscribed, (track) => {

    if (track.kind === "video") {

        track.attach(remoteVideo);

        remoteVideo.style.display = "block";

    }

    if (track.kind === "audio") {

        track.attach();

    }

});

// ================= NGƯỜI THAM GIA =================

room.on(RoomEvent.ParticipantConnected, (participant) => {

    callStatus.textContent =
        `🟢 Đang gọi với ${participant.identity}`;

});

room.on(RoomEvent.ParticipantDisconnected, () => {

    callStatus.textContent = "📴 Người kia đã rời cuộc gọi.";

    waitingText.style.display = "flex";

});

// ================= MIC =================

micBtn.onclick = async () => {

    micEnabled = !micEnabled;

    await room.localParticipant.setMicrophoneEnabled(micEnabled);

    micBtn.textContent = micEnabled ? "🎤" : "🔇";

};

// ================= CAMERA =================

cameraBtn.onclick = async () => {

    cameraEnabled = !cameraEnabled;

    await room.localParticipant.setCameraEnabled(cameraEnabled);

    cameraBtn.textContent = cameraEnabled ? "📹" : "🚫";

};

// ================= LOA =================

speakerBtn.onclick = () => {

    remoteVideo.muted = !remoteVideo.muted;

    speakerBtn.textContent =
        remoteVideo.muted ? "🔈" : "🔊";

};

// ================= ĐỔI CAMERA =================

switchCameraBtn.onclick = async () => {

    try {

        await room.localParticipant.setCameraEnabled(false);
        await room.localParticipant.setCameraEnabled(true);

    } catch (err) {

        console.error(err);

    }

};

// ================= CÚP MÁY =================

async function leaveCall() {

    clearInterval(interval);

    await room.disconnect();

    location.href =
        `chat.html?room=${roomName}&username=${username}`;

}

hangupBtn.onclick = leaveCall;
backBtn.onclick = leaveCall;

// ================= THOÁT TAB =================

window.addEventListener("beforeunload", async () => {

    await room.disconnect();

});