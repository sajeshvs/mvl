"""
Power BI Embedded Report Creator
================================

This creates an HTML application that embeds Power BI's report creation
interface directly, allowing users to build reports in-browser without
Power BI Desktop.

Uses Power BI JavaScript SDK and the dataset's createReportEmbedURL.
"""

import json
import requests
from msal import ConfidentialClientApplication
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import threading

# Configuration
TENANT_ID = "416328e6-260f-438f-bf3c-9c4f15b6a1ca"
CLIENT_ID = "1b9540e1-6c1e-4214-8d97-6116394ef72c"
CLIENT_SECRET = "cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4"
WORKSPACE_ID = "4913fadb-9d03-4742-9e8c-39412a64a93f"
DATASET_ID = "c725ca87-7e4b-4a83-819c-55b1bdcbceeb"
PBI_API_BASE = "https://api.powerbigov.us/v1.0/myorg"
PBI_SCOPE = "https://analysis.usgovcloudapi.net/powerbi/api/.default"

def get_pbi_token():
    """Get Power BI API access token"""
    app = ConfidentialClientApplication(
        CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{TENANT_ID}",
        client_credential=CLIENT_SECRET
    )
    result = app.acquire_token_for_client(scopes=[PBI_SCOPE])
    return result["access_token"]

def get_embed_config():
    """Get embed configuration for creating a report"""
    token = get_pbi_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Get dataset info
    resp = requests.get(f"{PBI_API_BASE}/groups/{WORKSPACE_ID}/datasets/{DATASET_ID}", headers=headers)
    dataset = resp.json()
    
    # Generate embed token for the workspace
    embed_token_body = {
        "datasets": [{"id": DATASET_ID}],
        "targetWorkspaces": [{"id": WORKSPACE_ID}]
    }
    
    resp = requests.post(f"{PBI_API_BASE}/GenerateToken", headers=headers, json=embed_token_body)
    
    if resp.status_code == 200:
        embed_token = resp.json().get("token")
    else:
        # Fallback - use the access token directly
        embed_token = token
    
    return {
        "datasetId": DATASET_ID,
        "workspaceId": WORKSPACE_ID,
        "embedUrl": dataset.get("createReportEmbedURL", ""),
        "accessToken": embed_token,
        "tokenType": "Aad",  # or "Embed" if using embed token
        "datasetName": dataset.get("name", "")
    }

