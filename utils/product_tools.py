"""
utils/product_tools.py
======================
Vasavi Traders — Python Utility Scripts

This file contains standalone helper utilities written in Python.
It does NOT connect to the frontend or backend — it is a standalone
script you can run directly from the terminal for quick data tasks.

Usage Examples:
  python utils/product_tools.py              → prints all products
  python utils/product_tools.py summary      → prints category summary
  python utils/product_tools.py search wire  → search by name keyword
"""

import sys

# ─── Product Catalog (mirrors the frontend FALLBACK_PRODUCTS) ──────────────
PRODUCTS = [
    # ELECTRICAL
    {"id": 1,  "name": "1/18 Wire (~1-1.5 sqmm)",   "category": "Electrical", "price": 15,   "brand": "Havells"},
    {"id": 2,  "name": "Wire 2.0 sqmm",              "category": "Electrical", "price": 24,   "brand": "Havells"},
    {"id": 3,  "name": "Wire 2.5 sqmm",              "category": "Electrical", "price": 33,   "brand": "Havells"},
    {"id": 4,  "name": "Wire 4.0 sqmm",              "category": "Electrical", "price": 53,   "brand": "Havells"},
    {"id": 5,  "name": "Wire 6.0 sqmm",              "category": "Electrical", "price": 90,   "brand": "Havells"},
    {"id": 6,  "name": "6A Switch",                  "category": "Electrical", "price": 80,   "brand": "Anchor"},
    {"id": 7,  "name": "6A Socket",                  "category": "Electrical", "price": 100,  "brand": "Anchor"},
    {"id": 8,  "name": "16A Switch",                 "category": "Electrical", "price": 210,  "brand": "Anchor"},
    {"id": 9,  "name": "16A Socket",                 "category": "Electrical", "price": 275,  "brand": "Anchor"},
    {"id": 10, "name": "DP Switch",                  "category": "Electrical", "price": 525,  "brand": "Havells"},
    {"id": 11, "name": "Fan Regulator",              "category": "Electrical", "price": 375,  "brand": "Anchor"},
    {"id": 12, "name": "MCB",                        "category": "Electrical", "price": 475,  "brand": "Havells"},
    {"id": 13, "name": "40 Pin Socket",              "category": "Electrical", "price": 200,  "brand": "Generic"},
    {"id": 14, "name": "Ceiling Fan",                "category": "Electrical", "price": 3150, "brand": "Crompton"},
    {"id": 15, "name": "Table Fan",                  "category": "Electrical", "price": 2100, "brand": "Crompton"},
    # PIPES
    {"id": 16, "name": "3/4 inch CPVC Pipe",         "category": "Pipes", "price": 33,   "brand": "Ashirvad"},
    {"id": 17, "name": "1 inch CPVC Pipe",           "category": "Pipes", "price": 48,   "brand": "Ashirvad"},
    {"id": 18, "name": "L Bend Fitting",             "category": "Pipes", "price": 25,   "brand": "Generic"},
    {"id": 19, "name": "T Bend Fitting",             "category": "Pipes", "price": 38,   "brand": "Generic"},
    {"id": 20, "name": "2 inch PVC Pipe",            "category": "Pipes", "price": 275,  "brand": "Sudhakar"},
    {"id": 21, "name": "2.5 inch PVC Pipe",          "category": "Pipes", "price": 475,  "brand": "Narmada"},
    {"id": 22, "name": "3 inch PVC Pipe",            "category": "Pipes", "price": 800,  "brand": "Nandi Gold"},
    {"id": 23, "name": "4 inch PVC Pipe",            "category": "Pipes", "price": 1200, "brand": "Nandi Gold"},
    # TANKS
    {"id": 24, "name": "500 L Tank",                 "category": "Tanks", "price": 4000, "brand": "Nandi"},
    {"id": 25, "name": "750 L Tank",                 "category": "Tanks", "price": 6250, "brand": "Nandi"},
    {"id": 26, "name": "1000 L Tank",                "category": "Tanks", "price": 8250, "brand": "Nandi"},
    # CEMENT
    {"id": 27, "name": "KCP Cement",                 "category": "Cement", "price": 385,  "brand": "KCP Cement"},
    {"id": 28, "name": "UltraTech OPC",              "category": "Cement", "price": 415,  "brand": "UltraTech"},
    {"id": 29, "name": "UltraTech PPC",              "category": "Cement", "price": 385,  "brand": "UltraTech"},
    {"id": 30, "name": "Birla White",                "category": "Cement", "price": 1050, "brand": "Birla White"},
    {"id": 31, "name": "Walker Cement",              "category": "Cement", "price": 360,  "brand": "Walker Cement"},
    # PAINT
    {"id": 32, "name": "ACC Primer",                 "category": "Paint", "price": 200, "brand": "ACC"},
    {"id": 33, "name": "Apex Primer",               "category": "Paint", "price": 240, "brand": "Apex"},
    {"id": 34, "name": "Asian Paints (Emulsion)",   "category": "Paint", "price": 425, "brand": "Asian Paints"},
    {"id": 35, "name": "Cooling Paints",            "category": "Paint", "price": 500, "brand": "Generic"},
    {"id": 36, "name": "Paint Brushes",             "category": "Paint", "price": 110, "brand": "Generic"},
]


# ─── Helper Functions ──────────────────────────────────────────────────────

def print_all_products():
    """Print all products in a readable table format."""
    print(f"\n{'ID':<4} {'Name':<35} {'Category':<12} {'Brand':<15} {'Price (₹)'}")
    print("─" * 80)
    for p in PRODUCTS:
        print(f"{p['id']:<4} {p['name']:<35} {p['category']:<12} {p['brand']:<15} ₹{p['price']}")
    print(f"\nTotal: {len(PRODUCTS)} products\n")


def print_category_summary():
    """Print a summary of products grouped by category."""
    from collections import defaultdict
    summary = defaultdict(list)
    for p in PRODUCTS:
        summary[p["category"]].append(p["price"])

    print(f"\n{'Category':<12} {'Items':<8} {'Avg Price':<12} {'Min Price':<12} {'Max Price'}")
    print("─" * 60)
    for cat, prices in sorted(summary.items()):
        avg = round(sum(prices) / len(prices))
        print(f"{cat:<12} {len(prices):<8} ₹{avg:<11} ₹{min(prices):<11} ₹{max(prices)}")
    print()


def search_products(keyword: str):
    """Search products by name (case-insensitive)."""
    keyword = keyword.lower()
    results = [p for p in PRODUCTS if keyword in p["name"].lower()]
    if not results:
        print(f"\nNo products found matching '{keyword}'\n")
        return
    print(f"\nSearch results for '{keyword}':")
    print(f"{'ID':<4} {'Name':<35} {'Category':<12} {'Price (₹)'}")
    print("─" * 65)
    for p in results:
        print(f"{p['id']:<4} {p['name']:<35} {p['category']:<12} ₹{p['price']}")
    print()


# ─── CLI Entry Point ───────────────────────────────────────────────────────

if __name__ == "__main__":
    args = sys.argv[1:]

    if not args:
        print_all_products()
    elif args[0] == "summary":
        print_category_summary()
    elif args[0] == "search" and len(args) > 1:
        search_products(args[1])
    else:
        print("\nUsage:")
        print("  python utils/product_tools.py              → list all products")
        print("  python utils/product_tools.py summary      → category summary")
        print("  python utils/product_tools.py search wire  → search by keyword\n")
