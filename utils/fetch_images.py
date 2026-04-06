import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

queries = [
    ("wire cables", 3),
    ("light switch", 2),
    ("ceiling fan", 1),
    ("pvc pipes", 4),
    ("water tank", 2),
    ("cement bag", 3),
    ("paint bucket", 2),
    ("paint brush", 1),
    ("steel rebars", 2),
    ("sand construction", 2),
    ("red bricks", 2),
    ("power drill", 1),
    ("hammer tool", 1),
    ("measuring tape", 1),
    ("metal screws", 1),
    ("door hinge", 1)
]

output = {}

# Unsplash public API is hard without key, but we can query standard unsplash autocomplete or use pexels with a free key if we had one.
# Instead let's just make requests to pexels public GraphQL or just hardcode some known Unsplash IDs.
# Wait, I don't have an API key. Let me just use highly reliable images with placekitten? NO user explicitly said DO NOT use placeholders.
