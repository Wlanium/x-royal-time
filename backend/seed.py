#!/usr/bin/env python3
"""Seed script to populate initial data"""

import asyncio
import httpx

API_URL = "http://localhost:8000/api/v1"

# Erst einen Admin-User registrieren
ADMIN_USER = {
    "email": "tb@wlanium.de",
    "password": "Continentale112!!",
    "full_name": "Thomas Bartelt"
}

# Rumänische Mitarbeiter
EMPLOYEES = [
    {"first_name": "Andrei", "last_name": "Popescu", "employee_number": "EMP-001", "department": "IT", "position": "Developer", "vacation_days_per_year": 25},
    {"first_name": "Ioana", "last_name": "Ionescu", "employee_number": "EMP-002", "department": "HR", "position": "Manager", "vacation_days_per_year": 25},
    {"first_name": "Marius", "last_name": "Dumitrescu", "employee_number": "EMP-003", "department": "IT", "position": "Senior Developer", "vacation_days_per_year": 28},
    {"first_name": "Elena", "last_name": "Stoica", "employee_number": "EMP-004", "department": "Sales", "position": "Account Manager", "vacation_days_per_year": 25},
    {"first_name": "Vlad", "last_name": "Radu", "employee_number": "EMP-005", "department": "IT", "position": "Team Lead", "vacation_days_per_year": 28},
]

# Beispiel-Projekte (budget_hours und hourly_rate als String für Decimal)
PROJECTS = [
    {"project_number": "PRJ-001", "name": "Website Redesign", "client_name": "Kunde AG", "budget_hours": "100", "hourly_rate": "85.00", "is_billable": True},
    {"project_number": "PRJ-002", "name": "Mobile App", "client_name": "Firma GmbH", "budget_hours": "200", "hourly_rate": "95.00", "is_billable": True},
    {"project_number": "PRJ-INT", "name": "Interne Entwicklung", "client_name": "Intern", "budget_hours": "500", "hourly_rate": "0", "is_billable": False},
]


def get_error_msg(resp):
    """Safely get error message from response"""
    try:
        data = resp.json()
        return data.get('detail', str(data))
    except:
        return f"HTTP {resp.status_code}: {resp.text[:100]}"


async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Register admin user
        print("🔐 Registriere Admin-User...")
        try:
            resp = await client.post(f"{API_URL}/auth/register", json=ADMIN_USER)
            if resp.status_code == 200:
                print(f"   ✓ Admin erstellt: {ADMIN_USER['email']}")
            elif resp.status_code == 400:
                print(f"   → Admin existiert bereits")
            else:
                print(f"   ✗ Fehler: {get_error_msg(resp)}")
        except Exception as e:
            print(f"   ✗ Fehler: {e}")

        # 2. Login
        print("\n🔑 Login...")
        try:
            resp = await client.post(
                f"{API_URL}/auth/login",
                data={"username": ADMIN_USER["email"], "password": ADMIN_USER["password"]}
            )
            if resp.status_code != 200:
                print(f"   ✗ Login fehlgeschlagen: {get_error_msg(resp)}")
                return

            token = resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print(f"   ✓ Eingeloggt!")
        except Exception as e:
            print(f"   ✗ Login Fehler: {e}")
            return

        # 3. Create employees
        print("\n👥 Erstelle Mitarbeiter...")
        for emp in EMPLOYEES:
            try:
                resp = await client.post(f"{API_URL}/employees/", json=emp, headers=headers)
                if resp.status_code == 200:
                    print(f"   ✓ {emp['first_name']} {emp['last_name']}")
                else:
                    print(f"   → {emp['first_name']} {emp['last_name']}: {get_error_msg(resp)}")
            except Exception as e:
                print(f"   ✗ {emp['first_name']} {emp['last_name']}: {e}")

        # 4. Create projects
        print("\n📁 Erstelle Projekte...")
        for proj in PROJECTS:
            try:
                resp = await client.post(f"{API_URL}/projects/", json=proj, headers=headers)
                if resp.status_code == 200:
                    print(f"   ✓ {proj['name']}")
                else:
                    print(f"   → {proj['name']}: {get_error_msg(resp)}")
            except Exception as e:
                print(f"   ✗ {proj['name']}: {e}")

        print("\n✅ Fertig!")
        print(f"\n📧 Login: {ADMIN_USER['email']}")
        print(f"🔑 Passwort: {ADMIN_USER['password']}")


if __name__ == "__main__":
    asyncio.run(main())
