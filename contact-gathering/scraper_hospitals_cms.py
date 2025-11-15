"""
RECA Hospital Contact Scraper - CMS Hospital Compare API
Uses the official CMS (Medicare) API to get hospital contact information
Free, reliable, maintained by the government
"""

import requests
import pandas as pd
import json
from datetime import datetime

class HospitalContactScraper:
    def __init__(self):
        # RECA affected counties
        self.target_states = ['UT', 'NV', 'AZ', 'NM', 'ID']
        
        # CMS API endpoint (updated URL)
        self.api_base = "https://data.cms.gov/provider-data/api/1/datastore/query"
        self.dataset_id = "xubh-q36u"  # Hospital General Information dataset
        
        self.hospitals = []
        
    def fetch_hospitals_by_state(self, state_code):
        """Fetch all hospitals in a given state"""
        print(f"Fetching hospitals in {state_code}...")
        
        url = f"{self.api_base}/{self.dataset_id}/0"
        
        params = {
            'conditions': [
                {
                    'property': 'state',
                    'value': state_code,
                    'operator': '='
                }
            ],
            'limit': 1000,
            'offset': 0
        }
        
        try:
            response = requests.post(url, json=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                for hospital in data.get('results', []):
                    contact = {
                        'State': state_code,
                        'County': hospital.get('county_name', ''),
                        'InstitutionName': hospital.get('facility_name', ''),
                        'InstitutionType': 'Hospital',
                        'RecordTypes': 'Medical Records, Pathology Reports, Operative Notes',
                        'Status': 'Active' if hospital.get('hospital_overall_rating') else 'Unknown',
                        'Address': f"{hospital.get('address', '')} {hospital.get('city', '')}, {state_code} {hospital.get('zip_code', '')}",
                        'Phone': hospital.get('phone_number', ''),
                        'Website': hospital.get('hospital_website', ''),
                        'HospitalType': hospital.get('hospital_type', ''),
                        'Ownership': hospital.get('hospital_ownership', ''),
                        'EmergencyServices': hospital.get('emergency_services', ''),
                        'MedicareProvider': hospital.get('provider_id', ''),
                        'Source': 'CMS Hospital Compare API',
                        'SourceURL': f"https://data.cms.gov/provider-data/dataset/{self.dataset_id}",
                        'ExtractedDate': datetime.now().strftime('%Y-%m-%d')
                    }
                    
                    self.hospitals.append(contact)
                
                print(f"  Found {len(data.get('results', []))} hospitals in {state_code}")
            else:
                print(f"  Error: API returned status {response.status_code}")
                
        except Exception as e:
            print(f"  Error fetching {state_code}: {str(e)}")
    
    def fetch_all_states(self):
        """Fetch hospitals from all RECA states"""
        for state in self.target_states:
            self.fetch_hospitals_by_state(state)
    
    def save_to_csv(self, filename='reca_hospitals_contacts.csv'):
        """Save results to CSV"""
        if not self.hospitals:
            print("No hospitals to save!")
            return
        
        df = pd.DataFrame(self.hospitals)
        df.to_csv(filename, index=False)
        print(f"\nSaved {len(self.hospitals)} hospitals to {filename}")
        
        # Print summary
        print("\n--- Summary ---")
        print(df.groupby('State')['InstitutionName'].count())
    
    def save_to_json(self, filename='reca_hospitals_contacts.json'):
        """Save results to JSON"""
        with open(filename, 'w') as f:
            json.dump(self.hospitals, f, indent=2)
        print(f"Saved to {filename}")


if __name__ == "__main__":
    print("=== RECA Hospital Contact Scraper ===")
    print("Using CMS Hospital Compare API\n")
    
    scraper = HospitalContactScraper()
    scraper.fetch_all_states()
    
    scraper.save_to_csv()
    scraper.save_to_json()
    
    print("\nDone!")
