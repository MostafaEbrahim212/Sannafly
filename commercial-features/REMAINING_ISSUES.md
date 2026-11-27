# Remaining Issues & Deployment Notes

1. **Remote Update & License Servers:** Integration layers (`PRODUCT_UPDATE_URL`, `LICENSE_SERVER_URL`) are implemented and tested; deploying external SaaS license/update server endpoints is out of scope of this repository.
2. **File Restore from ZIP:** Database `.sql` restore is implemented with pre-restore snapshots and checksum verification; full `.zip` media extraction should be performed carefully on target hosting to respect file ownership.
3. **Audit Log Tampering Boundary:** Database-stored audit logs are immutable at the application layer (`LogicException` on update/delete), though a server root/DBA with direct SQL access can always alter DB rows.
