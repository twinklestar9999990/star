var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
var fs = require("fs");
var file = "db.db";
var exists = fs.existsSync(file);
if (!exists) {
    fs.openSync(file, "w");
}
var sqlite3 = require('sqlite3').verbose();
//var db = new sqlite3.Database(':memory:');
//var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);
var ServerManager = 0;
var mynumber = 0.5;
function TABLES() {
    console.log("TABLE");
    db.run("PRAGMA journal_mode=memory;");
    db.run("drop table if exists obj;");
    db.run("drop table if exists rul;");
    db.run("create table if not exists obj(ose text,ona text,oax text,oay text,oaz text,ocr text,ocg text,ocb text,ops text,opn text,constraint obj_fk_ops foreign key(ops,opn) references obj(ose,ona),constraint obj_pk primary key(ose, ona));")
    db.run("create table if not exists rul(rsn text,rsx text,rsy text,rsz text,ron text,rox text,roy text,roz text,constraint rul_pk primary key(rsn, rsx, rsy, rsz, ron));");    //div
    db.run(
    "CREATE TRIGGER if not exists obj_be_in BEFORE INSERT ON obj\n"
    +"BEGIN\n"
    +"UPDATE obj SET ose = (SELECT count(*) FROM obj WHERE ona=new.ona) where ose=\"0\" and ona=new.ona;\n"
    +"END;\n"
    +"END;\n");
    db.run(
    "CREATE TRIGGER if not exists obj_af_in AFTER INSERT ON obj\n"
    +"when (SELECT count(*) FROM obj WHERE ona=new.ona)>1\n"
    +"BEGIN\n"
    +"UPDATE obj SET ocr = (select ocr from obj where ose=\"1\" and ona=new.ona) where ona = new.ona and ose=new.ose;\n"
    +"UPDATE obj SET ocg = (select ocg from obj where ose=\"1\" and ona=new.ona) where ona = new.ona and ose=new.ose;\n"
    +"UPDATE obj SET ocb = (select ocb from obj where ose=\"1\" and ona=new.ona) where ona = new.ona and ose=new.ose;\n"
    +"END;\n"
    + "END;\n");
    db.run(
    "CREATE TRIGGER if not exists obj_af_de AFTER DELETE ON obj\n"
    + "BEGIN\n"
    + "UPDATE obj SET ose = old.ose where ose = (select count(*) from obj where ona=old.ona);\n"
    + "END;\n"
    + "END;\n");
}
db.serialize(function () {
    TABLES();
});
io.on('connection', function (socket) {
    console.log('socket connect : ' + socket.id);
    socket.on('connection', function () {
    }); 
    socket.on('disconnect', function () {
        var IP = this.id;
        console.log('socket disconnect : ' + this.id);
    }); 
    socket.on('obj_del', function (msg) {
        stmt = "select ona,ose from obj where "+
        "ona=\""+msg[0]+"\" and "+
        "oax=\""+msg[1]+"\" and "+
        "oay=\""+msg[2]+"\" and "+
        "oaz=\""+msg[3]+"\"; ";
        db.each(stmt, function (err, row) {
            io.emit('obj_del', "\"" + row.ona + row.ose + "\"");
            db.run("delete from obj where ose =\"" + row.ose + "\" and ona = \"" + row.ona + "\";")
        });
    });
    socket.on('obj_cre', function (msg) { 
        var a = new Array(); 
        a.push("0")
        a = a.concat(msg)
        a.push("0")
        a.push(msg[0])
        msg = a; 
        var stmt = "insert into obj values (";
        for (i = 0; i < msg.length; i++) {
            if (i == 0) {
                stmt += "\"" + msg[i] + "\"";
            } else {
                stmt += "\"" + msg[i] + "\"";
            }
            if (i < msg.length - 1)
                stmt += ", ";
        }
        stmt += ");";
        console.log(stmt)
        db.run(stmt);
        db.each("select o.ose,o.ona,o.oax,o.oay,o.oaz,r.rox,r.roy,r.roz from obj s, rul r, obj o where s.ona == r.rsn and r.ron == o.ona and s.oax+r.rsx == o.oax and s.oay+r.rsy == o.oay and s.oaz+r.rsz == o.oaz;", function (err,row) {
            if(true){
                db.run("update obj set oax=" + row.oax + "+" + row.rox + " where ose=\"" + row.ose + "\" and ona=\"" + row.ona + "\";")
                db.run("update obj set oay=" + row.oay + "+" + row.roy + " where ose=\"" + row.ose + "\" and ona=\"" + row.ona + "\";")
                db.run("update obj set oaz=" + row.oaz + "+" + row.roz + " where ose=\"" + row.ose + "\" and ona=\"" + row.ona + "\";")
            }
        })
        db.each("select * from obj", function (err, row) {
            io.emit('obj_cre', ["\"" + row.ona + row.ose + "\"", "\"" + row.oax + "\"", "\"" + row.oay + "\"", "\"" + row.oaz + "\"", "\"" + row.ocr + "\"", "\"" + row.ocg + "\"", "\"" + row.ocb + "\""]);
        });
    });
    socket.on('clear', function (msg) {
        db.each("select * from obj", function (err, row) {
            io.emit('obj_del', "\"" + row.ona + row.ose + "\"");
            db.run("delete from obj where ose =\"" + row.ose + "\" and ona = \"" + row.ona + "\";")
        });
    });
    socket.on('rul_del', function (msg) {
        console.log(msg);
        stmt = "delete from rul where " +
             "rsn=\"" + msg[0] + "\"" +
        " and rsx=\"" + msg[1] + "\"" +
        " and rsy=\"" + msg[2] + "\"" +
        " and rsz=\"" + msg[3] + "\"" +
        " and ron=\"" + msg[4] + "\"" +
        " and rox=\"" + msg[5] + "\"" +
        " and roy=\"" + msg[6] + "\"" +
        " and roz=\"" + msg[7] + "\"";
        stmt += ";"
        console.log(stmt);
        db.run(stmt);
    });
    socket.on('rul_cre', function (msg) {
        stmt = "insert or replace into rul values("
        for (i = 0; i < msg.length; i++) {
            stmt += "\"" + msg[i] + "\""
            if (i < msg.length - 1)
                stmt += ", "
        } stmt += ");"
        db.run(stmt);
    });
});
http.listen(80, function () {
    console.log('SERVER IS READY FOR [*:80]');
});
function isnull(a) {
    return typeof a == "undefined"
}