def create_embed_html(config: dict) -> str:
    """Create the HTML page with embedded Power BI report creator"""
    
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MVL Supply Intel Hub - Create Reports</title>
    <script src="https://cdn.jsdelivr.net/npm/powerbi-client@2.22.3/dist/powerbi.min.js"></script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f5f7fa;
        }}
        .header {{
            background: linear-gradient(135deg, #004578 0%, #003359 100%);
            color: white;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .header h1 {{ font-size: 20px; }}
        .header-info {{ font-size: 12px; opacity: 0.9; }}
        .toolbar {{
            background: white;
            padding: 12px 24px;
            border-bottom: 1px solid #ddd;
            display: flex;
            gap: 12px;
            align-items: center;
        }}
        .btn {{
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }}
        .btn-primary {{
            background: #0078d4;
            color: white;
        }}
        .btn-primary:hover {{ background: #106ebe; }}
        .btn-secondary {{
            background: #f3f2f1;
            color: #323130;
            border: 1px solid #d2d0ce;
        }}
        .btn-secondary:hover {{ background: #edebe9; }}
        .btn-success {{
            background: #107c10;
            color: white;
        }}
        .btn-success:hover {{ background: #0b6a0b; }}
        #reportContainer {{
            height: calc(100vh - 120px);
            background: white;
        }}
        .status {{
            padding: 4px 12px;
            background: #e6f4ea;
            border-radius: 12px;
            font-size: 12px;
            color: #137333;
        }}
        .info-panel {{
            margin-left: auto;
            font-size: 12px;
            color: #605e5c;
        }}
        .report-templates {{
            display: flex;
            gap: 8px;
        }}
        .template-btn {{
            padding: 6px 12px;
            background: #f0f6fc;
            border: 1px solid #0078d4;
            border-radius: 4px;
            color: #0078d4;
            cursor: pointer;
            font-size: 11px;
        }}
        .template-btn:hover {{
            background: #0078d4;
            color: white;
        }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>🏗️ MVL Supply Intel Hub - Report Builder</h1>
            <div class="header-info">Create Power BI reports from dataset: {config['datasetName']}</div>
        </div>
        <div class="header-info">
            Dataset ID: {config['datasetId'][:8]}...
        </div>
    </div>
    
    <div class="toolbar">
        <button class="btn btn-primary" onclick="createReport()">➕ New Report</button>
        <button class="btn btn-success" onclick="saveReport()">💾 Save Report</button>
        <button class="btn btn-secondary" onclick="switchToEdit()">✏️ Edit Mode</button>
        <button class="btn btn-secondary" onclick="switchToView()">👁️ View Mode</button>
        
        <div class="report-templates">
            <span style="font-size: 12px; color: #605e5c;">Templates:</span>
            <button class="template-btn" onclick="applyTemplate('supplier')">Supplier Marketplace</button>
            <button class="template-btn" onclick="applyTemplate('spend')">Global Spend</button>
            <button class="template-btn" onclick="applyTemplate('disciplines')">Disciplines</button>
        </div>
        
        <div class="info-panel">
            <span class="status" id="status">Ready</span>
        </div>
    </div>
    
    <div id="reportContainer"></div>
    
    <script>
        // Power BI Embed Configuration
        const embedConfig = {{
            datasetId: "{config['datasetId']}",
            workspaceId: "{config['workspaceId']}",
            embedUrl: "{config['embedUrl']}",
            accessToken: "{config['accessToken']}",
            tokenType: {1 if config['tokenType'] == 'Embed' else 0}
        }};
        
        let powerbi = window['powerbi-client'];
        let report = null;
        
        function updateStatus(msg, type = 'info') {{
            const status = document.getElementById('status');
            status.textContent = msg;
            status.style.background = type === 'error' ? '#fce8e6' : 
                                      type === 'success' ? '#e6f4ea' : '#e8f4fd';
            status.style.color = type === 'error' ? '#c5221f' : 
                                 type === 'success' ? '#137333' : '#0078d4';
        }}
        
        function createReport() {{
            const container = document.getElementById('reportContainer');
            container.innerHTML = '';
            
            updateStatus('Creating new report...');
            
            const config = {{
                type: 'create',
                tokenType: powerbi.models.TokenType.Aad,
                accessToken: embedConfig.accessToken,
                embedUrl: embedConfig.embedUrl,
                datasetId: embedConfig.datasetId,
                settings: {{
                    panes: {{
                        filters: {{ visible: true }},
                        pageNavigation: {{ visible: true }}
                    }},
                    bars: {{
                        actionBar: {{ visible: true }}
                    }}
                }}
            }};
            
            try {{
                report = powerbi.embed(container, config);
                
                report.on('loaded', function() {{
                    updateStatus('Report canvas ready - add visuals!', 'success');
                }});
                
                report.on('error', function(event) {{
                    console.error('Report error:', event.detail);
                    updateStatus('Error: ' + event.detail.message, 'error');
                }});
                
                report.on('saved', function(event) {{
                    updateStatus('Report saved: ' + event.detail.reportObjectId, 'success');
                }});
                
            }} catch (e) {{
                console.error('Embed error:', e);
                updateStatus('Failed to embed: ' + e.message, 'error');
            }}
        }}
        
        function saveReport() {{
            if (!report) {{
                updateStatus('No report to save', 'error');
                return;
            }}
            
            const saveAsParameters = {{
                name: 'MVL-Dashboard-' + new Date().toISOString().slice(0,10)
            }};
            
            report.saveAs(saveAsParameters)
                .then(function() {{
                    updateStatus('Report saved successfully!', 'success');
                }})
                .catch(function(error) {{
                    console.error('Save error:', error);
                    updateStatus('Save failed: ' + error.message, 'error');
                }});
        }}
        
        function switchToEdit() {{
            if (report) {{
                report.switchMode('edit').then(() => {{
                    updateStatus('Edit mode', 'info');
                }});
            }}
        }}
        
        function switchToView() {{
            if (report) {{
                report.switchMode('view').then(() => {{
                    updateStatus('View mode', 'info');
                }});
            }}
        }}
        
        function applyTemplate(templateName) {{
            updateStatus('Applying ' + templateName + ' template...');
            
            // Template configurations for each dashboard type
            const templates = {{
                supplier: {{
                    name: 'Supplier Marketplace',
                    description: 'Quotation analysis, supplier rankings',
                    suggestedVisuals: [
                        'Add 5 Card visuals for KPIs at top',
                        'Add Funnel chart for Quotation Status',
                        'Add Bar chart for Top Suppliers by Value',
                        'Add Donut chart for Quotations by Entity',
                        'Add Table for Quotation Details'
                    ],
                    fields: ['QuotationID', 'Status', 'ValueUSD', 'SupplierCode', 'Entity', 'Discipline']
                }},
                spend: {{
                    name: 'Global Spend Analysis',
                    description: 'PO spend trends, entity breakdown',
                    suggestedVisuals: [
                        'Add 6 Card visuals for spend KPIs',
                        'Add Line chart for Monthly Spend Trend',
                        'Add Donut chart for Spend by Entity',
                        'Add Bar charts for Spend by Category and Supplier'
                    ],
                    fields: ['PONumber', 'POAmount', 'SupplierCode', 'EntityCode', 'MaterialCategory']
                }},
                disciplines: {{
                    name: 'Disciplines Consolidated',
                    description: 'Quote vs Order by discipline',
                    suggestedVisuals: [
                        'Add 5 Card visuals for discipline KPIs',
                        'Add Clustered Bar for Quote vs Order Amount',
                        'Add Clustered Bar for Quote vs PO Count',
                        'Add Table for Discipline Summary'
                    ],
                    fields: ['DisciplineName', 'QuotationCount', 'TotalQuotedAmount', 'POCount', 'TotalOrderAmount']
                }}
            }};
            
            const template = templates[templateName];
            if (template) {{
                let instructions = template.name + '\\n\\n';
                instructions += 'Suggested Visuals:\\n';
                template.suggestedVisuals.forEach((v, i) => {{
                    instructions += (i+1) + '. ' + v + '\\n';
                }});
                instructions += '\\nKey Fields: ' + template.fields.join(', ');
                
                alert(instructions);
                updateStatus('Template guide shown - build visuals!', 'info');
            }}
        }}
        
        // Auto-create report on load
        window.onload = function() {{
            updateStatus('Loading Power BI SDK...');
            setTimeout(createReport, 1000);
        }};
    </script>
</body>
</html>'''
    
    return html

def main():
    print("=" * 60)
    print("  MVL SUPPLY INTEL HUB - EMBEDDED REPORT CREATOR")
    print("=" * 60)
    
    print("\n🔑 Getting embed configuration...")
    config = get_embed_config()
    print(f"   Dataset: {config['datasetName']}")
    print(f"   Workspace: {config['workspaceId']}")
    
    print("\n📄 Generating HTML...")
    html = create_embed_html(config)
    
    output_dir = Path(__file__).parent.parent / "powerbi-creator"
    output_dir.mkdir(exist_ok=True)
    
    html_path = output_dir / "index.html"
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"   Saved to: {html_path}")
    
    # Also save config for debugging
    config_path = output_dir / "config.json"
    with open(config_path, 'w') as f:
        # Don't save the token in plain text
        safe_config = {k: (v[:50] + "..." if k == "accessToken" else v) for k, v in config.items()}
        json.dump(safe_config, f, indent=2)
    
    print("\n🌐 Starting local server...")
    print(f"   http://localhost:8089")
    
    # Start server
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(output_dir), **kwargs)
    
    server = HTTPServer(('localhost', 8089), Handler)
    
    # Open browser
    threading.Timer(1.0, lambda: webbrowser.open('http://localhost:8089')).start()
    
    print("\n✅ Server running. Press Ctrl+C to stop.")
    print("=" * 60)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped.")

if __name__ == "__main__":
    main()
