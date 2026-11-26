ALTER TABLE tbl_notifications
  ADD COLUMN reportid INT NULL AFTER type,
  ADD CONSTRAINT fk_notif_report FOREIGN KEY (reportid) REFERENCES tbl_incident_reports(id);