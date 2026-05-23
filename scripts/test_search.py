#!/usr/bin/env python3
import requests

r = requests.post("http://localhost:9092/api/recommendations/search", json={"query": "java", "organization_id": None})
data = r.json()
for p in data:
    print(f"  {p['name']}: {p['match_level']} (sim={p['similarity']:.3f}) skills={p['skills']}")
