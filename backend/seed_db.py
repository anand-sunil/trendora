import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from app.models.product import new_product_document
from app.models.user import new_user_document, UserRole
from app.utils.password import hash_password

load_dotenv()

async def seed():
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DATABASE_NAME", "trendora")
    
    if not mongo_uri:
        print("Error: MONGO_URI is not set in environment variables.")
        return
        
    print(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(mongo_uri)
    db = client[db_name]
    
    # Clean existing products
    print("Clearing existing products...")
    await db.products.delete_many({})
    
    # Curated premium minimalist clothes and footwear matching the COS/Saint Laurent black & white aesthetic
    products = [
        new_product_document(
            name="Minimalist Poplin Shirt",
            description="A clean, structured shirt crafted from premium organic cotton poplin. Features a pointed collar, concealed button placket, and single button cuffs.",
            price=2499.0,
            category="shirt",
            subcategory="formal",
            brand="COS",
            colors=["white", "black"],
            sizes=["S", "M", "L", "XL"],
            stock=45,
            images=[
                "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600&auto=format&fit=crop"
            ],
            rating=4.7
        ),
        new_product_document(
            name="Oversized Cotton T-shirt",
            description="Crafted from heavyweight organic cotton jersey with a dry hand feel. Cut for a relaxed, boxy fit with dropped shoulders and a thick ribbed mock neck.",
            price=1299.0,
            category="shirt",
            subcategory="casual",
            brand="COS",
            colors=["black", "white", "grey"],
            sizes=["S", "M", "L", "XL"],
            stock=60,
            images=[
                "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop"
            ],
            rating=4.8
        ),
        new_product_document(
            name="Tailored Wool Trousers",
            description="Mid-rise, straight-leg trousers tailored in a premium wool blend. Clean waistband, pressed creases, and subtle side pockets.",
            price=4999.0,
            category="pants",
            subcategory="formal",
            brand="Saint Laurent",
            colors=["black", "grey"],
            sizes=["M", "L", "XL"],
            stock=20,
            images=[
                "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop"
            ],
            rating=4.9
        ),
        new_product_document(
            name="Wide-Leg Pleated Pants",
            description="High-waisted, wide-leg trousers in structured linen-blend drape. Twin front pleats, hook-and-bar closure, and welt pockets.",
            price=3499.0,
            category="pants",
            subcategory="casual",
            brand="COS",
            colors=["black", "beige"],
            sizes=["S", "M", "L"],
            stock=30,
            images=[
                "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop"
            ],
            rating=4.6
        ),
        new_product_document(
            name="Minimalist Belted Dress",
            description="A sleek maxi-length dress in flowy tencel drape. Clean round neck, short sleeves, and a matching self-tie belt to define the waist.",
            price=4500.0,
            category="dress",
            subcategory="casual",
            brand="COS",
            colors=["black", "navy"],
            sizes=["S", "M", "L"],
            stock=15,
            images=[
                "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop|black",
                "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?q=80&w=600&auto=format&fit=crop|navy"
            ],
            rating=4.7
        ),
        new_product_document(
            name="Structured Blazer",
            description="Single-breasted formal blazer in heavy wool crepe. Sharp shoulders, notched lapels, single button closure, and flap pockets.",
            price=8999.0,
            category="jacket",
            subcategory="formal",
            brand="Saint Laurent",
            colors=["black"],
            sizes=["M", "L", "XL"],
            stock=12,
            images=[
                "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=600&auto=format&fit=crop"
            ],
            rating=4.9
        ),
        new_product_document(
            name="Ribbed Knit Midi Dress",
            description="A close-fitting midi dress in a heavy-gauge ribbed knit. Features an elegant open collar, long sleeves, and a subtle side slit.",
            price=3990.0,
            category="dress",
            subcategory="casual",
            brand="COS",
            colors=["beige", "black"],
            sizes=["XS", "S", "M", "L"],
            stock=22,
            images=[
                "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?q=80&w=600&auto=format&fit=crop|beige",
                "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=600&auto=format&fit=crop|black"
            ],
            rating=4.8
        ),
        new_product_document(
            name="Premium Silk Slip Dress",
            description="Crafted from liquid-like mulberry silk sandwashed for a velvety finish. Delicate spaghetti straps, scoop back, and bias-cut drape.",
            price=7200.0,
            category="dress",
            subcategory="formal",
            brand="Saint Laurent",
            colors=["black", "white"],
            sizes=["S", "M", "L"],
            stock=14,
            images=[
                "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=600&auto=format&fit=crop|black",
                "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop|white"
            ],
            rating=4.9
        ),
        new_product_document(
            name="Tailored Blazer Dress",
            description="A sharp dress design referencing formal menswear. Double-breasted closure, structured shoulder padding, satin lapels, and clean welt pockets.",
            price=8500.0,
            category="dress",
            subcategory="formal",
            brand="Saint Laurent",
            colors=["black"],
            sizes=["S", "M", "L"],
            stock=10,
            images=[
                "https://images.unsplash.com/photo-1539008885128-40324ebb89fd?q=80&w=600&auto=format&fit=crop|black",
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop"
            ],
            rating=4.9
        ),
        new_product_document(
            name="A-Line Linen Dress",
            description="An easy, flowy summer dress cut in premium flax linen. Relaxed A-line silhouette, V-neckline, and side seam pockets.",
            price=3200.0,
            category="dress",
            subcategory="casual",
            brand="COS",
            colors=["white", "beige"],
            sizes=["XS", "S", "M", "L"],
            stock=25,
            images=[
                "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=600&auto=format&fit=crop|white",
                "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop|beige"
            ],
            rating=4.6
        ),
        new_product_document(
            name="Cropped Linen Top",
            description="A boxy cropped top in breathable premium linen. Features a wide boat neck, short sleeves, and clean turn-up hems.",
            price=1599.0,
            category="top",
            subcategory="casual",
            brand="COS",
            colors=["white", "black", "beige"],
            sizes=["S", "M", "L"],
            stock=40,
            images=[
                "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=600&auto=format&fit=crop"
            ],
            rating=4.5
        ),
        new_product_document(
            name="Raw Selvedge Jeans",
            description="Five-pocket jeans in heavyweight raw selvedge cotton denim. Straight-leg cut, button fly, and signature leather patch.",
            price=3999.0,
            category="jeans",
            subcategory="casual",
            brand="APC",
            colors=["blue", "black"],
            sizes=["M", "L", "XL"],
            stock=25,
            images=[
                "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop"
            ],
            rating=4.8
        ),
        new_product_document(
            name="Leather Chelsea Boots",
            description="Crafted in soft Italian calfskin leather with elasticated side panels and robust rubber pull tabs. Set on stacked leather heels.",
            price=7999.0,
            category="shoes",
            subcategory="formal",
            brand="Saint Laurent",
            colors=["black", "brown"],
            sizes=["M", "L", "XL"],
            stock=15,
            images=[
                "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop"
            ],
            rating=4.9
        ),
        new_product_document(
            name="Minimalist Canvas Sneakers",
            description="Low-top trainers crafted from premium organic cotton canvas. Vulcanized rubber sole, tonal laces, and silver-tone eyelets.",
            price=2999.0,
            category="shoes",
            subcategory="casual",
            brand="COS",
            colors=["white", "black"],
            sizes=["S", "M", "L", "XL"],
            stock=35,
            images=[
                "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=600&auto=format&fit=crop"
            ],
            rating=4.6
        )
    ]
    
    print(f"Inserting {len(products)} products into MongoDB...")
    await db.products.insert_many(products)
    
    # Seed default admin user
    print("Clearing existing admin users...")
    await db.users.delete_many({"email": "admin@trendora.com"})
    
    admin_hashed = hash_password("adminpassword")
    admin_user = new_user_document(
        name="Trendora Admin",
        email="admin@trendora.com",
        hashed_password=admin_hashed,
        role=UserRole.ADMIN
    )
    await db.users.insert_one(admin_user)
    print("Default admin user created: admin@trendora.com / adminpassword")
    
    print("Database seeding completed successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
