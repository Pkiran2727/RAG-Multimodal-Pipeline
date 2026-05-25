import re

with open("/Content/AI-PROJECTS/RAG_FULL_APPLICATION/RAG_FULL_APPLICATION_BACKEND/app/routers/auth.py", "r") as f:
    content = f.read()

new_seed_admin = """@router.post("/seed_admin")
async def seed_admin():
    import traceback
    try:
        hashed = get_password_hash("admin123")
        supabase_service.client.table("users").delete().eq("username", "admin").execute()
        supabase_service.client.table("users").insert({
            "username": "admin",
            "password_hash": hashed
        }).execute()
        logger.info("Admin user seeded successfully.")
        return {"msg": "Admin user created/reset (admin / admin123)"}
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        return {"error": str(e), "traceback": traceback.format_exc()}
"""

content = re.sub(r'@router\.post\("/seed_admin"\).*?(?=\n@|\Z)', new_seed_admin, content, flags=re.DOTALL)

with open("/Content/AI-PROJECTS/RAG_FULL_APPLICATION/RAG_FULL_APPLICATION_BACKEND/app/routers/auth.py", "w") as f:
    f.write(content)
