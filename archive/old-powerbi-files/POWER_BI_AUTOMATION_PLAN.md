# MVL Supply Intel Hub - Power BI Automation Implementation Plan

**Decision:** Option 1 (Best) - "Power BI as Code" using PBIP + Git + Copilot Agent + CI/CD

**Date:** February 2, 2026  
**Status:** 🚀 Ready to Implement

---

## Why This Approach

### ✅ Benefits of PBIP + Git + Automation

1. **Version Control** - Every change tracked, reviewable diffs
2. **Copilot-Friendly** - Text files (JSON/DAX) that Copilot can edit
3. **Reproducible** - Builds are deterministic, rollback is trivial
4. **Team Collaboration** - PR reviews, automated checks, parallel work
5. **Zero Manual Work** - Copilot generates everything from specs
6. **CI/CD Pipeline** - Auto-validate, auto-test, auto-deploy
7. **Documentation** - Self-documenting (specs live with code)

### 🎯 What This Enables

- **Copilot generates DAX measures** from YAML specs
- **Copilot creates report pages** matching HTML prototypes
- **GitHub Actions deploys** to Dev/Prod workspaces
- **Automated validation** ensures quality
- **No manual Power BI Desktop work** (except initial template)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SOURCE OF TRUTH                             │
│                         (Git Repository)                             │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  specs/                                                      │    │
│  │  ├── metrics.yml          ← KPI definitions                 │    │
│  │  ├── pages.yml            ← Page layouts & visuals          │    │
│  │  ├── theme.json           ← MVL branding colors/fonts       │    │
│  │  ├── slicers.yml          ← Standard filters                │    │
│  │  └── relationships.yml    ← Model relationships             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  pbip/                    ← Power BI Project Format         │    │
│  │  ├── MVL-SupplyIntelHub.pbip                                │    │
│  │  ├── model/               ← Semantic model files            │    │
│  │  │   ├── model.bim        ← Tabular model (JSON)            │    │
│  │  │   └── dataset.pbit     ← Dataset template                │    │
│  │  └── reports/             ← Report definitions              │    │
│  │      ├── supplier-marketplace.json                          │    │
│  │      ├── global-spend-analysis.json                         │    │
│  │      └── disciplines-consolidated.json                      │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ↓ Copilot Agent (PR-based workflow)
                         │
┌────────────────────────┴────────────────────────────────────────────┐
│                    AUTOMATION LAYER                                  │
│                   (GitHub Actions)                                   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  .github/workflows/                                           │  │
│  │  ├── validate.yml        ← On PR: Lint, validate, check      │  │
│  │  ├── deploy-dev.yml      ← On merge: Deploy to Dev workspace │  │
│  │  └── deploy-prod.yml     ← On tag: Deploy to Prod workspace  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  scripts/automation/                                          │  │
│  │  ├── generate_pbip.py    ← Specs → PBIP generator            │  │
│  │  ├── validate_model.py   ← Model validation                  │  │
│  │  ├── deploy_to_powerbi.py ← REST API deployment              │  │
│  │  └── sync_health_check.py ← Data quality monitoring          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ↓ Deploy via Power BI REST API
                         │
┌────────────────────────┴────────────────────────────────────────────┐
│                    POWER BI SERVICE                                  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Dev Workspace                                                │  │
│  │  ├── Dataset: MVL-SupplyIntelHub-Data                        │  │
│  │  ├── Report: Supplier Marketplace (Dev)                      │  │
│  │  ├── Report: Global Spend Analysis (Dev)                     │  │
│  │  └── Report: Disciplines Consolidated (Dev)                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Prod Workspace (on release tag)                              │  │
│  │  ├── Dataset: MVL-SupplyIntelHub-Data                        │  │
│  │  ├── Report: Supplier Marketplace                            │  │
│  │  ├── Report: Global Spend Analysis                           │  │
│  │  └── Report: Disciplines Consolidated                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Convert PBIX → PBIP ✅ Ready to Start

**Goal:** Get existing PBIX into PBIP format

**Steps:**

1. **Install Tabular Editor 3** (supports PBIP)
   - Download: https://tabulareditor.com/
   - Or use Power BI Desktop (March 2023+) with PBIP support

2. **Convert existing PBIX to PBIP**
   ```powershell
   # In Power BI Desktop (if PBIP enabled)
   # File → Save As → Power BI Project (.pbip)
   
   # Or use pbi-tools
   pbi-tools extract scripts/MVL-SupplyIntelHub-Dashboard.pbix -outPath pbip/MVL-SupplyIntelHub
   ```

