"""
RadiantClaims Contact Agent - Minimal Working Example
Uses OpenAI GPT-4 with function calling + Airtable integration

This is a simple proof-of-concept that you can run locally to test the concept.
"""

import os
import json
from openai import OpenAI
from pyairtable import Table

# Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
AIRTABLE_API_KEY = os.getenv('AIRTABLE_API_KEY')
AIRTABLE_BASE_ID = os.getenv('AIRTABLE_BASE_ID')

client = OpenAI(api_key=OPENAI_API_KEY)
contacts_table = Table(AIRTABLE_API_KEY, AIRTABLE_BASE_ID, 'ResourceContacts')


def search_contacts(state=None, county=None, institution_type=None, institution_name=None):
    """Search ResourceContacts table in Airtable"""
    
    # Build Airtable formula
    conditions = []
    if state:
        conditions.append(f"{{State}}='{state}'")
    if county:
        conditions.append(f"{{County}}='{county}'")
    if institution_type:
        conditions.append(f"{{InstitutionType}}='{institution_type}'")
    if institution_name:
        conditions.append(f"FIND(LOWER('{institution_name.lower()}'), LOWER({{InstitutionName}}))")
    
    if conditions:
        formula = f"AND({', '.join(conditions)})"
        results = contacts_table.all(formula=formula)
    else:
        results = []
    
    # Format results
    formatted = []
    for record in results[:5]:  # Limit to 5 results
        fields = record['fields']
        formatted.append({
            'institution_name': fields.get('InstitutionName'),
            'institution_type': fields.get('InstitutionType'),
            'address': fields.get('Address'),
            'phone': fields.get('Phone'),
            'email': fields.get('Email'),
            'website': fields.get('Website'),
            'request_method': fields.get('RequestMethod'),
            'notes': fields.get('Notes'),
            'record_types': fields.get('RecordTypes')
        })
    
    return formatted


def web_search_contact(institution_name, location):
    """Fallback web search (placeholder - integrate with real search API)"""
    # In production, use SerpAPI, Google Custom Search, or similar
    return {
        'message': f'Web search for "{institution_name}" in {location} would happen here.',
        'suggestion': 'Integrate with SerpAPI or Google Custom Search API'
    }


# Define available functions for GPT-4
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_contacts",
            "description": "Search the ResourceContacts database for institutions that hold RECA-relevant records (1951-1962). Use this FIRST before web search.",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "string",
                        "description": "State abbreviation (UT, NV, AZ, NM, ID)"
                    },
                    "county": {
                        "type": "string",
                        "description": "County name (e.g., Washington, Clark)"
                    },
                    "institution_type": {
                        "type": "string",
                        "enum": ["County Office", "Hospital", "School", "Church", "Employer", "Utility"],
                        "description": "Type of institution"
                    },
                    "institution_name": {
                        "type": "string",
                        "description": "Name of specific institution (partial match OK)"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search_contact",
            "description": "Search the web for institution contact info not found in database. Use ONLY after search_contacts returns no results.",
            "parameters": {
                "type": "object",
                "properties": {
                    "institution_name": {
                        "type": "string",
                        "description": "Name of institution to search for"
                    },
                    "location": {
                        "type": "string",
                        "description": "City and state (e.g., 'Las Vegas, Nevada')"
                    }
                },
                "required": ["institution_name", "location"]
            }
        }
    }
]


# System prompt
SYSTEM_PROMPT = """You are a helpful RECA claims assistant for RadiantClaims.

Your job is to help claimants find institutions that hold their records from 1951-1962.

SEARCH PRIORITY:
1. ALWAYS search internal database (search_contacts) FIRST
2. Only use web_search_contact if database returns no results

CONVERSATION FLOW:
1. Ask clarifying questions if needed (state, county, type of record)
2. Search database
3. Provide contact information clearly
4. Offer to help with request letters

When providing contacts, format like this:
- Institution: [Name]
- Phone: [Number]
- Email: [Email]
- Address: [Full Address]
- Best method: [Mail/Phone/Online Portal]
- Notes: [Any special instructions]

Be conversational, empathetic, and thorough.
"""


def chat(user_message, conversation_history=[]):
    """Main chat function"""
    
    # Add user message to history
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + conversation_history + [
        {"role": "user", "content": user_message}
    ]
    
    # Call OpenAI
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )
    
    assistant_message = response.choices[0].message
    
    # Handle function calls
    if assistant_message.tool_calls:
        # Add assistant message to history
        messages.append(assistant_message)
        
        # Execute each function call
        for tool_call in assistant_message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            print(f"\n[Calling function: {function_name}]")
            print(f"[Args: {function_args}]")
            
            # Execute function
            if function_name == "search_contacts":
                result = search_contacts(**function_args)
            elif function_name == "web_search_contact":
                result = web_search_contact(**function_args)
            
            print(f"[Result: {len(result) if isinstance(result, list) else 'N/A'} records found]")
            
            # Add function result to messages
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result)
            })
        
        # Get final response with function results
        final_response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages
        )
        
        assistant_message = final_response.choices[0].message
    
    # Return response and updated history
    return assistant_message.content, messages[1:]  # Exclude system message from history


def main():
    """Interactive CLI demo"""
    print("=" * 60)
    print("RadiantClaims Contact Agent - Demo")
    print("=" * 60)
    print("Ask me to help find institutions for RECA document retrieval!")
    print("Type 'quit' to exit.\n")
    
    conversation_history = []
    
    while True:
        user_input = input("\nYou: ").strip()
        
        if user_input.lower() in ['quit', 'exit', 'q']:
            print("\nGoodbye!")
            break
        
        if not user_input:
            continue
        
        try:
            response, conversation_history = chat(user_input, conversation_history)
            print(f"\nAgent: {response}")
        except Exception as e:
            print(f"\nError: {str(e)}")


if __name__ == "__main__":
    # Check environment variables
    if not all([OPENAI_API_KEY, AIRTABLE_API_KEY, AIRTABLE_BASE_ID]):
        print("ERROR: Missing environment variables!")
        print("Please set:")
        print("  - OPENAI_API_KEY")
        print("  - AIRTABLE_API_KEY")
        print("  - AIRTABLE_BASE_ID")
    else:
        main()
