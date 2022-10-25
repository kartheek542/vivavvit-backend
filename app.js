const express = require("express");
const cors = require("cors");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();
const path = require("path");
const { Parser } = require("json2csv");
const fs = require("fs");
app.use(cors());
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
    app.listen(process.env.PORT || 8080, () => console.log("Server started successfully at port 8080"));
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
    response.send({ errorMsg: "Invalid user" });
  } else {
    const checkPassword = await bcrypt.compare(password, ans.password);
    if (!checkPassword) {
      response.status(400);
      response.send({ errorMsg: "Invalid password" });
    } else {
      const rollNo = username;
      const query = `SELECT event_id from coordinator where rollno = '${rollNo}'`;
      const ans = await db.get(query);
      const payload = { rollNo: username, eventId: ans.event_id };
      const jwtToken = jwt.sign(payload, "vivavvit");
      response.send({ vvitAccessToken: jwtToken });
    }
  }
});

//display events

app.get("/events", async (request, response) => {
  const query = `
    SELECT 
      event_id as eventId,
      eventname as eventName,
      category,
      image_url1 as imageUrl 
    FROM event`;
  const eventArray = await db.all(query);
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
  const Query = `SELECT event_id FROM register WHERE rollno = '${rollNo}';`;
  const ans = await db.all(Query);
  let array = ans.map((x) => x.event_id);
  const common = events.filter((value) => !array.includes(value));
  if (ans.length == 0) {
    const userQuery = `
      INSERT INTO 
        user(rollno,username,email,college,branch,mobile,year,gender)
        VALUES('${rollNo}','${name}','${email}','${college}','${branch}','${mobile}',${year},'${gender}');
    `;
    await db.run(userQuery);
  }
  let placeholders = common
    .map((event) => "(" + "'" + rollNo + "'" + "," + event + ")")
    .join(",");
  if (placeholders.length != 0) {
    let query = "INSERT INTO register(rollno, event_id) VALUES " + placeholders;
    await db.run(query);
  }
  response.send("registration successful");
});

app.get("/coordinator", authenticate, async (request, response) => {
  const eventId = request.eventId;
  const query = `SELECT * FROM event where event_id = ${eventId}`;
  const Details = await db.get(query);
  response.send(convertDisplayEvent(Details));
});

app.put("/coordinator/save", authenticate, async (request, response) => {
  const { venue, date, time, description } = request.body;
  const eventId = request.eventId;
  const query = `
    UPDATE event 
    SET
      venue = '${venue}',
      date = '${date}',
      time = '${time}',
      description = '${description}'
    WHERE event_id = ${eventId};
  `;
  const ans = await db.run(query);
  response.send(ans);
});

app.get("/coordinator/reports", authenticate, async (request, response) => {
  const eventId = request.eventId;
  const query = `
  SELECT DISTINCT 
    u.rollno as rollNo, 
    username as name, 
    college, 
    year, 
    branch, 
    mobile, 
    email
    FROM user u 
      INNER JOIN register r ON u.rollno = r.rollno
      WHERE r.event_id = ${eventId}
  `;
  const ans = await db.all(query);
  response.send(ans);
});

app.get("/coordinator/reports/download",(request, response)=>{
  const csvParser = new Parser();
  const csv = csvParser.parse(request.body);
  fs.writeFile("list.csv", csv, function(err){
    if(err) throw err;
    console.log(csv);
  });
  response.attachment("list.csv");
  response.status(200).send(csv);
})

app.post(
  "/coordinator/reports/filter",
  authenticate,
  async (request, response) => {
    const { order_by } = request.query;
    const { gender, year } = request.body;
    const eventId = request.eventId;
    const x = "(" + gender.map((x) => "'" + x + "'").join(",") + ")";
    const y = "(" + year.map((x) => x).join(",") + ")";
    const query = `SELECT DISTINCT u.rollno as rollNo, username as name, college, year, branch, mobile, email, gender
  FROM user u INNER JOIN register r ON u.rollno = r.rollno
  WHERE r.event_id = ${eventId} AND year IN ${y} AND gender IN ${x}
  ORDER BY ${order_by}`;
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
