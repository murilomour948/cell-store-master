from backend.database import initialize_database


if __name__ == "__main__":
    result = initialize_database()
    applied = result.get("applied_migrations") or []
    if applied:
        print(f"Migrations applied: {', '.join(applied)}")
    else:
        print("Database already up to date.")
