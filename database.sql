
CREATE TABLE user(
    rollno VARCHAR PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR NOT NULL,
    college VARCHAR NOT NULL,
    year INTEGER NOT NULL,
    branch VARCHAR NOT NULL,
    mobile VARCHAR NOT NULL,
    gender CHAR NOT NULL
);


CREATE TABLE event(
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventname VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    venue VARCHAR NOT NULL,
    date VARCHAR NOT NULL,
    time VARCHAR NOT NULL,
    image_url1 TEXT NOT NULL,
    image_url2 TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE coordinator(
    rollno VARCHAR PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password TEXT NOT NULL,
    mobile VARCHAR NOT NULL,
    event_id INTEGER,
    FOREIGN KEY(event_id) REFERENCES event(event_id) ON DELETE CASCADE
);

CREATE TABLE register(
    rollno VARCHAR,
    event_id INTEGER,
    
    FOREIGN KEY(rollno) REFERENCES user(rollno) ON DELETE CASCADE,
    FOREIGN KEY(event_id) REFERENCES event(event_id) ON DELETE CASCADE
);


