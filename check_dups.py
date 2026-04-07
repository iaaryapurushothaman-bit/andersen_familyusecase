import json
import collections

with open('src/data/businesses.json', encoding='utf-8') as f:
    data = json.load(f)

name_map = collections.defaultdict(list)
for b in data:
    name_map[b['name'].lower().strip()].append(b)

dups = {n: records for n, records in name_map.items() if len(records) > 1}

print(f"Total Records: {len(data)}")
print(f"Unique Names: {len(name_map)}")
print("\nDetected Near-Duplicates (Same name, different details):")
for n, records in dups.items():
    print(f"\nCompany: {n.title()}")
    for r in records:
        print(f" - Decision Maker: {r.get('decisionMaker', 'N/A')}")
        print(f"   Contact Person: {r.get('contactPerson', 'N/A')}")
