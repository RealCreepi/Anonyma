function initSock(){ 
    return new Promise((resolve, reject) => {
        sock = io.connect(`http://${document.domain}:${location.port}`)
        .on('connect', () => {
            if (sock.disconnected) 
                reject("Couldn't connect to the server")
        })
        resolve(sock)
    })
}

var sock 
initSock().then((result) => {sock = result})

function requestPartner(id) {
    sock.emit("requestPartner", id)
}

function sendMessage(input) {
    sock.emit("message", $(input).val());
    $(input).val('')
}

sock.on("generatedID", (id) => {
    $(".id").text(id)
})

sock.on("errorMSG", (msg) => {
    console.log("error -> " + msg)
    $("#status").css("color", "red")
    $("#status").text(msg)
})

sock.on("successMSG", (msg) => {
    console.log("success -> " + msg)
    $("#status").css("color", "green")
    $("#status").text(msg)
})

sock.on("partnerMatch", () => {
    $(".find_partner").css("display","none")
    $(".chat").css("display","block")
})

sock.on("partnerDisconnect", () => {
    $(".find_partner").css("display","block")
    $(".chat").css("display","none")
    $("#messages").html('')
})

sock.on("message", (person, msg) => {
    console.log(person + " -> " + msg)
    $("#messages").html(
        $("#messages").html() + 
        `<div class="message"><b>${person}</b></br><a class="message_content">${msg}</a></br></div>`
    )
})