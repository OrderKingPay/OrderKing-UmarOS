import os
import re

dir_path = r"C:\Users\hasan\OrderKing"

for root, dirs, files in os.walk(dir_path):
    if "node_modules" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith(".sql"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = re.sub(
                r"(?i)(REFERENCES\s+[a-zA-Z0-9_\"\"\.]+(?:\s*\([a-zA-Z0-9_\"\"\.,\s]+\))?)(?!\s+ON\s+DELETE)",
                r"\1 ON DELETE CASCADE",
                content
            )

            if re.search(r"create table if not exists \"?orders\"?", new_content, re.IGNORECASE):
                if "CHECK (food_paise" not in new_content and "food_paise" in new_content:
                    new_content += "\n\nALTER TABLE orders ADD CONSTRAINT check_positive_food_paise CHECK (food_paise >= 0);"
                if "CHECK (food_subtotal_paise" not in new_content and "food_subtotal_paise" in new_content:
                    new_content += "\n\nALTER TABLE orders ADD CONSTRAINT check_positive_food_subtotal_paise CHECK (food_subtotal_paise >= 0);"
                if "CHECK (food_value_paise" not in new_content and "food_value_paise" in new_content:
                    new_content += "\n\nALTER TABLE orders ADD CONSTRAINT check_positive_food_value_paise CHECK (food_value_paise >= 0);"

            if re.search(r"create table if not exists \"?kingpay_wallets\"?", new_content, re.IGNORECASE):
                if "CHECK (balance_paise >= 0)" not in new_content:
                    new_content += "\n\nALTER TABLE kingpay_wallets ADD CONSTRAINT check_positive_balance CHECK (balance_paise >= 0);"
                    
            if re.search(r"create table if not exists \"?wallets\"?", new_content, re.IGNORECASE):
                if "CHECK (balance" not in new_content:
                    new_content += "\n\nALTER TABLE wallets ADD CONSTRAINT check_positive_balance CHECK (balance >= 0);"

            if re.search(r"create table if not exists \"?(live_tracking_telemetry|rider_locations)\"?", new_content, re.IGNORECASE):
                table_match = re.search(r"create table if not exists \"?(live_tracking_telemetry|rider_locations)\"?", new_content, re.IGNORECASE)
                if table_match:
                    table_name = table_match.group(1)
                    if "UNIQUE (rider_id, timestamp)" not in new_content and "timestamp" in new_content:
                        new_content += f"\n\nALTER TABLE {table_name} ADD CONSTRAINT check_rider_one_place UNIQUE (rider_id, timestamp);"
                    elif "UNIQUE (rider_id, created_at)" not in new_content:
                        new_content += f"\n\nALTER TABLE {table_name} ADD CONSTRAINT check_rider_one_place UNIQUE (rider_id, created_at);"
                        
            if content != new_content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {path}")