3. **Commit PBIP to Git**
   ```bash
   git add pbip/
   git commit -m "feat: Convert to PBIP format for automation"
   ```

**Deliverables:**
- ✅ `pbip/` folder with model and report JSON files
- ✅ `.gitignore` updated for Power BI artifacts
- ✅ README in `pbip/` explaining structure

**Time Estimate:** 2 hours

---

### Phase 2: Create Specification Files ✅ Ready to Start

**Goal:** Define KPIs, pages, and visuals as declarative specs

**Steps:**

1. **Create `specs/metrics.yml`** - All KPIs and measures
2. **Create `specs/pages.yml`** - Report pages and layouts
3. **Create `specs/theme.json`** - MVL branding
4. **Create `specs/slicers.yml`** - Standard filters
5. **Create `specs/relationships.yml`** - Model relationships

**Example: `specs/metrics.yml`**
```yaml
metrics:
  - name: TotalQuotations
    display_name: Total Quotations
    description: Count of all quotation records
    table: Quotations
    dax: |
      TotalQuotations = 
      COUNTROWS('Quotations')
    format: "#,##0"
    folder: "Key Metrics"
    
  - name: WinRate
    display_name: Win Rate
    description: Percentage of quotations converted to orders
    table: Quotations
    dax: |
      WinRate = 
      DIVIDE(
          CALCULATE(COUNTROWS('Quotations'), 'Quotations'[Status] = "Order"),
          COUNTROWS('Quotations'),
          0
      )
    format: "0.0%"
    folder: "Key Metrics"
```

**Deliverables:**
- ✅ All metrics from HTML prototypes captured
- ✅ All page layouts defined
- ✅ Theme matching v3 designs
- ✅ Standard slicers documented

**Time Estimate:** 4 hours

---

### Phase 3: Build PBIP Generator Scripts 🔄 In Progress

**Goal:** Automate PBIP generation from specs

**Scripts to Create:**

