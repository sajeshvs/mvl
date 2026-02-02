<?php
/**
 * MVL Microtrack to SharePoint Integration
 * =========================================
 * 
 * This PHP class pushes data from Microtrack (MySQL) to SharePoint Lists
 * using Microsoft Graph API with Entra App authentication.
 * 
 * Requirements:
 * - PHP 7.4+
 * - cURL extension
 * - Access to Microtrack MySQL database
 * 
 * Usage:
 *   $sync = new MicrotrackSharePointSync();
 *   $sync->syncAll();
 * 
 * Or for specific sync:
 *   $sync->syncPurchaseOrders();
 *   $sync->syncQuotations();
 *   $sync->syncSuppliers();
 */

class MicrotrackSharePointSync
{
    // Azure AD / Entra App Configuration
    private $tenantId = '416328e6-260f-438f-bf3c-9c4f15b6a1ca';
    private $clientId = '1b9540e1-6c1e-4214-8d97-6116394ef72c';
    private $clientSecret = 'cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4';
    
    // SharePoint Site Configuration
    private $siteId = 'mvlgroupusa.sharepoint.com,351615e7-ffb0-495b-98aa-5f9b61dadf6e,59b1c0b8-c8cc-40aa-94af-0280b328bf59';
    
    // List IDs (populated on first use)
    private $listIds = [];
    
    // Access token cache
    private $accessToken = null;
    private $tokenExpiry = 0;
    
    // MySQL connection
    private $db = null;
    
    // Logging
    private $logFile = '/var/log/microtrack_sharepoint_sync.log';
    
