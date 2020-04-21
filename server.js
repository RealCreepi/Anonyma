var express = require('express')
var sha256 = require('js-sha256')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var path = require('path')
var fs = require('fs')
var port = process.env.PORT || 5000

Sessions = {}

class Session {
  constructor(id, sock) {
    this.id = id
    this.partner = undefined
    this.sock = sock

    Sessions[id] = this
  }

  destroy() {
    delete Sessions[this.id]
  }
} 

var filterHTML = function(string){
    return string.replace(/>/g,"&gt;").replace(/</g,"&lt;").replace("javascript:","javascript˸")
}

app.use('/', express.static( __dirname + "/site" ) )
app.get('/', function(req, res){
    res.sendFile(__dirname + '/site/html/index.html')
})

function generateID(){
    let id = undefined
    id = Math.random() * (9 * 11111)
    id = id.toString().split(".")
    id = id[id.length - 1]
    
    return Sessions[id] == undefined ? id : generateID()
}

function event_Partner(id, partnerID) {
    if (Sessions[partnerID] != undefined) {
        Sessions[id].partner = partnerID
    } else {
        Sessions[id].sock.emit("errorMSG", "The given ID doesn't exist!")
        return
    }

    if (id == partnerID) {
        Sessions[id].sock.emit("errorMSG", "You cannot match with yourself!")
        return
    }

    if (Sessions[partnerID].partner == id) {
        Sessions[partnerID].sock.emit("partnerMatch")
        Sessions[id].sock.emit("partnerMatch")
        Sessions[id].sock.emit("successMSG", "You are now both connected.")
        Sessions[partnerID].sock.emit("successMSG", "You are now both connected.")
	    return
    }
    Sessions[id].sock.emit("successMSG", "An partner request has been sent to the given ID.")
}

function event_Message(id, msg) {
    if (Sessions[id].partner == undefined) {return;}
    if (Sessions[Sessions[id].partner].partner != id) {return;}

    Sessions[Sessions[id].partner].sock.emit("message", "Partner", filterHTML(msg))
    Sessions[id].sock.emit("message", "You", filterHTML(msg))
}

function event_Disconnect(id) {
    if ((Sessions[id].partner != undefined) && (Sessions[Sessions[id].partner] != undefined)) {
        Sessions[Sessions[id].partner].sock.emit("partnerDisconnect")
        Sessions[Sessions[id].partner].sock.emit("errorMSG", "Your Partner disconnected!")
    }

    Sessions[id].destroy()
}

function event_Connect(sock) {
    var id = generateID(); new Session(id, sock)
    
    sock.emit("generatedID", id)
    
    sock.on("disconnect", () => {event_Disconnect(id)})
    sock.on("requestPartner", (partnerID) => {event_Partner(id, partnerID)})
    sock.on("message", (msg) => {event_Message(id, msg)})
}

io.on('connection', event_Connect)

http.listen(port, function(){
    console.log('listening on *:' + port);
})
