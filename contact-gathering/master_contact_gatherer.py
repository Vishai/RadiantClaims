"""
Master Contact Gathering Script
Runs all scrapers and consolidates results into a single database
"""

import subprocess
import pandas as pd
import json
from datetime import datetime
import os

class MasterContactGatherer:
    def __init__(self):
        self.output_dir = 'output'
        self.all_contacts = []
        
        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)
    
    def run_hospital_scraper(self):
        """Run CMS hospital scraper"""
        print("\n" + "="*60)
        print("STEP 1: Gathering Hospital Contacts (CMS API)")
        print("="*60)
        
        try:
            result = subprocess.run(
                ['python3', 'scraper_hospitals_cms.py'],
                capture_output=True,
                text=True,
                timeout=300
            )
            print(result.stdout)
            
            # Load results
            if os.path.exists('reca_hospitals_contacts.csv'):
                hospitals = pd.read_csv('reca_hospitals_contacts.csv')
                self.all_contacts.extend(hospitals.to_dict('records'))
                print(f"✓ Loaded {len(hospitals)} hospital contacts")