    /**
     * Constructor - Initialize database connection
     */
    public function __construct($dbHost = 'localhost', $dbUser = 'microtrack', $dbPass = '', $dbName = 'microtrack')
    {
        try {
            $this->db = new PDO(
                "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
                $dbUser,
                $dbPass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (PDOException $e) {
            $this->log("Database connection failed: " . $e->getMessage(), 'ERROR');
            throw $e;
        }
    }
    
    /**
     * Get Microsoft Graph API access token
     */
    private function getAccessToken()
    {
        // Return cached token if still valid
        if ($this->accessToken && time() < $this->tokenExpiry - 60) {
            return $this->accessToken;
        }
        
        $tokenUrl = "https://login.microsoftonline.com/{$this->tenantId}/oauth2/v2.0/token";
        
        $postData = http_build_query([
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'scope' => 'https://graph.microsoft.com/.default',
            'grant_type' => 'client_credentials'
        ]);
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $tokenUrl,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            $this->log("Token request failed: HTTP {$httpCode} - {$response}", 'ERROR');
            throw new Exception("Failed to get access token");
        }
        
        $data = json_decode($response, true);
        $this->accessToken = $data['access_token'];
        $this->tokenExpiry = time() + $data['expires_in'];
        
        return $this->accessToken;
    }
    
    /**
     * Make Graph API request
     */
    private function graphRequest($method, $endpoint, $data = null)
    {
        $url = "https://graph.microsoft.com/v1.0" . $endpoint;
        $token = $this->getAccessToken();
        
        $headers = [
            "Authorization: Bearer {$token}",
            "Content-Type: application/json"
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CUSTOMREQUEST => $method
        ]);
        
        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'status' => $httpCode,
            'data' => json_decode($response, true)
        ];
    }
    
    /**
     * Get SharePoint List ID by name
     */
    private function getListId($listName)
    {
        if (isset($this->listIds[$listName])) {
            return $this->listIds[$listName];
        }
        
        $result = $this->graphRequest('GET', "/sites/{$this->siteId}/lists?$filter=displayName eq '{$listName}'");
        
        if ($result['status'] === 200 && !empty($result['data']['value'])) {
            $this->listIds[$listName] = $result['data']['value'][0]['id'];
            return $this->listIds[$listName];
        }
        
        throw new Exception("List not found: {$listName}");
    }
    
    /**
     * Add item to SharePoint list
     */
    private function addListItem($listName, $fields)
    {
        $listId = $this->getListId($listName);
        $endpoint = "/sites/{$this->siteId}/lists/{$listId}/items";
        
        return $this->graphRequest('POST', $endpoint, ['fields' => $fields]);
    }
    
    /**
     * Update item in SharePoint list
     */
    private function updateListItem($listName, $itemId, $fields)
    {
        $listId = $this->getListId($listName);
        $endpoint = "/sites/{$this->siteId}/lists/{$listId}/items/{$itemId}/fields";
        
        return $this->graphRequest('PATCH', $endpoint, $fields);
    }
    
    /**
     * Find existing item by field value
     */
    private function findItemByField($listName, $fieldName, $fieldValue)
    {
        $listId = $this->getListId($listName);
        $endpoint = "/sites/{$this->siteId}/lists/{$listId}/items?\$expand=fields&\$filter=fields/{$fieldName} eq '{$fieldValue}'";
        
        $result = $this->graphRequest('GET', $endpoint);
        
        if ($result['status'] === 200 && !empty($result['data']['value'])) {
            return $result['data']['value'][0];
        }
        
        return null;
    }
    
    /**
     * Sync Purchase Orders from Microtrack to SharePoint
     */
    public function syncPurchaseOrders($limit = 1000)
    {
        $this->log("Starting PO sync...");
        
        // Query Microtrack database for recent POs
        // Adjust this SQL to match your actual Microtrack schema
        $sql = "
            SELECT 
                po.po_number AS POID,
                po.po_date AS PODate,
                s.supplier_name AS SupplierName,
                po.total_value_usd AS ValueUSD,
                e.entity_name AS Entity,
                m.material_group AS MaterialGroup,
                po.discipline AS Discipline,
                po.status AS Status,
                po.updated_at AS LastUpdated
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN entities e ON po.entity_id = e.id
            LEFT JOIN material_groups m ON po.material_group_id = m.id
            WHERE po.updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY po.updated_at DESC
            LIMIT :limit
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['limit' => $limit]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $added = 0;
        $updated = 0;
        $failed = 0;
        
        foreach ($orders as $order) {
            try {
                $fields = [
                    'Title' => substr($order['POID'], 0, 255),
                    'POID' => substr($order['POID'], 0, 255),
                    'SupplierName' => substr($order['SupplierName'] ?? '', 0, 255),
                    'ValueUSD' => floatval($order['ValueUSD']),
                    'Entity' => substr($order['Entity'] ?? '', 0, 255),
                    'MaterialGroup' => substr($order['MaterialGroup'] ?? '', 0, 255),
                    'Discipline' => substr($order['Discipline'] ?? '', 0, 255),
                ];
                
                // Check if exists
                $existing = $this->findItemByField('MT_PurchaseOrders', 'POID', $order['POID']);
                
                if ($existing) {
                    // Update existing
                    $result = $this->updateListItem('MT_PurchaseOrders', $existing['id'], $fields);
                    if ($result['status'] === 200) {
                        $updated++;
                    } else {
                        $failed++;
                        $this->log("Failed to update PO {$order['POID']}: " . json_encode($result), 'ERROR');
                    }
                } else {
                    // Add new
                    $result = $this->addListItem('MT_PurchaseOrders', $fields);
                    if ($result['status'] === 201) {
                        $added++;
                    } else {
                        $failed++;
                        $this->log("Failed to add PO {$order['POID']}: " . json_encode($result), 'ERROR');
                    }
                }
                
                // Rate limiting
                usleep(100000); // 100ms delay
                
            } catch (Exception $e) {
                $failed++;
                $this->log("Error syncing PO {$order['POID']}: " . $e->getMessage(), 'ERROR');
            }
        }
        
        $this->log("PO sync complete: Added={$added}, Updated={$updated}, Failed={$failed}");
        return ['added' => $added, 'updated' => $updated, 'failed' => $failed];
    }
    
    /**
     * Sync Quotations from Microtrack to SharePoint
     */
    public function syncQuotations($limit = 1000)
    {
        $this->log("Starting Quotation sync...");
        
        // Query Microtrack database for recent quotations
        $sql = "
            SELECT 
                q.quotation_number AS QuotationID,
                q.status AS Status,
                q.value_usd AS ValueUSD,
                c.client_name AS ClientName,
                e.entity_name AS Entity,
                q.discipline AS Discipline,
                q.created_at AS CreatedDate,
                q.updated_at AS LastUpdated
            FROM quotations q
            LEFT JOIN clients c ON q.client_id = c.id
            LEFT JOIN entities e ON q.entity_id = e.id
            WHERE q.updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY q.updated_at DESC
            LIMIT :limit
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['limit' => $limit]);
        $quotations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $added = 0;
        $updated = 0;
        $failed = 0;
        
        foreach ($quotations as $quote) {
            try {
                // Map status to valid choice
                $status = $quote['Status'];
                if (!in_array($status, ['Quotation', 'Waiting', 'Order', 'Cancelled'])) {
                    $status = 'Quotation';
                }
                
                $fields = [
                    'Title' => substr($quote['QuotationID'], 0, 255),
                    'QuotationID' => substr($quote['QuotationID'], 0, 255),
                    'Status' => $status,
                    'ValueUSD' => floatval($quote['ValueUSD']),
                    'ClientName' => substr($quote['ClientName'] ?? '', 0, 255),
                    'Entity' => substr($quote['Entity'] ?? '', 0, 255),
                    'Discipline' => substr($quote['Discipline'] ?? '', 0, 255),
                ];
                
                // Check if exists
                $existing = $this->findItemByField('MT_Quotations', 'QuotationID', $quote['QuotationID']);
                
                if ($existing) {
                    $result = $this->updateListItem('MT_Quotations', $existing['id'], $fields);
                    if ($result['status'] === 200) {
                        $updated++;
                    } else {
                        $failed++;
                    }
                } else {
                    $result = $this->addListItem('MT_Quotations', $fields);
                    if ($result['status'] === 201) {
                        $added++;
                    } else {
                        $failed++;
                    }
                }
                
                usleep(100000);
                
            } catch (Exception $e) {
                $failed++;
                $this->log("Error syncing Quotation {$quote['QuotationID']}: " . $e->getMessage(), 'ERROR');
            }
        }
        
        $this->log("Quotation sync complete: Added={$added}, Updated={$updated}, Failed={$failed}");
        return ['added' => $added, 'updated' => $updated, 'failed' => $failed];
    }
    
    /**
     * Sync Suppliers from Microtrack to SharePoint
     */
    public function syncSuppliers()
    {
        $this->log("Starting Supplier sync...");
        
        // Query for supplier summary
        $sql = "
            SELECT 
                s.supplier_name AS SupplierName,
                COUNT(po.id) AS POCount,
                COALESCE(SUM(po.total_value_usd), 0) AS TotalSpendUSD
            FROM suppliers s
            LEFT JOIN purchase_orders po ON s.id = po.supplier_id
            GROUP BY s.id, s.supplier_name
            ORDER BY TotalSpendUSD DESC
        ";
        
        $stmt = $this->db->query($sql);
        $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $added = 0;
        $updated = 0;
        $failed = 0;
        
        foreach ($suppliers as $supplier) {
            try {
                $fields = [
                    'Title' => substr($supplier['SupplierName'], 0, 255),
                    'SupplierName' => substr($supplier['SupplierName'], 0, 255),
                    'POCount' => intval($supplier['POCount']),
                    'TotalSpendUSD' => floatval($supplier['TotalSpendUSD']),
                ];
                
                $existing = $this->findItemByField('MT_Suppliers', 'SupplierName', $supplier['SupplierName']);
                
                if ($existing) {
                    $result = $this->updateListItem('MT_Suppliers', $existing['id'], $fields);
                    $updated += ($result['status'] === 200) ? 1 : 0;
                } else {
                    $result = $this->addListItem('MT_Suppliers', $fields);
                    $added += ($result['status'] === 201) ? 1 : 0;
                }
                
                usleep(100000);
                
            } catch (Exception $e) {
                $failed++;
            }
        }
        
        $this->log("Supplier sync complete: Added={$added}, Updated={$updated}, Failed={$failed}");
        return ['added' => $added, 'updated' => $updated, 'failed' => $failed];
    }
    
    /**
     * Sync Summary KPIs to SharePoint
     */
    public function syncSummary()
    {
        $this->log("Starting Summary sync...");
        
        $now = date('c');
        
        // Calculate KPIs from Microtrack
        $kpis = [];
        
        // PO metrics
        $stmt = $this->db->query("SELECT COUNT(*) as cnt, COALESCE(SUM(total_value_usd), 0) as total FROM purchase_orders");
        $poStats = $stmt->fetch(PDO::FETCH_ASSOC);
        $kpis['GS_TotalPOs'] = ['MetricName' => 'Total POs', 'MetricValue' => $poStats['cnt'], 'Dashboard' => 'GlobalSpend'];
        $kpis['GS_TotalSpendUSD'] = ['MetricName' => 'Total Spend USD', 'MetricValue' => $poStats['total'], 'Dashboard' => 'GlobalSpend'];
        
        // Quotation metrics
        $stmt = $this->db->query("SELECT COUNT(*) as cnt, COALESCE(SUM(value_usd), 0) as total FROM quotations");
        $quoteStats = $stmt->fetch(PDO::FETCH_ASSOC);
        $kpis['SM_TotalQuotations'] = ['MetricName' => 'Total Quotations', 'MetricValue' => $quoteStats['cnt'], 'Dashboard' => 'SupplierMarketplace'];
        
        // Supplier count
        $stmt = $this->db->query("SELECT COUNT(DISTINCT supplier_id) as cnt FROM purchase_orders");
        $supplierStats = $stmt->fetch(PDO::FETCH_ASSOC);
        $kpis['GS_SupplierCount'] = ['MetricName' => 'Supplier Count', 'MetricValue' => $supplierStats['cnt'], 'Dashboard' => 'GlobalSpend'];
        
        $updated = 0;
        
        foreach ($kpis as $key => $kpi) {
            try {
                $fields = [
                    'Title' => $key,
                    'MetricName' => $kpi['MetricName'],
                    'MetricValue' => floatval($kpi['MetricValue']),
                    'Dashboard' => $kpi['Dashboard'],
                    'AsOfDate' => $now,
                ];
                
                $existing = $this->findItemByField('MT_Summary', 'Title', $key);
                
                if ($existing) {
                    $this->updateListItem('MT_Summary', $existing['id'], $fields);
                } else {
                    $this->addListItem('MT_Summary', $fields);
                }
                
                $updated++;
                
            } catch (Exception $e) {
                $this->log("Error syncing KPI {$key}: " . $e->getMessage(), 'ERROR');
            }
        }
        
        $this->log("Summary sync complete: Updated {$updated} KPIs");
        return ['updated' => $updated];
    }
    
    /**
     * Full sync - all data types
     */
    public function syncAll()
    {
        $this->log("=== Starting full sync ===");
        
        $results = [
            'suppliers' => $this->syncSuppliers(),
            'quotations' => $this->syncQuotations(),
            'purchaseOrders' => $this->syncPurchaseOrders(),
            'summary' => $this->syncSummary(),
        ];
        
        $this->log("=== Full sync complete ===");
        return $results;
    }
    
    /**
     * Logging helper
     */
    private function log($message, $level = 'INFO')
    {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] [{$level}] {$message}\n";
        
        // Write to log file
        if ($this->logFile) {
            file_put_contents($this->logFile, $logMessage, FILE_APPEND);
        }
        
        // Also echo if running from CLI
        if (php_sapi_name() === 'cli') {
            echo $logMessage;
        }
    }
}


// ============================================================================
// CLI USAGE
// ============================================================================

if (php_sapi_name() === 'cli') {
    // Example usage - adjust database credentials as needed
    $dbHost = getenv('MICROTRACK_DB_HOST') ?: 'localhost';
    $dbUser = getenv('MICROTRACK_DB_USER') ?: 'microtrack';
    $dbPass = getenv('MICROTRACK_DB_PASS') ?: '';
    $dbName = getenv('MICROTRACK_DB_NAME') ?: 'microtrack';
    
    try {
        $sync = new MicrotrackSharePointSync($dbHost, $dbUser, $dbPass, $dbName);
        
        // Parse command line arguments
        $action = $argv[1] ?? 'all';
        
        switch ($action) {
            case 'pos':
                $sync->syncPurchaseOrders();
                break;
            case 'quotations':
                $sync->syncQuotations();
                break;
            case 'suppliers':
                $sync->syncSuppliers();
                break;
            case 'summary':
                $sync->syncSummary();
                break;
            case 'all':
            default:
                $sync->syncAll();
                break;
        }
        
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}
