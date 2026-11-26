CREATE DATABASE IF NOT EXISTS smartresq
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartresq;

CREATE TABLE tbl_access_role (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rolename VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  status TINYINT NOT NULL DEFAULT 1
);

CREATE TABLE tbl_barangay (
  id INT PRIMARY KEY AUTO_INCREMENT,
  barangayname VARCHAR(100) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1
);

CREATE TABLE tbl_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  fullname VARCHAR(150) NOT NULL,
  contactno VARCHAR(20),
  email VARCHAR(100),
  role INT NOT NULL,
  barangay INT,
  imagename VARCHAR(255),
  availability VARCHAR(20) NOT NULL DEFAULT 'Available',
  fcmtoken VARCHAR(255),
  status TINYINT NOT NULL DEFAULT 1,
  FOREIGN KEY (role) REFERENCES tbl_access_role(id),
  FOREIGN KEY (barangay) REFERENCES tbl_barangay(id)
);

CREATE TABLE tbl_incident_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  typename VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  status TINYINT NOT NULL DEFAULT 1
);

CREATE TABLE tbl_incident_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reportid VARCHAR(12) NOT NULL UNIQUE,
  residentid INT NOT NULL,
  incidenttype INT NOT NULL,
  barangay INT NOT NULL,
  description VARCHAR(500),
  photo VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  datereported DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  FOREIGN KEY (residentid) REFERENCES tbl_users(id),
  FOREIGN KEY (incidenttype) REFERENCES tbl_incident_types(id),
  FOREIGN KEY (barangay) REFERENCES tbl_barangay(id)
);

CREATE TABLE tbl_incident_status_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reportid INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  remarks VARCHAR(255),
  updatedby INT NOT NULL,
  dateupdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reportid) REFERENCES tbl_incident_reports(id),
  FOREIGN KEY (updatedby) REFERENCES tbl_users(id)
);

CREATE TABLE tbl_dispatch (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dispatchid VARCHAR(12) NOT NULL UNIQUE,
  reportid INT NOT NULL,
  responderid INT NOT NULL,
  dispatchedby INT NOT NULL,
  dispatchdatetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'Dispatched',
  FOREIGN KEY (reportid) REFERENCES tbl_incident_reports(id),
  FOREIGN KEY (responderid) REFERENCES tbl_users(id),
  FOREIGN KEY (dispatchedby) REFERENCES tbl_users(id)
);

CREATE TABLE tbl_responder_location_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  responderid INT NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (responderid) REFERENCES tbl_users(id)
);

CREATE TABLE tbl_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userid INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'System',
  isread TINYINT NOT NULL DEFAULT 0,
  datecreated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userid) REFERENCES tbl_users(id)
);

-- Starter data
INSERT INTO tbl_access_role (id, rolename, description) VALUES
  (1, 'Resident', 'Reports and tracks incidents'),
  (2, 'Barangay Captain', 'Admin: manages reports and users'),
  (3, 'Barangay Official', 'Staff: verifies reports and dispatches responders'),
  (4, 'Barangay Responder', 'Responds to assigned incidents'),
  (5, 'MDRRMC', 'Municipal monitoring and reports');

INSERT INTO tbl_barangay (barangayname) VALUES
  ('Poblacion'), ('Cantangit'), ('San Isidro'), ('Cagongcog');

INSERT INTO tbl_incident_types (typename, description) VALUES
  ('Fire', 'Fire emergencies'),
  ('Medical Emergency', 'Medical and health emergencies'),
  ('Accident', 'Road and other accidents'),
  ('Flood', 'Flooding and water-related emergencies');