"""
AI Fashion Recommendation Service.

Uses Groq Gemma 2 9B IT to parse user messages, query MongoDB, score and rank products,
and generate luxury stylist responses.
"""

import logging
from datetime import datetime, timezone
from bson import ObjectId

from app.database import get_database
from app.services import openai_service

logger = logging.getLogger(__name__)


def build_search_query(filters: dict) -> dict:
    """Convert extracted filters into MongoDB query."""
    clauses = []
    
    # Category matching in category, subcategory, name
    if filters.get("category"):
        clauses.append({
            "$or": [
                {"category": {"$regex": filters["category"], "$options": "i"}},
                {"subcategory": {"$regex": filters["category"], "$options": "i"}},
                {"name": {"$regex": filters["category"], "$options": "i"}}
            ]
        })
        
    # Color matching
    if filters.get("color"):
        clauses.append({"colors": {"$regex": filters["color"], "$options": "i"}})
        
    # Size matching
    if filters.get("size"):
        clauses.append({"sizes": {"$regex": filters["size"], "$options": "i"}})
        
    # Budget matching
    if filters.get("budget") is not None:
        clauses.append({"price": {"$lte": float(filters["budget"])}})
        
    # Gender matching in name, description, category, subcategory
    if filters.get("gender"):
        gender_val = filters["gender"]
        clauses.append({
            "$or": [
                {"category": {"$regex": gender_val, "$options": "i"}},
                {"subcategory": {"$regex": gender_val, "$options": "i"}},
                {"name": {"$regex": gender_val, "$options": "i"}},
                {"description": {"$regex": gender_val, "$options": "i"}}
            ]
        })
        
    # Occasion matching in subcategory, name, description, category
    if filters.get("occasion"):
        clauses.append({
            "$or": [
                {"category": {"$regex": filters["occasion"], "$options": "i"}},
                {"subcategory": {"$regex": filters["occasion"], "$options": "i"}},
                {"name": {"$regex": filters["occasion"], "$options": "i"}},
                {"description": {"$regex": filters["occasion"], "$options": "i"}}
            ]
        })
        
    # Style matching in subcategory, name, description, category
    if filters.get("style"):
        clauses.append({
            "$or": [
                {"category": {"$regex": filters["style"], "$options": "i"}},
                {"subcategory": {"$regex": filters["style"], "$options": "i"}},
                {"name": {"$regex": filters["style"], "$options": "i"}},
                {"description": {"$regex": filters["style"], "$options": "i"}}
            ]
        })
        
    if not clauses:
        return {}
    if len(clauses) == 1:
        return clauses[0]
    return {"$and": clauses}


def build_relaxed_query(filters: dict) -> dict:
    """Create a broader fallback query by retaining only essential criteria."""
    clauses = []
    if filters.get("category"):
        clauses.append({
            "$or": [
                {"category": {"$regex": filters["category"], "$options": "i"}},
                {"subcategory": {"$regex": filters["category"], "$options": "i"}},
                {"name": {"$regex": filters["category"], "$options": "i"}}
            ]
        })
    if filters.get("gender"):
        clauses.append({
            "$or": [
                {"category": {"$regex": filters["gender"], "$options": "i"}},
                {"subcategory": {"$regex": filters["gender"], "$options": "i"}},
                {"name": {"$regex": filters["gender"], "$options": "i"}},
                {"description": {"$regex": filters["gender"], "$options": "i"}}
            ]
        })
    if filters.get("budget") is not None:
        clauses.append({"price": {"$lte": float(filters["budget"])}})
    elif filters.get("color"):
        clauses.append({"colors": {"$regex": filters["color"], "$options": "i"}})
        
    if not clauses:
        return {}
    if len(clauses) == 1:
        return clauses[0]
    return {"$and": clauses}


