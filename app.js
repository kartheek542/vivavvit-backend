const express = require("express");
const cors = require("cors")
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();
const path = require("path");
const { Parser } = require("json2csv");
const fs = require("fs");
app.use(cors())
app.use(express.json());

const dbPath = path.join(__dirname, "dummy.db");
let db = null;

//Database connection(initialize)
const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    // console.log(process.env.PORT)
    app.listen(process.env.PORT || 8080, () => console.log("running"));
  } catch (e) {
    console.log(`Error ${e.message}`);
    process.exit(1);
  }
};
initialize();

//authentication
const authenticate = (request, response, next) => {
  let jwtToken;
  const header = request.headers["authorization"];
  if (header !== undefined) {
    jwtToken = header.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "vivavvit", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        console.log("successfully verified");
        //console.log("")
        request.rollNo = payload.rollNo;
        request.eventId = payload.eventId;
        next();
      }
    });
  }
};

//login api call
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const query = `SELECT password FROM coordinator WHERE rollno='${username}'`;
  const ans = await db.get(query);
  if (ans === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(password, ans.password);
    if (!checkPassword) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const rollNo = username;
      const query = `SELECT event_id from coordinator where rollno = '${rollNo}'`;
      const ans = await db.get(query);
      const payload = { rollNo: username, eventId: ans.event_id };
      const jwtToken = jwt.sign(payload, "vivavvit");
      response.send({ jwtToken });
    }
  }
});

//display events

app.get("/events", async (request, response) => {
  // const { category } = request.query;
  const query = `SELECT event_id as eventId,eventname as eventName,category,image_url1 as imageUrl FROM event`;
  const eventArray = await db.all(query);
  //response.send(eventArray.map((event)=>convertDisplayEvents(event)));
  response.send(eventArray);
});

//display specific event

const convertDisplayEvent = (dbObject) => {
  return {
    eventId: dbObject.event_id,
    eventName: dbObject.eventname,
    category: dbObject.category,
    imageUrl1: dbObject.image_url1,
    imageUrl2: dbObject.image_url2,
    venue: dbObject.venue,
    date: dbObject.date,
    time: dbObject.time,
    description: dbObject.description,
  };
};

app.get("/events/:eventId", async (request, response) => {
  const { eventId } = request.params;
  const query = `SELECT * FROM event WHERE event_id = ${eventId}`;
  const Details = await db.get(query);
  response.send(convertDisplayEvent(Details));
});

app.post("/register", async (request, response) => {
  const { name, rollNo, college, year, branch, email, mobile, events, gender } =
    request.body;
  const userQuery = `INSERT INTO user(rollno,username,email,college,branch,mobile,year,gender)
                     VALUES ('${rollNo}','${name}','${email}','${college}','${branch}','${mobile}',${year},'${gender}');`;
  await db.run(userQuery);
  let placeholders = events
    .map((event) => "(" + rollNo + "," + event + ")")
    .join(",");
  let query = "INSERT INTO register(rollno, event_id) VALUES " + placeholders;
  await db.run(query);
  response.send("registration successful");
});

app.get("/coordinator", authenticate, async (request, response) => {
  const eventId = request.eventId;
  console.log(eventId);
  const query = `SELECT * FROM event where event_id = ${eventId}`;
  console.log(query);
  const Details = await db.get(query);
  response.send(convertDisplayEvent(Details));
});

app.put("/coordinator/save", authenticate, async (request, response) => {
  const {
    eventId,
    eventName,
    category,
    imageUrl,
    venue,
    dateTime,
    description,
  } = request.body;
  const query = `UPDATE event SET
                 eventname = '${eventName}',
                 category = '${category}',
                 venue = '${venue}',
                 date_time = '${dateTime}',
                 description = '${description}'
                 WHERE event_id = ${eventId};`;
  const ans = await db.run(query);
  response.send(ans);
});

app.get("/coordinator/reports", authenticate, async (request, response) => {
  const eventId = request.eventId;
  const query = `SELECT DISTINCT u.rollno as rollNo, username as name, college, year, branch, mobile, email
                 FROM user u INNER JOIN register r ON u.rollno = r.rollno
                 WHERE r.event_id = ${eventId}`;
  const ans = await db.all(query);
  response.send(ans);
});

// app.get("/coordinator/reports/download",(request, response)=>{
//   const csvParser = new Parser();
//   const csv = csvParser.parse(request.body);
//   fs.writeFile("list.csv", csv, function(err){
//     if(err) throw err;
//     console.log(csv);
//   });
//   response.attachment("list.csv");
//   response.status(200).send(csv);
// })

app.get(
  "/coordinator/reports/filter",
  authenticate,
  async (request, response) => {
    const { order_by } = request.query;
    const { gender, year } = request.body;
    const eventId = 1;
    const x = "(" + gender.map((x) => "'" + x + "'").join(",") + ")";
    const y = "(" + year.map((x) => x).join(",") + ")";
    const query = `SELECT DISTINCT u.rollno as rollNo, username as name, college, year, branch, mobile, email
  FROM user u INNER JOIN register r ON u.rollno = r.rollno
  WHERE r.event_id = ${eventId} AND year IN ${y} AND gender IN ${x}
  ORDER BY ${order_by}`;
    console.log(query);
    const ans = await db.all(query);
    response.send(ans);
  }
);

app.post("/insert", async (request, response) => {
  const { rollno, password, name, mobile, event_id } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = `INSERT INTO coordinator (rollno,password,name,event_id,mobile) VALUES ('${rollno}','${hashedPassword}',
                 '${name}',${event_id},'${mobile}')`;
  await db.run(query);
  response.send("success");
});

module.exports = app;
