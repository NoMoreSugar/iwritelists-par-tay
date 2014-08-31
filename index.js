var fs=require("fs");

function broadcast(m,b){
  var rm=JSON.parse(fs.readFileSync("./plugincfg/par-tay.json"));
  rm.forEach(function(v,k){
    b.sendMessage(v, m);
  });
}

var room = {};
room.get = function(){
  return JSON.parse(fs.readFileSync("./plugincfg/par-tay.json"));
}
room.isIn = function(id){
  if(room.get().indexOf(id) < 0) return false;
  else return true;
}
room.commit = function(rm){
  return fs.writeFileSync("./plugincfg/par-tay.json", JSON.stringify(rm));
}
room.remove = function(id){
  if(! room.isIn(id)) return false;
  var rm=room.get();
  rm.splice(rm.indexOf(id), 1);
  return room.commit(rm);
}
room.add = function(id){
  if( room.isIn(id) ) return false;
  var rm=room.get();
  rm.push(id);
  return room.commit(rm);
}

room.bans = {};

room.bans.get = function(){
  return JSON.parse(fs.readFileSync("./plugincfg/par-tay-bans.json"));
}

room.bans.is = function(id){
  if( room.bans.get().indexOf(id) < 0 ) return false;
  else return true;
}

room.bans.commit = function(bans){
  return fs.writeFileSync("./plugincfg/par-tay-bans.json", JSON.stringify(bans));
}

room.bans.ban = function(id){
  if( room.bans.is(id) ) return false;
  var bans = room.bans.get();
  bans.push(id);
  room.bans.commit(bans);
}

room.bans.unban = function(id){
  if( ! room.bans.is(id) ) return false;
  var bans = room.bans.get();
  bans.splice(bans.indexOf(id), 1);
  room.bans.commit(bans);
}

function init(t){
  var eh=t.eventHandler;
  var P=t.P;
  var L=t.L;

  L.info("Initializing Par-tay!");
  L.debug("-Ensuring files and directories exist");

  if( ! fs.existsSync("./plugincfg/par-tay.json") ){
    L.debug("--Creating ./plugincfg/par-tay.json");
    fs.writeFileSync("./plugincfg/par-tay.json", JSON.stringify([]));
  }

  if( ! fs.existsSync("./plugincfg/par-tay-bans.json") ){
    L.debug("--Creating ./plugincfg/par-tay-bans.json");
    fs.writeFileSync("./plugincfg/par-tay-bans.json", JSON.stringify([]));
  }

  L.debug("-Initializing bindings");

  L.debug("--Registering cmd par-tay");
  eh.registerCommand("par-tay", function(msg){
    msg.reply("\nPar-tay!\nGroup chatting for IWriteLists by tdlive aw'sum.\n\nTo join the par-tay, type pj.\nTo say something, type ps (or !) and then your message.\nTo leave, type pl.\nTo see who's in the room currently, type pls.\nAdmins can use the pk command to kick people from the room, or the pb command to ban someone.");
  });

  L.debug("--Registering cmd pj");
  eh.registerCommand("pj", function(msg){
    if( room.isIn(msg.fromID) ){
      msg.reply("You're already in the par-tay!");
      return;
    }

    if( room.bans.is(msg.fromID) ){
      msg.reply("You've been banned from the par-tay! :'(");
      return;
    }

    broadcast("[ -=- " + msg.fromPlayerName + " joined -=- ]", msg.twimod.bot);
    console.log(msg.fromID);
    room.add(msg.fromID);
    msg.reply("Joined the room.");
  });

  L.debug("--Registering cmd ps");
  var ps = function(msg){
    if( room.isIn(msg.fromID) ){
      if( msg.args.length < 1 ){
        msg.reply("Please specify something to say.");
      }
      else {
        broadcast("<" + msg.fromPlayerName + "> " + (msg.args.join(" ")), msg.twimod.bot);
      }
    }
    else {
      msg.reply("You're not in the channel! Join the channel using pj to join in on the par-tay!");
    }
  };

  eh.registerCommand("ps", ps);
  eh.registerCommand("!", ps);

  L.debug("--Registering cmd pk");
  eh.registerCommand("pk", function(msg){
    if( ! room.isIn(msg.fromID) || ! msg.twimod.P.is(msg.fromID, "moderator") ){
      msg.reply("You have to be an admin in the room in order to kick people from it.");
      return;
    }
    else if( ! room.isIn(msg.args[0]) ){
      msg.reply("That isn't a communityid or that person isn't in the room.");
      return;
    }
    room.remove(msg.args[0]);
    broadcast("[ -=- " + msg.twimod.bot.users[msg.args[0]].playerName + " was kicked -=- ]", msg.twimod.bot);
    msg.reply("Kicked!");
    msg.twimod.bot.sendMessage(msg.args[0], "You've been kicked from the par-tay!");
  });

  L.debug("--Registering cmd pls");
  eh.registerCommand("pls", function(msg){
    var rm=room.get();
    var mmsg="In the par-tay:\n";
    rm.forEach(function(v){
      mmsg+=msg.twimod.bot.users[v].playerName + " (" + v + ")";
      if( msg.twimod.P.is(v, "moderator") ){
        mmsg+="*";
      }
      mmsg+="\n";
    });

    mmsg+="\n* = moderator";
    msg.reply(mmsg);
  });

  L.debug("--Registering cmd pl");
  eh.registerCommand("pl", function(msg){
    if( ! room.isIn(msg.fromID) ){
      msg.reply("You aren't in the par-tay so you can't leave it!");
      return;
    }
    room.remove(msg.fromID);
    broadcast("[ -=- " + msg.fromPlayerName + " left -=- ]", msg.twimod.bot);
    msg.reply("Left!");
  });

  L.debug("--Registering cmd pb");
  eh.registerCommand("pb", function(msg){
    if( ! room.isIn(msg.args[0]) || ! msg.twimod.P.is(msg.fromID, "moderator")){
      msg.reply("You can't do that because a) the target isn't in the room, b) the target doesn't exist, or c) you aren't an admin.");
      return;
    }
    room.remove(msg.args[0]);
    room.bans.ban(msg.args[0]);
    broadcast("[ -=- " + msg.twimod.bot.users[msg.args[0]].playerName + " was banned -=- ]", msg.twimod.bot);
    msg.reply("You have been banned from the par-tay :'(");
  });

  L.debug("--Registering cmd plb");
  eh.registerCommand("plb", function(msg){
    if( ! msg.twimod.P.is(msg.fromID, "moderator") ){
      msg.reply("You must be a moderator to view the ban list.");
      return;
    }
    var back = "Banned users:\n";
    room.bans.get().forEach(function(v){
      var name = bot.users[v].playerName || "Unknown";
      back += name + " ( " + v + ")\n";
    });
    msg.reply(back);
  });

  L.debug("--Registerting cmd pub");
  eh.registerCommand("pub", function(msg){
    if( ! msg.twimod.P.is(msg.fromID, "moderator") ){
      msg.reply("You must be a moderator to unban someone.");
      return;
    }
    if( ! room.bans.is(msg.args[0]) ){
      msg.reply("You can't unban this person because a) they weren't banned in the first place or b) they don't exist.");
      return;
    }
    room.bans.unban(msg.args[0]);
    msg.reply("Unbanned!");
    msg.twimod.bot.sendMessage(msg.args[0], "You've been unbanned from the par-tay!");
  });

  L.info("Par-tay initialized!");
}

module.exports=init;
