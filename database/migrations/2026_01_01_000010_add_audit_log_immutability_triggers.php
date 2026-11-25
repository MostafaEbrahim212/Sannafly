<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::unprepared(<<<'SQL'
                CREATE TRIGGER IF NOT EXISTS audit_logs_no_update
                BEFORE UPDATE ON audit_logs
                BEGIN
                    SELECT RAISE(ABORT, 'Audit logs are immutable');
                END;
            SQL);

            DB::unprepared(<<<'SQL'
                CREATE TRIGGER IF NOT EXISTS audit_logs_no_delete
                BEFORE DELETE ON audit_logs
                BEGIN
                    SELECT RAISE(ABORT, 'Audit logs are immutable');
                END;
            SQL);
        } elseif (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_no_update');
            DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_no_delete');

            DB::unprepared(<<<'SQL'
                CREATE TRIGGER audit_logs_no_update
                BEFORE UPDATE ON audit_logs
                FOR EACH ROW
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Audit logs are immutable';
            SQL);

            DB::unprepared(<<<'SQL'
                CREATE TRIGGER audit_logs_no_delete
                BEFORE DELETE ON audit_logs
                FOR EACH ROW
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Audit logs are immutable';
            SQL);
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if (in_array($driver, ['sqlite', 'mysql', 'mariadb'], true)) {
            DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_no_update');
            DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_no_delete');
        }
    }
};
