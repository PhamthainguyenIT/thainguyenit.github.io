//init socket connect
const socket = io('https://simplevd-devnguyen.herokuapp.com');
var localId;
var name;
let customConfig;
var isvideo = true;
var content = document.querySelector('#content');
var isvideo = false;

$("#divChat").hide();
$("#divVideo").hide();
$("#divMessage").hide();


$.ajax({
    url: "https://service.xirsys.com/ice",
    data: {
      ident: "thainguyen",
      secret: "2ab04b80-b5c1-11ea-b5ca-0242ac150003",
      domain: "phamthainguyenit.github.io",
      application: "default",
      room: "default",
      secure: 1
    },
    success: function (data, status) {
      // data.d is where the iceServers object lives
      customConfig = data.d;
      console.log(customConfig);
    },
    async: false
  });

// ******************************* socket START ******************************* //
// when server reponse update new user , handle here
socket.on("LIST_ONLINE", arrUserList => {
    $("#divChat").show();
    $("#divSubmit").hide();
    // update all list.
    arrUserList.forEach(user => {
        const { name, peerId } = user;
        if(localId === peerId){
            $("#ulUser").append(`<li id="${peerId}" class="li-style">${name}</li>`);
        }else{
            $("#ulUser").append(`<li id="${peerId}" class="li-style">${name}<button class="li-button" onclick="callAudio()">audio</button><button class="li-button" onclick="callVideo()">videoCall</button></li>`);
        }
 });
    // update new user.
    socket.on("UPDATE_NEW_USER", user => {
        const { name, peerId } = user;
            $("#ulUser").append(`<li id="${peerId}" class="li-style">${name}<button class="li-button" onclick="callAudio()">audio</button><button class="li-button" onclick="callVideo()">videoCall</button></li>`);
    });
});

// check name duplicate
socket.on("SUBMIT_FAIL",() => {
    alert("Error : duplicate name");
});

// remove offline user
socket.on("SOMEONE_LEAVE", peerId => {
    $(`#${peerId}`).remove();
});

/******for chat only ********/


// update new message.
socket.on("NEW_USER_JOIN", user => {
    let time = new Date().toLocaleString();
    const { name } = user;
    $("#messageLog").append(`<li> <label  style"width: 300px;" >${time}</label > User <wb class="name-message">${name}</wb>Online </li> `);
});

// update new message.
socket.on("NEW_MESSAGE", user => {
    let time = new Date().toLocaleString();
    const { name, message } = user;
    $("#messageLog").append(`<li> <label  class="name-message">${name}</label ><label  class="time-message">${time}</label ><br><wb class="message">${message}</wb></li> `);
    content.scrollTop = content.scrollHeight ;
});



/******for chat only ********/


// ******************************* socket END******************************* //

// ******************************* peerjs START ******************************* //

//init peer connect
const peer = new Peer({
    key: "peerjs", 
    host: "mypeer2206.herokuapp.com", 
    secure: true, 
    port: 443, 
    config: customConfig});
console.log("using sturn server");

// //init peer connect
// const peer = new Peer({key: "peerjs", host: "mypeer2206.herokuapp.com", secure: true, port: 443});
// console.log("using normal server");

// //init peer connect
// const peer = new Peer();
// console.log("using local peer");

peer.on("open", id => {
    $("#peerid").append(id)
    localId = id;
    //Submit Name
    $("#btnSubmit").click(()=> {
        const userName = $("#txtUserName").val();
        name = userName;
        if(userName == null || userName == ""){
            alert("Please input your name");
            return false;
        }
        socket.emit("CLIEN_SUBMIT",{name: userName, peerId: id });
    });
});

//caller
$("#btncall").click(()=> {
    const id = $("#remoteId").val();
    openStream(isvideo)
    .then(stream => {
        playStream("localStream",stream);
        const call = peer.call(id,stream);
        call.on("stream", remoteStream => playStream("remoteStream",remoteStream));
    });
});

//listener
peer.on("call", call => {
    $("#divVideo").show();
    openStream(isvideo)
    .then(stream =>{
        call.answer(stream);
        playStream("localStream",stream);
        call.on("stream", remoteStream => playStream("remoteStream",remoteStream));
    })
})

// ******************************* peerjs END ******************************* //

function openStream(isvideo) {
    const config = { audio: true, video: isvideo };
    return navigator.mediaDevices.getUserMedia(config);
}

function playStream(idVideoTag, stream){
    const video =  document.getElementById(idVideoTag);
    video.srcObject = stream;
    video.play();
}

$("#ulUser").on("click", `li`, function (){
    const name =  this.innerHTML;
    let time = new Date().toLocaleString();
    $("#messageLog").append(`<li> <label  style"width: 300px;" >${time}</label > you calling:  <wb class="name-message">${name}</wb> </li> `);
    const id =  $(this).attr('id');
    if(localId===id){
        return false;
    }
    $("#divVideo").show();
    document.getElementById("CallingTo").innerHTML = "you calling: " + name
    openStream(isvideo)
    .then(stream => {
        playStream("localStream",stream);
        const call = peer.call(id,stream);
        call.on("stream", remoteStream => playStream("remoteStream",remoteStream));
    });
    
})

//add event press key enter for btn submit name
var inputName = document.getElementById("txtUserName");
inputName.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
   event.preventDefault();
   document.getElementById("btnSubmit").click();
  }
});

//add event press key enter for btn submit name
var inputMessage = document.getElementById("txtMesssage");
inputMessage.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
   event.preventDefault();
   document.getElementById("btnSend").click();
  }
});

/***********switchScreen START************/
function callAudio() {
    isvideo = false;
    $("#messageLog").append(`<li> <label  style"width: 300px;" >isvideo : ${isvideo} `);
}

function callVideo() {
    isvideo = true;
    $("#messageLog").append(`<li> <label  style"width: 300px;" >isvideo : ${isvideo} `);
}

$("#btnSend").click(()=> {
    const message = $("#txtMesssage").val();
    document.getElementById("txtMesssage").value = "";
    if(message == null || message == ""){
        return false;
    }
    socket.emit("CLIEN_SEND_MESSAGE",{name: name, peerId: localId, message: message});
});
/***********switchScreen END************/



