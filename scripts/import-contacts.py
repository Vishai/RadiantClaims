#!/usr/bin/env python3
"""
Import institutional contacts into RadiantClaims database

This script takes CSV files from the contact-gathering scripts
and imports them into the PostgreSQL database via the Next.js API
"""

import os
import sys
import csv
import json
import requests
from pathlib import Path

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")  # Set this to authenticate as admin

# Resource type mapping (CSV value -> Prisma enum)
RESOURCE_TYPE_MAP = {
    "vital_records": "VITAL_RECORDS",
    "county_clerk": "COUNTY_CLERK",
    "county_recorder": "COUNTY_RECORDER",
    "county_assessor": "COUNTY_ASSESSOR",
    "county_treasurer": "COUNTY_TREASURER",
    "district_court": "DISTRICT_COURT",
    "state_archives": "STATE_ARCHIVES",
    "tax_commission": "TAX_COMMISSION",
    "dmv": "DMV",
    "hospital": "HOSPITAL",
    "cancer_registry": "CANCER_REGISTRY",
    "radiation_control": "RADIATION_CONTROL",
    "school_district": "SCHOOL_DISTRICT",
    "university": "UNIVERSITY",
    "church": "CHURCH",
    "tribal_office": "TRIBAL_OFFICE",
    "tribal_vital_records": "TRIBAL_VITAL_RECORDS",
    "federal_archives": "FEDERAL_ARCHIVES",
    "irs": "IRS",
    "social_security": "SOCIAL_SECURITY",
    "mining_administration": "MINING_ADMINISTRATION",
}


def load_csv(file_path):
    """Load contacts from CSV file"""
    contacts = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            contacts.append(row)
    return contacts


def transform_contact(csv_row):
    """Transform CSV row into API format"""
    # Map resource type
    resource_type_raw = csv_row.get("InstitutionType", "").lower().replace(" ", "_")
    resource_type = RESOURCE_TYPE_MAP.get(
        resource_type_raw, "VITAL_RECORDS"
    )  # Default fallback

    # Parse document types
    doc_types = []
    if csv_row.get("RecordTypes"):
        doc_types = [dt.strip() for dt in csv_row["RecordTypes"].split(",")]

    # Parse what to bring
    what_to_bring = []
    if csv_row.get("WhatToBring"):
        what_to_bring = [item.strip() for item in csv_row["WhatToBring"].split(",")]

    # Parse estimated cost
    estimated_cost = None
    if csv_row.get("EstimatedCost"):
        try:
            cost_str = csv_row["EstimatedCost"].replace("$", "").strip()
            estimated_cost = float(cost_str)
        except ValueError:
            pass

    # Parse processing time
    processing_days = None
    if csv_row.get("ProcessingTimeDays"):
        try:
            processing_days = int(csv_row["ProcessingTimeDays"])
        except ValueError:
            pass

    return {
        "state": csv_row.get("State", "").upper() or csv_row.get("StateCode", "").upper(),
        "county": csv_row.get("County") or None,
        "resourceType": resource_type,
        "name": csv_row.get("InstitutionName") or csv_row.get("Name", ""),
        "department": csv_row.get("Department"),
        "address": csv_row.get("Address"),
        "address2": csv_row.get("Address2"),
        "city": csv_row.get("City"),
        "stateCode": csv_row.get("StateCode", csv_row.get("State", "")).upper(),
        "zipCode": csv_row.get("ZipCode") or csv_row.get("PostalCode"),
        "phone": csv_row.get("Phone"),
        "phoneTollFree": csv_row.get("PhoneTollFree"),
        "fax": csv_row.get("Fax"),
        "website": csv_row.get("Website"),
        "email": csv_row.get("Email"),
        "notes": csv_row.get("Notes"),
        "documentTypesProvided": doc_types,
        "certificationAvailable": csv_row.get("CertificationAvailable", "true").lower() == "true",
        "processingTimeDays": processing_days,
        "specialInstructions": csv_row.get("SpecialInstructions"),
        "isTribal": csv_row.get("IsTribal", "false").lower() == "true",
        "tribalAffiliation": csv_row.get("TribalAffiliation"),
        "purposeDescription": csv_row.get("PurposeDescription"),
        "whatToBring": what_to_bring,
        "appointmentRequired": csv_row.get("AppointmentRequired", "false").lower() == "true",
        "acceptsMailRequests": csv_row.get("AcceptsMailRequests", "true").lower() == "true",
        "acceptsOnlineRequests": csv_row.get("AcceptsOnlineRequests", "false").lower() == "true",
        "estimatedCost": estimated_cost,
    }


def import_to_api(contacts, api_key=None):
    """Import contacts via the Next.js API"""
    url = f"{API_BASE_URL}/api/admin/resources/import"

    headers = {
        "Content-Type": "application/json",
    }

    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    # Note: Without proper authentication, this will fail
    # You need to either:
    # 1. Set up an API key authentication system
    # 2. Use a session token from an admin user
    # 3. Run this script with DATABASE_URL and import directly to DB

    print(f"Importing {len(contacts)} contacts to {url}...")

    response = requests.post(
        url,
        headers=headers,
        json={"resources": contacts},
    )

    if response.status_code == 200:
        result = response.json()
        print(f"✅ Success: {result.get('message')}")
        print(f"   Created: {result['results']['created']}")
        print(f"   Updated: {result['results']['updated']}")
        print(f"   Skipped: {result['results']['skipped']}")
        if result['results']['errors']:
            print(f"   Errors: {len(result['results']['errors'])}")
            for error in result['results']['errors'][:5]:  # Show first 5 errors
                print(f"     - {error}")
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"   {response.text}")
        return False

    return True


def import_directly_to_db(contacts):
    """
    Alternative: Import directly to PostgreSQL using Prisma
    This bypasses the API and requires DATABASE_URL to be set
    """
    print("Direct database import not implemented yet.")
    print("You can:")
    print("1. Use the API endpoint (requires authentication)")
    print("2. Manually import the JSON output into your database")
    print("3. Extend this script to use Prisma Client Python")

    # For now, just output the JSON
    output_file = "contacts_import.json"
    with open(output_file, "w") as f:
        json.dump(contacts, f, indent=2)
    print(f"\n📄 Contacts saved to {output_file}")
    print("You can manually review and import this file")


def main():
    if len(sys.argv) < 2:
        print("Usage: python import-contacts.py <csv_file> [--direct-db]")
        print("\nExample:")
        print("  python import-contacts.py ../contact-gathering/output/hospitals.csv")
        print("  python import-contacts.py contacts.csv --direct-db")
        sys.exit(1)

    csv_file = sys.argv[1]
    use_direct_db = "--direct-db" in sys.argv

    if not os.path.exists(csv_file):
        print(f"❌ Error: File not found: {csv_file}")
        sys.exit(1)

    print(f"📂 Loading contacts from: {csv_file}")
    csv_data = load_csv(csv_file)
    print(f"   Found {len(csv_data)} rows")

    print(f"🔄 Transforming data...")
    contacts = [transform_contact(row) for row in csv_data]
    print(f"   Transformed {len(contacts)} contacts")

    if use_direct_db:
        import_directly_to_db(contacts)
    else:
        if not ADMIN_API_KEY:
            print("\n⚠️  Warning: ADMIN_API_KEY not set")
            print("Set it with: export ADMIN_API_KEY='your-api-key'")
            print("Or use --direct-db to save as JSON for manual import")

            # Save as JSON for manual import
            import_directly_to_db(contacts)
        else:
            import_to_api(contacts, ADMIN_API_KEY)


if __name__ == "__main__":
    main()