def score_product_match(product: dict, filters: dict) -> float:
    """Calculate a relevance score (0-100) for a product against extracted filters."""
    score = 0.0
    total_weights = 0.0
    
    if filters.get("category"):
        total_weights += 30
        cat = filters["category"].lower()
        if cat == product.get("category", "").lower():
            score += 30
        elif cat in product.get("subcategory", "").lower():
            score += 20
        elif cat in product.get("name", "").lower() or cat in product.get("description", "").lower():
            score += 10
            
    if filters.get("color"):
        total_weights += 20
        color = filters["color"].lower()
        product_colors = [c.lower() for c in product.get("colors", [])]
        if color in product_colors:
            score += 20
        elif any(color in c for c in product_colors):
            score += 15
        elif color in product.get("name", "").lower():
            score += 10
            
    if filters.get("size"):
        total_weights += 15
        size = filters["size"].upper()
        product_sizes = [s.upper() for s in product.get("sizes", [])]
        if size in product_sizes:
            score += 15
            
    if filters.get("budget") is not None:
        total_weights += 15
        price = product.get("price", 0)
        budget = float(filters["budget"])
        if price <= budget:
            score += 15
            score += 5 * (1 - (price / budget))
            
    if filters.get("gender"):
        total_weights += 10
        gender = filters["gender"].lower()
        name_desc = (product.get("name", "") + " " + product.get("description", "")).lower()
        cat_sub = (product.get("category", "") + " " + product.get("subcategory", "")).lower()
        if gender in cat_sub:
            score += 10
        elif gender in name_desc:
            score += 5
            
    if filters.get("occasion"):
        total_weights += 5
        occ = filters["occasion"].lower()
        name_desc = (product.get("name", "") + " " + product.get("description", "")).lower()
        if occ in name_desc or occ in product.get("subcategory", "").lower():
            score += 5
            
    if filters.get("style"):
        total_weights += 5
        style = filters["style"].lower()
        name_desc = (product.get("name", "") + " " + product.get("description", "")).lower()
        if style in name_desc:
            score += 5
            
    if total_weights == 0:
        return 100.0
        
    percentage = (score / total_weights) * 100
    return round(min(percentage, 100.0), 2)