1. **`scripts/automation/generate_pbip.py`**
   - Reads specs/*.yml
   - Generates model.bim (measures, relationships)
   - Generates report JSON files
   - Validates output

2. **`scripts/automation/validate_model.py`**
   - DAX syntax validation
   - Naming convention checks
   - Required measures exist
   - No orphaned references

3. **`scripts/automation/deploy_to_powerbi.py`**
   - Authenticates with Azure AD
   - Uploads PBIP to workspace
   - Triggers refresh
   - Configures permissions

**Deliverables:**
- ✅ Specs → PBIP transformation working
- ✅ Validation passing
- ✅ Local testing successful

**Time Estimate:** 8 hours

---

### Phase 4: Set Up GitHub Actions CI/CD 🔄 In Progress

**Goal:** Automated validation and deployment

**Workflows to Create:**

#### 1. `.github/workflows/validate.yml` (On Pull Request)

```yaml
name: Validate Power BI Project

on:
  pull_request:
    paths:
      - 'specs/**'
      - 'pbip/**'
      - 'scripts/automation/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install pyyaml jsonschema msal requests
      
      - name: Validate specs
        run: python scripts/automation/validate_specs.py
      
      - name: Generate PBIP
        run: python scripts/automation/generate_pbip.py --validate-only
      
      - name: Check DAX syntax
        run: python scripts/automation/validate_model.py
      
      - name: Naming conventions
        run: python scripts/automation/check_naming.py
      
      - name: Security scan
        uses: trufflesecurity/trufflehog@main
      
      - name: Post PR comment
        if: always()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Validation passed! Ready to deploy.'
            })
```

#### 2. `.github/workflows/deploy-dev.yml` (On Merge to Main)

```yaml
name: Deploy to Dev Workspace

on:
  push:
    branches: [main]
    paths:
      - 'specs/**'
      - 'pbip/**'

jobs:
  deploy-dev:
    runs-on: ubuntu-latest
    environment: development
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install pyyaml msal requests
      
      - name: Generate PBIP from specs
        run: python scripts/automation/generate_pbip.py
      
      - name: Deploy to Dev workspace
        env:
          TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
          CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
          WORKSPACE_ID: ${{ secrets.POWERBI_DEV_WORKSPACE_ID }}
        run: python scripts/automation/deploy_to_powerbi.py --env dev
      
      - name: Trigger dataset refresh
        run: python scripts/automation/trigger_refresh.py --env dev
      
      - name: Post deployment summary
        run: |
          echo "✅ Deployed to Dev workspace"
          echo "📊 Reports updated: 3"
          echo "🔗 Workspace: https://app.powerbi.com/groups/${{ secrets.POWERBI_DEV_WORKSPACE_ID }}"
```

#### 3. `.github/workflows/deploy-prod.yml` (On Release Tag)

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Prod workspace
        env:
          WORKSPACE_ID: ${{ secrets.POWERBI_PROD_WORKSPACE_ID }}
        run: python scripts/automation/deploy_to_powerbi.py --env prod
      
      - name: Apply RLS
        run: python scripts/automation/apply_rls.py --env prod
      
      - name: Configure refresh schedule
        run: python scripts/automation/configure_refresh.py --env prod --schedule hourly
```

**Deliverables:**
- ✅ PR validation working
- ✅ Auto-deploy to Dev on merge
- ✅ Tagged release to Prod
- ✅ Secrets configured in GitHub

**Time Estimate:** 6 hours

---

### Phase 5: Enable Copilot Agent Workflows 🤖 Future

**Goal:** Copilot autonomously creates/modifies reports

**Copilot Tasks:**

1. **Generate New KPIs**
   ```
   User: "Add a 'Days to Quote' metric"
   Copilot:
   1. Reads specs/metrics.yml
   2. Adds new metric definition
   3. Generates DAX
   4. Opens PR with changes
   5. CI validates
   6. User reviews diff, merges
   7. Auto-deploys to Dev
   ```

2. **Create New Report Pages**
   ```
   User: "Add a Supplier Performance Scorecard page"
   Copilot:
   1. Reads v3/ HTML prototypes
   2. Adds page spec to specs/pages.yml
   3. Defines visuals, layout, slicers
   4. Opens PR
   5. CI generates PBIP
   6. Deploys on merge
   ```

3. **Apply Theme Changes**
   ```
   User: "Update logo and use new brand colors"
   Copilot:
   1. Updates specs/theme.json
   2. Modifies all report pages
   3. Opens PR with visual diff
   4. Deploys on approval
   ```

4. **Update Documentation**
   ```
   Copilot automatically updates:
   - PROJECT_STATUS_AND_NEXT_STEPS.md
   - KPI glossary
   - User guides
   - Training materials
   ```

**How Copilot Operates:**

- **Reads specs** - Understands current state
- **Generates code** - Creates DAX, JSON, YAML
- **Opens PRs** - Provides reviewable diffs
- **Responds to feedback** - Iterates based on comments
- **Never touches production** - Always goes through CI/CD

**Deliverables:**
- ✅ Copilot prompt templates
- ✅ Agent task definitions
- ✅ Review guidelines
- ✅ Training for team

**Time Estimate:** 4 hours setup

---

### Phase 6: Data Quality Monitoring 📊 Future

**Goal:** Automated data quality checks and notifications

**What to Monitor:**

1. **SharePoint Sync Health**
   - Row counts per list
   - Sync duration
   - Success/failure rate
   - Last sync timestamp

2. **Data Quality Checks**
   - Duplicates detection
   - Missing keys
   - Date gaps
   - Referential integrity
   - Value ranges

3. **Power BI Dataset Health**
   - Refresh success/failure
   - Query performance
   - Model size
   - DAX errors

**Automation:**

```python
# scripts/automation/sync_health_check.py
# Runs every hour via cron or GitHub Actions

def check_sharepoint_health():
    # Count records in each list
    # Compare to expected counts
    # Check for duplicates
    # Validate relationships
    
def check_dataset_health():
    # Query refresh history
    # Check for errors
    # Validate measure calculations
    
def notify_team(issues):
    # Post to Teams channel
    # Send email alerts
    # Create MT_SyncHealth record
```

**Create New SharePoint List:**
- **MT_SyncHealth** - Audit trail of all sync operations

**Deliverables:**
- ✅ Health check scripts
- ✅ Monitoring dashboard (Power BI)
- ✅ Alert notifications
- ✅ MT_SyncHealth list

**Time Estimate:** 6 hours

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Format** | PBIP (Power BI Project) | Text-based, Git-friendly |
| **Model Editing** | Tabular Editor CLI | DAX generation, validation |
| **Build Tool** | Python scripts | Specs → PBIP transformation |
| **Validation** | pbi-tools, custom validators | Quality checks |
| **CI/CD** | GitHub Actions | Automated pipeline |
| **Deployment** | Power BI REST API | Workspace deployment |
| **Version Control** | Git + GitHub | Source of truth |
| **Agent** | GitHub Copilot | Code generation |
| **Specs Format** | YAML + JSON | Human-readable configs |

---

## File Structure (After Implementation)

```
mvl-powerbi-dashboards/
│
├── .github/
│   └── workflows/
│       ├── validate.yml          # PR validation
│       ├── deploy-dev.yml        # Dev deployment
│       └── deploy-prod.yml       # Prod deployment
│
├── pbip/                          # Power BI Project (Git source of truth)
│   ├── MVL-SupplyIntelHub.pbip
│   ├── model/
│   │   ├── model.bim             # Semantic model (JSON)
│   │   ├── relationships.json
│   │   ├── measures/             # DAX measures (separate files)
│   │   │   ├── key-metrics.dax
│   │   │   ├── time-intelligence.dax
│   │   │   └── supplier-scores.dax
│   │   └── dataset.pbit
│   └── reports/
│       ├── supplier-marketplace.json
│       ├── global-spend-analysis.json
│       └── disciplines-consolidated.json
│
├── specs/                         # Declarative specifications
│   ├── metrics.yml               # All KPIs and measures
│   ├── pages.yml                 # Report pages and layouts
│   ├── theme.json                # MVL branding
│   ├── slicers.yml               # Standard filters
│   ├── relationships.yml         # Model relationships
│   └── rls.yml                   # Row-level security
│
├── scripts/
│   ├── automation/               # Build & deployment scripts
│   │   ├── generate_pbip.py     # Specs → PBIP
│   │   ├── validate_model.py    # Model validation
│   │   ├── validate_specs.py    # Spec validation
│   │   ├── check_naming.py      # Naming conventions
│   │   ├── deploy_to_powerbi.py # REST API deployment
│   │   ├── trigger_refresh.py   # Dataset refresh
│   │   ├── apply_rls.py         # Security config
│   │   ├── sync_health_check.py # Data quality
│   │   └── configure_refresh.py # Refresh schedule
│   │
│   └── (existing scripts remain)
│
├── docs/
│   ├── POWER_BI_AUTOMATION_PLAN.md   # This file
│   ├── PBIP_STRUCTURE.md             # PBIP format guide
│   ├── COPILOT_WORKFLOWS.md          # Agent task examples
│   └── KPI_GLOSSARY.md               # Measure definitions
│
├── v3/                           # HTML prototypes (design reference)
│
├── .gitignore
├── PROJECT_STATUS_AND_NEXT_STEPS.md
└── README.md
```

---

## GitHub Secrets to Configure

Add these to GitHub Repository Settings → Secrets:

```
AZURE_TENANT_ID=416328e6-260f-438f-bf3c-9c4f15b6a1ca
AZURE_CLIENT_ID=1b9540e1-6c1e-4214-8d97-6116394ef72c
AZURE_CLIENT_SECRET=cZ28Q~TRKFUzdsnK459ud.tV3Xh05hJGuvl0NcK4
POWERBI_DEV_WORKSPACE_ID=4913fadb-9d03-4742-9e8c-39412a64a93f
POWERBI_PROD_WORKSPACE_ID=(create separate prod workspace)
POWERBI_DATASET_ID=c725ca87-7e4b-4a83-819c-55b1bdcbceeb
```

---

## Typical Workflow (Once Implemented)

### Scenario: Add a new KPI "Avg Quote Cycle Time"

**Traditional (Manual) Way:**
1. Open Power BI Desktop
2. Write DAX measure
3. Add to report
4. Format visual
5. Test
6. Publish
7. Document separately
**Time: 30-45 minutes**

**Automated Way with Copilot:**
```
User → GitHub Issue: "Add Avg Quote Cycle Time metric"
  ↓
Copilot Agent:
  1. Reads specs/metrics.yml
  2. Adds new metric definition:
     ```yaml
     - name: AvgQuoteCycleTime
       display_name: Avg Quote Cycle Time
       description: Average days from quote to order
       dax: |
         AvgQuoteCycleTime = 
         AVERAGEX(
             FILTER('Quotations', 'Quotations'[Status] = "Order"),
             DATEDIFF(
                 'Quotations'[CreatedDate],
                 'Quotations'[ConvertedDate],
                 DAY
             )
         )
       format: "0.0"
     ```
  3. Adds to supplier-marketplace page in specs/pages.yml
  4. Updates KPI_GLOSSARY.md
  5. Opens PR with complete changes
  ↓
GitHub Actions (on PR):
  - Validates YAML syntax ✅
  - Generates PBIP ✅
  - Validates DAX ✅
  - Checks naming ✅
  - Posts PR comment with preview
  ↓
Human reviews diff → Approves → Merges
  ↓
GitHub Actions (on merge):
  - Generates final PBIP
  - Deploys to Dev workspace
  - Triggers refresh
  - Posts deployment summary
  ↓
View in Power BI: https://app.powerbi.com/...
```
**Time: 5 minutes + 2 minutes CI/CD = 7 minutes total**

---

## Success Criteria

### Phase 1-2 Complete When:
- ✅ PBIP files in Git
- ✅ All specs files created
- ✅ Specs match v3 prototypes 100%

### Phase 3-4 Complete When:
- ✅ Specs → PBIP generation working
- ✅ All 3 reports building automatically
- ✅ CI/CD deploying successfully
- ✅ Dev workspace updating on merge

### Phase 5-6 Complete When:
- ✅ Copilot can add/modify measures via PR
- ✅ Copilot can create pages via PR
- ✅ Data quality monitoring active
- ✅ No manual Power BI Desktop needed

### Full Automation Achieved When:
- ✅ Zero manual report creation
- ✅ All changes via Git PRs
- ✅ Copilot handles 90%+ of requests
- ✅ Human only reviews/approves
- ✅ Production deploys with confidence

---

## Rollout Plan

### Week 1: Foundation
- ✅ Convert PBIX → PBIP
- ✅ Create all specs files
- ✅ Set up repo structure
- ✅ Document everything

### Week 2: Automation
- ✅ Build generation scripts
- ✅ Create validation tools
- ✅ Set up GitHub Actions
- ✅ Test end-to-end pipeline

### Week 3: Production
- ✅ Create prod workspace
- ✅ Deploy first automated report
- ✅ Configure refresh schedule
- ✅ Enable monitoring

### Week 4: Copilot Integration
- ✅ Set up agent workflows
- ✅ Create prompt templates
- ✅ Train team on PR process
- ✅ First Copilot-generated change

---

## Cost Considerations

**Free/Included:**
- GitHub Actions (2,000 minutes/month free)
- Tabular Editor Community Edition
- Python scripts (free)
- Git/GitHub (free for public repos)

**Paid (if needed):**
- Tabular Editor Business Edition ($495/year) - for advanced features
- GitHub Actions (beyond free tier) - ~$0.008/minute
- Power BI Premium (if not already) - for automated refresh

**Expected Monthly Cost:** $0 - $50 (mostly free tier sufficient)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **PBIP format changes** | Pin to specific schema version, test before upgrading |
| **Copilot generates bad DAX** | Validation in CI blocks bad code, human reviews all PRs |
| **Deployment fails** | Rollback to previous Git tag, redeploy |
| **Permissions issues** | Test in Dev first, separate Dev/Prod credentials |
| **Data quality issues** | Monitoring alerts, automated checks before publish |

---

## Next Immediate Actions

### TODAY (Feb 2, 2026):

1. **Install Tools**
   ```powershell
   # Install pbi-tools
   dotnet tool install -g pbi-tools
   
   # Install Tabular Editor (optional)
   # Download from https://tabulareditor.com/
   ```

2. **Convert to PBIP**
   ```powershell
   cd g:\Rita\mvl-powerbi-dashboards
   pbi-tools extract scripts/MVL-SupplyIntelHub-Dashboard.pbix -outPath pbip/MVL-SupplyIntelHub
   ```

3. **Create specs/ folder structure**
   ```powershell
   mkdir specs
   ```

4. **Start with metrics.yml** (I'll generate this for you)

5. **Commit to Git**
   ```bash
   git add pbip/ specs/
   git commit -m "feat: Initialize PBIP automation infrastructure"
   git push origin main
   ```

---

## Decision Record

**Decision:** Adopt PBIP + Git + Copilot Agent + CI/CD approach  
**Date:** February 2, 2026  
**Rationale:** 
- Enables full automation
- Copilot-friendly text files
- Version control + rollback
- Team collaboration via PRs
- Industry best practice

**Alternative Considered:** Manual PBIX editing  
**Why Rejected:** Doesn't scale, not automatable, no version control

---

## Support & References

**Documentation:**
- [Power BI Project Format (PBIP)](https://learn.microsoft.com/en-us/power-bi/developer/projects/)
- [pbi-tools](https://pbi.tools/)
- [Tabular Editor](https://docs.tabulareditor.com/)
- [Power BI REST API](https://learn.microsoft.com/en-us/rest/api/power-bi/)

**Community:**
- [Power BI Community](https://community.powerbi.com/)
- [GitHub Actions Marketplace](https://github.com/marketplace)

---

**🚀 Ready to start? Let's build the specs files and automation scripts!**
