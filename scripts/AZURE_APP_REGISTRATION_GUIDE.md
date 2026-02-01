# MVL Supply Intel Hub - Azure AD App Registration Guide

## App Registration Details

| Property                    | Value                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **App Name**                | `MVL-SupplyIntelHub-Integration`                                                                                                      |
| **Display Name**            | MVL Supply Intel Hub Integration                                                                                                      |
| **Description**             | Enterprise integration app for MVL Supply Intel Hub - Manages Power BI, SharePoint, Teams, Entra ID, and other Microsoft 365 services |
| **Supported Account Types** | Accounts in this organizational directory only (Single tenant)                                                                        |
| **Redirect URI**            | `http://localhost:8080/callback` (for testing)                                                                                        |

---

## API Permissions to Add

### 1. Microsoft Graph API (Application Permissions)

These are the permissions for background/daemon operations (no user sign-in required):

#### User & Directory Management

| Permission                  | Description                             | Admin Consent |
| --------------------------- | --------------------------------------- | ------------- |
| `User.Read.All`             | Read all users' full profiles           | ✅ Required   |
| `User.ReadWrite.All`        | Read and write all users' full profiles | ✅ Required   |
| `Directory.Read.All`        | Read directory data                     | ✅ Required   |
| `Directory.ReadWrite.All`   | Read and write directory data           | ✅ Required   |
| `Group.Read.All`            | Read all groups                         | ✅ Required   |
| `Group.ReadWrite.All`       | Read and write all groups               | ✅ Required   |
| `GroupMember.Read.All`      | Read all group memberships              | ✅ Required   |
| `GroupMember.ReadWrite.All` | Read and write all group memberships    | ✅ Required   |

#### SharePoint & OneDrive

| Permission              | Description                                  | Admin Consent |
| ----------------------- | -------------------------------------------- | ------------- |
| `Sites.Read.All`        | Read items in all site collections           | ✅ Required   |
| `Sites.ReadWrite.All`   | Read and write items in all site collections | ✅ Required   |
| `Sites.FullControl.All` | Have full control of all site collections    | ✅ Required   |
| `Sites.Manage.All`      | Create, edit, and delete items and lists     | ✅ Required   |
| `Files.Read.All`        | Read files in all site collections           | ✅ Required   |
| `Files.ReadWrite.All`   | Read and write files in all site collections | ✅ Required   |

#### Microsoft Teams

| Permission                   | Description                                     | Admin Consent |
| ---------------------------- | ----------------------------------------------- | ------------- |
| `Team.ReadBasic.All`         | Read the names and descriptions of all teams    | ✅ Required   |
| `Team.Create`                | Create teams                                    | ✅ Required   |
| `TeamSettings.Read.All`      | Read all teams' settings                        | ✅ Required   |
| `TeamSettings.ReadWrite.All` | Read and change all teams' settings             | ✅ Required   |
| `TeamMember.Read.All`        | Read the members of all teams                   | ✅ Required   |
| `TeamMember.ReadWrite.All`   | Add and remove members from all teams           | ✅ Required   |
| `Channel.ReadBasic.All`      | Read the names and descriptions of all channels | ✅ Required   |
| `Channel.Create`             | Create channels                                 | ✅ Required   |
| `ChannelMessage.Read.All`    | Read all channel messages                       | ✅ Required   |
| `ChannelMessage.Send`        | Send channel messages                           | ✅ Required   |
| `Chat.Read.All`              | Read all chat messages                          | ✅ Required   |
| `Chat.ReadWrite.All`         | Read and write all chat messages                | ✅ Required   |
| `TeamsActivity.Send`         | Send activity feed notifications                | ✅ Required   |

#### Mail & Calendar

| Permission            | Description                               | Admin Consent |
| --------------------- | ----------------------------------------- | ------------- |
| `Mail.Read`           | Read mail in all mailboxes                | ✅ Required   |
| `Mail.ReadWrite`      | Read and write mail in all mailboxes      | ✅ Required   |
| `Mail.Send`           | Send mail as any user                     | ✅ Required   |
| `Calendars.Read`      | Read calendars in all mailboxes           | ✅ Required   |
| `Calendars.ReadWrite` | Read and write calendars in all mailboxes | ✅ Required   |

#### Applications & Service Principals

| Permission                        | Description                     | Admin Consent |
| --------------------------------- | ------------------------------- | ------------- |
| `Application.Read.All`            | Read all applications           | ✅ Required   |
| `Application.ReadWrite.All`       | Read and write all applications | ✅ Required   |
| `AppRoleAssignment.ReadWrite.All` | Manage app permission grants    | ✅ Required   |

#### Reports & Analytics

| Permission          | Description             | Admin Consent |
| ------------------- | ----------------------- | ------------- |
| `Reports.Read.All`  | Read all usage reports  | ✅ Required   |
| `AuditLog.Read.All` | Read all audit log data | ✅ Required   |

#### Security & Compliance

| Permission                     | Description                     | Admin Consent |
| ------------------------------ | ------------------------------- | ------------- |
| `SecurityEvents.Read.All`      | Read security events            | ✅ Required   |
| `SecurityEvents.ReadWrite.All` | Read and update security events | ✅ Required   |

---

### 2. Power BI Service API (Application Permissions)

