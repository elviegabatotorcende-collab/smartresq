CREATE TABLE IF NOT EXISTS tbl_incident_photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reportid INT NOT NULL,
  photo VARCHAR(255) NOT NULL,
  uploadedby INT NOT NULL,
  dateuploaded DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reportid) REFERENCES tbl_incident_reports(id),
  FOREIGN KEY (uploadedby) REFERENCES tbl_users(id)
);
