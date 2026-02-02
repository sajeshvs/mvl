<?php
/**
 * Cron Job Script for Microtrack → SharePoint Sync
 * =================================================
 * 
 * Schedule this script to run hourly using crontab:
 * 
 * # Edit crontab
 * crontab -e
 * 
 * # Add this line for hourly sync
 * 0 * * * * php /path/to/microtrack_sync_cron.php >> /var/log/microtrack_sync.log 2>&1
 * 
 * # Or for every 15 minutes (near real-time)
 * */15 * * * * php /path/to/microtrack_sync_cron.php >> /var/log/microtrack_sync.log 2>&1
 */

require_once __DIR__ . '/MicrotrackSharePointSync.php';

// Configuration - Set these via environment variables or edit directly
$config = [
    'db_host' => getenv('MICROTRACK_DB_HOST') ?: 'localhost',
    'db_user' => getenv('MICROTRACK_DB_USER') ?: 'microtrack_user',
    'db_pass' => getenv('MICROTRACK_DB_PASS') ?: 'your_password_here',
    'db_name' => getenv('MICROTRACK_DB_NAME') ?: 'microtrack_db',
];

// Lock file to prevent overlapping runs
$lockFile = '/tmp/microtrack_sharepoint_sync.lock';

// Check if already running
if (file_exists($lockFile)) {
    $lockAge = time() - filemtime($lockFile);
    if ($lockAge < 3600) { // Less than 1 hour old
        echo "[" . date('Y-m-d H:i:s') . "] Sync already running (lock file exists). Exiting.\n";
        exit(0);
    }
    // Lock file is stale, remove it
    unlink($lockFile);
}

// Create lock file
file_put_contents($lockFile, getmypid());

try {
    echo "[" . date('Y-m-d H:i:s') . "] Starting scheduled sync...\n";
    
    $sync = new MicrotrackSharePointSync(
        $config['db_host'],
        $config['db_user'],
        $config['db_pass'],
        $config['db_name']
    );
    
    // Run full sync
    $results = $sync->syncAll();
    
    // Log results
    echo "[" . date('Y-m-d H:i:s') . "] Sync completed successfully.\n";
    echo "Results:\n";
    print_r($results);
    
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] Sync failed: " . $e->getMessage() . "\n";
    exit(1);
} finally {
    // Remove lock file
    if (file_exists($lockFile)) {
        unlink($lockFile);
    }
}

exit(0);