| Permission                     | Description                          | Admin Consent |
| ------------------------------ | ------------------------------------ | ------------- |
| `Tenant.Read.All`              | View all content in tenant           | ✅ Required   |
| `Tenant.ReadWrite.All`         | Read and write all content in tenant | ✅ Required   |
| `Workspace.Read.All`           | View all workspaces                  | ✅ Required   |
| `Workspace.ReadWrite.All`      | Read and write all workspaces        | ✅ Required   |
| `Dashboard.Read.All`           | View all dashboards                  | ✅ Required   |
| `Dashboard.ReadWrite.All`      | Read and write all dashboards        | ✅ Required   |
| `Report.Read.All`              | View all reports                     | ✅ Required   |
| `Report.ReadWrite.All`         | Read and write all reports           | ✅ Required   |
| `Dataset.Read.All`             | View all datasets                    | ✅ Required   |
| `Dataset.ReadWrite.All`        | Read and write all datasets          | ✅ Required   |
| `Content.Create`               | Create content                       | ✅ Required   |
| `Dataflow.Read.All`            | View all dataflows                   | ✅ Required   |
| `Dataflow.ReadWrite.All`       | Read and write all dataflows         | ✅ Required   |
| `Gateway.Read.All`             | View all gateways                    | ✅ Required   |
| `Gateway.ReadWrite.All`        | Read and write all gateways          | ✅ Required   |
| `StorageAccount.Read.All`      | View all storage accounts            | ✅ Required   |
| `StorageAccount.ReadWrite.All` | Read and write all storage accounts  | ✅ Required   |
| `Capacity.Read.All`            | View all capacities                  | ✅ Required   |
| `Capacity.ReadWrite.All`       | Read and write all capacities        | ✅ Required   |

---

### 3. SharePoint API (Application Permissions)

| Permission                | Description                                  | Admin Consent |
| ------------------------- | -------------------------------------------- | ------------- |
| `Sites.FullControl.All`   | Have full control of all site collections    | ✅ Required   |
| `Sites.Read.All`          | Read items in all site collections           | ✅ Required   |
| `Sites.ReadWrite.All`     | Read and write items in all site collections | ✅ Required   |
| `TermStore.Read.All`      | Read managed metadata                        | ✅ Required   |
| `TermStore.ReadWrite.All` | Read and write managed metadata              | ✅ Required   |
| `User.Read.All`           | Read user profiles                           | ✅ Required   |

---

### 4. Azure Service Management API

| Permission           | Description                                          | Admin Consent |
| -------------------- | ---------------------------------------------------- | ------------- |
| `user_impersonation` | Access Azure Service Management as organization user | ✅ Required   |

---

### 5. Microsoft Intune API (Optional - for device management)

| Permission                                | Description                                | Admin Consent |
| ----------------------------------------- | ------------------------------------------ | ------------- |
| `DeviceManagementApps.Read.All`           | Read Microsoft Intune apps                 | ✅ Required   |
| `DeviceManagementConfiguration.Read.All`  | Read Microsoft Intune device configuration | ✅ Required   |
| `DeviceManagementManagedDevices.Read.All` | Read Microsoft Intune devices              | ✅ Required   |

---

## Step-by-Step Setup Instructions

### Step 1: Create App Registration

1. Go to **https://portal.azure.com**
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **+ New registration**
4. Fill in:
   - **Name**: `MVL-SupplyIntelHub-Integration`
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web → `http://localhost:8080/callback`
5. Click **Register**

### Step 2: Note Important IDs

After registration, note these values:

- **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Step 3: Create Client Secret

1. In your app → **Certificates & secrets**
2. Click **+ New client secret**
3. Description: `MVL-SupplyIntelHub-Secret`
4. Expires: 24 months (recommended)
5. Click **Add**
6. **IMMEDIATELY COPY** the secret value (shown only once!)

### Step 4: Add API Permissions

1. Go to **API permissions** → **+ Add a permission**
2. For each API listed above:
   - Select the API (Microsoft Graph, Power BI Service, etc.)
   - Choose **Application permissions**
   - Check the required permissions
   - Click **Add permissions**

### Step 5: Grant Admin Consent

1. After adding all permissions, click **Grant admin consent for [Your Org]**
2. Confirm by clicking **Yes**
3. All permissions should show ✅ green checkmarks

---

## Configuration Values for Scripts

After setup, update your scripts with:

```python
CONFIG = {
    # Azure AD App Registration
    "tenant_id": "YOUR_DIRECTORY_TENANT_ID",
    "client_id": "YOUR_APPLICATION_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET_VALUE",

    # Organization Domain
    "domain": "yourdomain.com",
}
```

---

## Security Best Practices

1. **Principle of Least Privilege**: Only add permissions you actually need
2. **Secret Rotation**: Rotate client secrets every 6-12 months
3. **Audit Logs**: Monitor app usage in Azure AD sign-in logs
4. **Conditional Access**: Consider adding policies for this app
5. **Certificate Authentication**: For production, use certificates instead of secrets

---

## Quick Reference: API Scopes for Token Requests

```python
# Microsoft Graph
graph_scopes = ["https://graph.microsoft.com/.default"]

# Power BI
powerbi_scopes = ["https://analysis.windows.net/powerbi/api/.default"]

# SharePoint (specific site)
sharepoint_scopes = ["https://{tenant}.sharepoint.com/.default"]

# Azure Management
azure_scopes = ["https://management.azure.com/.default"]
```

---

## Troubleshooting

| Issue                                          | Solution                                          |
| ---------------------------------------------- | ------------------------------------------------- |
| "AADSTS65001: User or admin has not consented" | Grant admin consent in Azure portal               |
| "AADSTS7000215: Invalid client secret"         | Check secret hasn't expired, regenerate if needed |
| "AADSTS700016: Application not found"          | Verify client_id is correct                       |
| "Insufficient privileges"                      | Add required API permission and grant consent     |

---

## Related Files

- [graph_permissions_manager.py](graph_permissions_manager.py) - Main permissions script
- Keep this file updated when adding new integrations!
