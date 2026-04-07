import json
import os
import re

def parse_block_data(content):
    # Split content by [number] pattern (handles spaces like [  1])
    blocks = re.split(r'\[\s*\d+\s*\]\s+', content)
    businesses = []
    
    for block in blocks:
        if not block.strip():
            continue
            
        lines = block.split('\n')
        name = lines[0].strip()
        
        data = {
            "name": name,
            "family": "",
            "industry": "",
            "revenue": "",
            "tier": "",
            "governance": "",
            "decisionMaker": "",
            "signals": "",
            "position": "",
            "contactPerson": "-"
        }
        
        current_data_key = None
        for line in lines[1:]:
            if '──' in line or '---' in line: continue
            if not line.strip(): continue
            
            # Key value pattern like "  Family             : Ajlan"
            match = re.match(r'^\s*([A-Za-z /]+?)\s*:\s*(.*)$', line)
            
            if match:
                key = match.group(1).lower().replace(' ', '').replace(':', '')
                value = match.group(2).strip()
                
                # Check for recognized keys
                mapping = {
                    'family': 'family',
                    'industry': 'industry',
                    'revenue': 'revenue',
                    'tier': 'tier',
                    'governance': 'governance',
                    'decisionmaker': 'decisionMaker',
                    'role/position': 'position',
                    'position': 'position',
                    'contactperson': 'contactPerson',
                    'opportunitysignals': 'signals'
                }
                
                found_key = None
                for k_key, v_key in mapping.items():
                    if k_key in key:
                        found_key = v_key
                        break
                
                if found_key:
                    current_data_key = found_key
                    if data[current_data_key] and data[current_data_key] != "-":
                        data[current_data_key] += " " + value
                    else:
                        data[current_data_key] = value
                else:
                    # It matched the regex but key is not recognized (e.g. "Country")
                    # Stop appending to the last field
                    current_data_key = None
            else:
                # Continuation of previous field, only if it's not a new block or separator
                if current_data_key and line.strip():
                    data[current_data_key] += " " + line.strip()
        
        # Cleanup values
        for k in data:
            if isinstance(data[k], str):
                data[k] = data[k].strip()
        
        # Specific cleanup for tier: remove "tier" and keep only the number
        if data["tier"]:
            digits = re.findall(r'\d+', data["tier"])
            if digits:
                data["tier"] = digits[0]
        
        businesses.append(data)
    
    return businesses

def parse_simple_data(content):
    lines = [l.strip() for l in content.split('\n') if l.strip()]
    if not lines: return []
    
    data_lines = lines[8:]
    businesses = []
    for i in range(0, len(data_lines), 8):
        chunk = data_lines[i:i+8]
        if len(chunk) < 8: continue
            
        tier_val = chunk[4].strip()
        digits = re.findall(r'\d+', tier_val)
        tier = digits[0] if digits else tier_val

        signals_val = chunk[6].strip()
        # Strip trailing digits (footnotes like " 15", " 20")
        signals_val = re.sub(r'\s+\d+$', '', signals_val)

        business = {
            "name": chunk[0],
            "family": chunk[1],
            "industry": chunk[2],
            "revenue": chunk[3],
            "tier": tier,
            "governance": chunk[5],
            "signals": signals_val,
            "decisionMaker": chunk[7],
            "position": "",
            "contactPerson": "-"
        }
        businesses.append(business)
    return businesses

def parse_data(file_path):
    if not os.path.exists(file_path):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(script_dir, file_path)
        
    with open(file_path, 'r', encoding='utf-8') as f:
        full_content = f.read()
    
    if '[--- PREVIOUS 141 COMPANIES DATA ---]' in full_content:
        parts = full_content.split('[--- PREVIOUS 141 COMPANIES DATA ---]')
        detailed_content = parts[0]
        simple_content = parts[1]
    else:
        detailed_content = full_content
        simple_content = ""
    
    detailed_list = parse_block_data(detailed_content)
    simple_list = parse_simple_data(simple_content)
    
    # Merge and deduplicate
    # Use a composite key to prioritize detailed versions
    merged = {}
    
    def get_key(b):
        return (
            b['name'].lower().strip(),
            b['decisionMaker'].lower().strip()
        )
    
    # Add simple ones first
    for b in simple_list:
        merged[get_key(b)] = b
        
    # Overwrite with detailed ones (they take precedence)
    # Use reversed order so that entries at the top of raw_data.txt (new ones) win
    for b in reversed(detailed_list):
        merged[get_key(b)] = b
        
    return list(merged.values())

if __name__ == "__main__":
    target_json = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'businesses.json')
    data = parse_data('raw_data.txt')
    with open(target_json, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Successfully parsed and merged {len(data)} businesses to {target_json}")
