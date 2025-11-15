"""
RECA Contact Scraper - County Vital Records Offices
Scrapes contact information for county vital records offices in RECA-affected states
States: Utah, Nevada, Arizona, New Mexico, Idaho
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import re
from typing import List, Dict
import json

class CountyContactScraper:
    def __init__(self):
        self.states = {
            'UT': 'Utah',
            'NV': 'Nevada', 
            'AZ': 'Arizona',
            'NM': 'New Mexico',
            'ID': 'Idaho'
        }
        self.contacts = []
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
    def scrape_vitalrecords_office_net(self):
        """Scrape VitalRecordsOffice.net for county contacts"""
        print("Scraping VitalRecordsOffice.net...")
        
        for state_code, state_name in self.states.items():
            print(f"  Processing {state_name}...")
            state_url = f"https://vitalrecordsoffice.net/{state_code.lower()}/"
            
            try:
                response = requests.get(state_url, headers=self.headers, timeout=10)
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find county links
                county_links = soup.find_all('a', href=re.compile(r'/counties/'))
                
                for link in county_links:
                    county_name = link.text.strip()
                    county_url = f"https://vitalrecordsoffice.net{link['href']}"
                    
                    # Get county page
                    time.sleep(0.5)  # Rate limiting
                    county_response = requests.get(county_url, headers=self.headers, timeout=10)
                    county_soup = BeautifulSoup(county_response.content, 'html.parser')
                    
                    # Extract contact info
                    contact_data = {
                        'State': state_name,
                        'StateCode': state_code,
                        'County': county_name,
                        'InstitutionName': f"{county_name} Vital Records Office",
                        'InstitutionType': 'County Office',
                        'RecordTypes': 'Birth Certificate, Death Certificate, Marriage Certificate',
                        'Status': 'Active',
                        'Source': 'VitalRecordsOffice.net',
                        'SourceURL': county_url
                    }
                    
                    # Extract contact details
                    self._extract_contact_details(county_soup, contact_data)
                    self.contacts.append(contact_data)
                    
            except Exception as e:
                print(f"    Error processing {state_name}: {str(e)}")
                continue
    
    def _extract_contact_details(self, soup, contact_data):
        """Extract phone, email, address from page"""
        
        # Phone number
        phone_match = soup.find(string=re.compile(r'\(\d{3}\)\s?\d{3}-\d{4}'))
        if phone_match:
            contact_data['Phone'] = re.search(r'\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}', phone_match).group()
        
        # Email
        email_match = soup.find('a', href=re.compile(r'mailto:'))
        if email_match:
            contact_data['Email'] = email_match['href'].replace('mailto:', '')
        
        # Address (often in <address> tag or specific div)
        address_tag = soup.find('address')
        if address_tag:
            address_text = address_tag.get_text(strip=True, separator=' ')
            contact_data['Address'] = address_text
        
        # Website
        website_link = soup.find('a', string=re.compile(r'Official Website|Visit Website', re.I))
        if website_link and website_link.get('href'):
            contact_data['Website'] = website_link['href']
    
    def scrape_cdc_vital_records(self):
        """Scrape CDC 'Where to Write for Vital Records' directory"""
        print("Scraping CDC Vital Records directory...")
        
        cdc_url = "https://www.cdc.gov/nchs/w2w/index.htm"
        
        try:
            response = requests.get(cdc_url, headers=self.headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # CDC has state-specific pages
