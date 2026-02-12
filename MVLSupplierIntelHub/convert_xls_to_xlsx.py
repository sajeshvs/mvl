import pandas as pd
import os
import win32com.client
import sys

def convert_xls_to_xlsx_via_excel(xls_path, xlsx_path):
    """Convert .xls to .xlsx using Excel COM automation"""
    excel = None
    try:
        excel = win32com.client.Dispatch("Excel.Application")
        excel.Visible = False
        excel.DisplayAlerts = False
        
        # Open the file
        workbook = excel.Workbooks.Open(os.path.abspath(xls_path))
        
        # Save as .xlsx (51 = xlOpenXMLWorkbook)
        workbook.SaveAs(os.path.abspath(xlsx_path), FileFormat=51)
        workbook.Close()
        
        print(f"✓ Converted: {os.path.basename(xls_path)} -> {os.path.basename(xlsx_path)}")
        return True
    except Exception as e:
        print(f"✗ Error converting {os.path.basename(xls_path)}: {e}")
        return False
    finally:
        if excel:
            excel.Quit()

# File paths
base_path = r"g:\Rita\MVLSupplierIntelHub\MVL Supply Chain Intel Hub - Data"
po_file = os.path.join(base_path, "PO_List_Jan-23-2026.xls")
po_file_xlsx = os.path.join(base_path, "PO_List_Jan-23-2026.xlsx")
quotation_folder = os.path.join(base_path, "Quotation Reports")

print("=" * 80)
print("CONVERTING .XLS FILES TO .XLSX FORMAT")
print("=" * 80)

# Convert PO file
print("\nConverting PO List...")
if convert_xls_to_xlsx_via_excel(po_file, po_file_xlsx):
    print("PO List conversion successful!")

# Convert quotation files
print("\nConverting Quotation Reports...")
quotation_files = [f for f in os.listdir(quotation_folder) if f.endswith('.xls')]
for qfile in quotation_files:
    xls_path = os.path.join(quotation_folder, qfile)
    xlsx_path = os.path.join(quotation_folder, qfile.replace('.xls', '.xlsx'))
    convert_xls_to_xlsx_via_excel(xls_path, xlsx_path)

print("\n" + "=" * 80)
print("CONVERSION COMPLETE!")
print("=" * 80)