async def get_recommendations(message: str, limit: int = 10, user_id: str | None = None) -> dict:
    """
    Parse a user query, query MongoDB, score items, generate stylist response,
    and log details to chat history.
    """
    # 1. Extract filters using Groq
    filters = await openai_service.extract_filters(message)
    logger.info("Extracted filters from message: %s", filters)
    
    db = get_database()
    
    # 2. Build query
    query = build_search_query(filters)
    
    # 3. Search database
    cursor = db.products.find(query).limit(100)
    candidates = [doc async for doc in cursor]
    
    # 4. Fallback if empty search results
    if not candidates and query:
        logger.info("Strict search returned 0 products. Running relaxed search query...")
        relaxed_query = build_relaxed_query(filters)
        cursor = db.products.find(relaxed_query).limit(100)
        candidates = [doc async for doc in cursor]
        
    # If still empty, fetch top 10 products
    if not candidates:
        logger.info("Relaxed search returned 0 products. Fetching popular items...")
        cursor = db.products.find({}).sort("rating", -1).limit(20)
        candidates = [doc async for doc in cursor]
        
    # 5. Score and sort candidates
    scored = []
    for product in candidates:
        rel_score = score_product_match(product, filters)
        scored.append((product, rel_score))
        
    scored.sort(key=lambda x: x[1], reverse=True)
    top_candidates = scored[:limit]
    
    recommendations = []
    for product, rel_score in top_candidates:
        recommendations.append({
            "id": str(product["_id"]),
            "name": product["name"],
            "description": product.get("description", ""),
            "price": product["price"],
            "category": product.get("category", ""),
            "brand": product.get("brand", ""),
            "colors": product.get("colors", []),
            "sizes": product.get("sizes", []),
            "images": product.get("images", []),
            "rating": product.get("rating", 0.0),
            "relevance_score": rel_score
        })
        
    # 6. Generate Stylist Response using Groq
    stylist_resp = await openai_service.generate_stylist_response(message, recommendations)
    
    # 7. Save to chat history
    chat_history_doc = {
        "user_id": user_id or "",
        "message": message,
        "response": stylist_resp,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_history.insert_one(chat_history_doc)
    
    return {
        "filters": filters,
        "recommendations": recommendations,
        "stylist_response": stylist_resp,
        "total": len(recommendations)
    }


async def generate_outfit(message: str, user_id: str | None = None) -> dict:
    """Curate a matched outfit (top, bottom, footwear) based on query parameters and budget."""
    # 1. Extract filters
    filters = await openai_service.extract_filters(message)
    budget = filters.get("budget") or 4000.0
    gender = filters.get("gender")
    color = filters.get("color")
    style = filters.get("style")
    occasion = filters.get("occasion")
    
    db = get_database()
    
    # Helper to find items matching criteria for top, bottom, footwear
    async def get_candidates(categories: list[str], max_price: float) -> list[dict]:
        clauses = [{"category": {"$in": [c.lower() for c in categories]}}]
        if gender:
            clauses.append({
                "$or": [
                    {"category": {"$regex": gender, "$options": "i"}},
                    {"subcategory": {"$regex": gender, "$options": "i"}},
                    {"name": {"$regex": gender, "$options": "i"}},
                    {"description": {"$regex": gender, "$options": "i"}}
                ]
            })
            
        query = {"$and": clauses}
        cursor = db.products.find(query).limit(100)
        items = [doc async for doc in cursor]
        
        # If no items match gender + category, relax gender filter
        if not items:
            query = {"category": {"$in": [c.lower() for c in categories]}}
            cursor = db.products.find(query).limit(100)
            items = [doc async for doc in cursor]
            
        # Score candidates based on color, style, occasion, budget
        scored = []
        for item in items:
            score = 0.0
            if color and any(color in c.lower() for c in item.get("colors", [])):
                score += 30
            if style and style in (item.get("name", "") + " " + item.get("description", "")).lower():
                score += 20
            if occasion and occasion in (item.get("subcategory", "") + " " + item.get("description", "")).lower():
                score += 20
            if item.get("price", 0) <= max_price:
                score += 30
            else:
                score -= 10
            scored.append((item, score))
            
        scored.sort(key=lambda x: x[1], reverse=True)
        return [s[0] for s in scored]

    # Partition budget: top (35%), bottom (35%), footwear (30%)
    top_budget = budget * 0.35
    bottom_budget = budget * 0.35
    footwear_budget = budget * 0.30
    
    top_categories = ["shirt", "tshirt", "t-shirt", "tee", "jacket", "kurta", "top", "blouse", "crop top"]
    bottom_categories = ["jeans", "pants", "trousers", "shorts", "skirt"]
    footwear_categories = ["shoes", "shoe", "sneakers", "boots", "heels", "sandals", "footwear"]
    
    tops = await get_candidates(top_categories, top_budget)
    bottoms = await get_candidates(bottom_categories, bottom_budget)
    footwears = await get_candidates(footwear_categories, footwear_budget)
    
    selected_top = tops[0] if tops else None
    selected_bottom = bottoms[0] if bottoms else None
    selected_footwear = footwears[0] if footwears else None
    
    def to_item_out(product: dict | None) -> dict | None:
        if product is None:
            return None
        return {
            "id": str(product["_id"]),
            "name": product["name"],
            "price": product["price"],
            "image": product.get("images", [""])[0] if product.get("images") else "",
            "category": product.get("category", ""),
            "brand": product.get("brand", "")
        }
        
    outfit = {
        "top": to_item_out(selected_top),
        "bottom": to_item_out(selected_bottom),
        "footwear": to_item_out(selected_footwear)
    }
    
    total_price = sum(item["price"] for item in outfit.values() if item is not None)
    
    # Generate styling message using Groq
    stylist_msg = await openai_service.generate_outfit_stylist_message(message, outfit, total_price)
    
    # Save to chat history
    chat_history_doc = {
        "user_id": user_id or "",
        "message": message,
        "response": stylist_msg,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_history.insert_one(chat_history_doc)
    
    return {
        "stylist_message": stylist_msg,
        "outfit": outfit,
        "total_price": round(total_price, 2)
    }


async def generate_personalized_recommendations(user_id: str, wishlist_product_ids: list[str] = None) -> dict:
    """Retrieve personal recommendations based on user order history, cart items, wishlist and chat context."""
    db = get_database()
    
    # 1. Fetch user orders
    orders_cursor = db.orders.find({"user_id": user_id}).sort("created_at", -1).limit(5)
    orders = [doc async for doc in orders_cursor]
    
    # 2. Fetch user cart
    cart = await db.carts.find_one({"user_id": user_id})
    cart_items = cart.get("items", []) if cart else []
    
    # 3. Fetch wishlist products if ids are provided
    wishlist_products = []
    if wishlist_product_ids:
        try:
            obj_ids = [ObjectId(pid) for pid in wishlist_product_ids if pid]
            if obj_ids:
                wish_cursor = db.products.find({"_id": {"$in": obj_ids}})
                wishlist_products = [doc async for doc in wish_cursor]
        except Exception as e:
            logger.error(f"Error parsing wishlist product IDs: {e}")
            
    # 4. Fetch user past chat history
    chat_cursor = db.chat_history.find({"user_id": user_id}).sort("created_at", -1).limit(10)
    chat_history = [doc async for doc in chat_cursor]
    
    # 5. Synthesize preference profile using Groq
    profile = await openai_service.synthesize_user_profile(orders, cart_items, wishlist_products, chat_history)
    logger.info("Synthesized user profile for %s: %s", user_id, profile)
    
    # 6. Build query based on preferred categories and colors
    pref_categories = profile.get("preferred_categories", [])
    pref_colors = profile.get("preferred_colors", [])
    pref_sizes = profile.get("preferred_sizes", [])
    avg_price = profile.get("average_price_point")
    
    query = {}
    clauses = []
    
    if pref_categories:
        clauses.append({"category": {"$in": [c.lower() for c in pref_categories]}})
    if pref_colors:
        clauses.append({"colors": {"$in": [c.lower() for c in pref_colors]}})
        
    if clauses:
        query = {"$or": clauses}
        
    cursor = db.products.find(query).limit(50)
    candidates = [doc async for doc in cursor]
    
    if len(candidates) < 6:
        cursor = db.products.find({}).sort("rating", -1).limit(50)
        candidates.extend([doc async for doc in cursor])
        
    seen_ids = set()
    unique_candidates = []
    for doc in candidates:
        doc_id = str(doc["_id"])
        if doc_id not in seen_ids:
            seen_ids.add(doc_id)
            unique_candidates.append(doc)
            
    # Score candidates based on profile
    scored = []
    for item in unique_candidates:
        score = 0.0
        if item.get("category", "").lower() in [c.lower() for c in pref_categories]:
            score += 40
        item_colors = [c.lower() for c in item.get("colors", [])]
        if any(c.lower() in item_colors for c in pref_colors):
            score += 30
        item_sizes = [s.upper() for s in item.get("sizes", [])]
        if any(s.upper() in item_sizes for s in pref_sizes):
            score += 20
        if avg_price:
            price_diff = abs(item.get("price", 0) - avg_price)
            if price_diff <= avg_price * 0.3:
                score += 10
        scored.append((item, score))
        
    scored.sort(key=lambda x: x[1], reverse=True)
    top_recs = [s[0] for s in scored[:8]]
    
    recommendations = []
    for product in top_recs:
        recommendations.append({
            "id": str(product["_id"]),
            "name": product["name"],
            "description": product.get("description", ""),
            "price": product["price"],
            "category": product.get("category", ""),
            "brand": product.get("brand", ""),
            "colors": product.get("colors", []),
            "sizes": product.get("sizes", []),
            "images": product.get("images", []),
            "rating": product.get("rating", 0.0)
        })
        
    # 7. Generate Stylist message explaining the personalization
    stylist_msg = await openai_service.generate_personalized_recommendation_stylist_message(profile, recommendations)
    
    return {
        "recommendations": recommendations,
        "stylist_message": stylist_msg
    }
