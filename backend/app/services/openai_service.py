import json
import logging
from openai import AsyncOpenAI, APIError, APITimeoutError, APIConnectionError
from app.config import get_settings

logger = logging.getLogger(__name__)

# Initialize client using Groq API parameters
settings = get_settings()
client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

# Gemma 2 9B IT model name (primary requested)
PRIMARY_MODEL = "gemma2-9b-it"
# Active fallback model on Groq console
FALLBACK_MODEL = "llama-3.1-8b-instant"


async def call_groq_chat_completion(**kwargs) -> any:
    """Wrapper that calls Groq chat completion and handles model decommissioning dynamically."""
    model = kwargs.get("model", PRIMARY_MODEL)
    try:
        return await client.chat.completions.create(**kwargs)
    except APIError as e:
        if e.status_code == 400 and ("decommissioned" in str(e).lower() or "not found" in str(e).lower() or "support" in str(e).lower()):
            logger.warning(f"Model '{model}' is decommissioned on Groq. Automatically falling back to '{FALLBACK_MODEL}'.")
            kwargs["model"] = FALLBACK_MODEL
            return await client.chat.completions.create(**kwargs)
        raise e


async def extract_filters(query: str) -> dict:
    """
    Extract structured fashion filters from a user search query using Groq & Gemma.
    Returns:
        dict: Containing category, color, size, gender, occasion, style, budget.
    """
    system_prompt = (
        "You are an expert fashion AI. Your job is to extract filter parameters from a user's shopping query.\n"
        "You must respond ONLY with a single valid JSON object, without any formatting like ```json or other text. "
        "The keys and values must match this structure exactly:\n"
        "{\n"
        '  "category": "e.g. shirt, dress, jeans, pants, jacket, shoes, top, etc. (use singular name, lowercase, or empty string)",\n'
        '  "color": "color name (lowercase, or empty string)",\n'
        '  "size": "size like S, M, L, XL, XXL, or empty string",\n'
        '  "gender": "intended gender like men, women, unisex, or empty string",\n'
        '  "occasion": "occasion like wedding, party, casual, formal, sports, or empty string",\n'
        '  "style": "style or fit like oversized, slim fit, cropped, formal, or empty string",\n'
        '  "budget": number/float if a budget limit is mentioned, or null\n'
        "}"
    )

    empty_filters = {
        "category": "",
        "color": "",
        "size": "",
        "gender": "",
        "occasion": "",
        "style": "",
        "budget": None
    }

    try:
        response = await call_groq_chat_completion(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Query: \"{query}\""}
            ],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content or ""
        logger.info(f"Groq raw response for filter extraction: {content}")
        
        parsed = json.loads(content.strip())
        
        return {
            "category": str(parsed.get("category", "")).strip().lower(),
            "color": str(parsed.get("color", "")).strip().lower(),
            "size": str(parsed.get("size", "")).strip().upper(),
            "gender": str(parsed.get("gender", "")).strip().lower(),
            "occasion": str(parsed.get("occasion", "")).strip().lower(),
            "style": str(parsed.get("style", "")).strip().lower(),
            "budget": float(parsed.get("budget")) if parsed.get("budget") is not None else None
        }
    except (APIError, APITimeoutError, APIConnectionError) as e:
        logger.error(f"Groq API error during filter extraction: {e}")
        return empty_filters
    except Exception as e:
        logger.error(f"Unexpected error parsing filters: {e}")
        return empty_filters


async def generate_stylist_response(query: str, products: list[dict]) -> str:
    """
    Generate a personal stylist recommendation response for matching products.
    Must be under 100 words in a sophisticated, minimalist luxury fashion tone.
    """
    product_summaries = []
    for idx, p in enumerate(products):
        product_summaries.append(
            f"Product {idx+1}: {p.get('name')} by {p.get('brand', 'Trendora')}, Price: INR {p.get('price')}, Category: {p.get('category')}, Rating: {p.get('rating')}"
        )
    products_text = "\n".join(product_summaries)

    system_prompt = (
        "You are an elite personal fashion stylist for Trendora, a luxury, minimalist fashion brand (like COS, Zara, or Saint Laurent).\n"
        "Given the user's shopping request and a list of matched products, write a concise styling response.\n"
        "You must include:\n"
        "- A short recommendation\n"
        "- Style explanation\n"
        "- Budget explanation\n"
        "- Suitability for the occasion\n"
        "Rules:\n"
        "- Be highly professional, sophisticated, and direct.\n"
        "- The total response length must be strictly less than 100 words.\n"
        "- Do not use placeholders or templates.\n"
        "- Do not include lists or bullet points. Write in elegant, continuous prose."
    )

    user_content = f"User Request: \"{query}\"\n\nMatched Products:\n{products_text}"

    try:
        response = await call_groq_chat_completion(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.7,
            max_tokens=150
        )
        stylist_text = (response.choices[0].message.content or "").strip()
        logger.info(f"Groq raw response for stylist: {stylist_text}")
        return stylist_text
    except Exception as e:
        logger.error(f"Error generating stylist response: {e}")
        return "For your query, these selections balance elegance, comfort, and affordability while maintaining a refined appearance suitable for the occasion."


async def generate_outfit_stylist_message(query: str, outfit: dict, total_price: float) -> str:
    """
    Generate a styling explanation for a generated outfit.
    Must be under 100 words.
    """
    outfit_desc = []
    for part, item in outfit.items():
        if item:
            outfit_desc.append(f"{part.capitalize()}: {item.get('name')} (INR {item.get('price')})")
        else:
            outfit_desc.append(f"{part.capitalize()}: None available")
    outfit_text = "\n".join(outfit_desc)

    system_prompt = (
        "You are an elite personal fashion stylist for Trendora. Explain this curated outfit combination (top, bottom, footwear) in a luxury fashion tone.\n"
        "Explain how the pieces match styled together, how they suit the occasion, and how the budget is respected.\n"
        "Ensure the response is strictly less than 100 words, written in a single continuous prose paragraph."
    )

    user_content = f"User Request: \"{query}\"\nCurated Outfit:\n{outfit_text}\nTotal Price: INR {total_price}"

    try:
        response = await call_groq_chat_completion(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.7,
            max_tokens=150
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as e:
        logger.error(f"Error generating outfit stylist response: {e}")
        return f"This cohesive, stylish outfit combines a minimalist top, matching bottom, and coordinating footwear, offering a refined look under INR {total_price}."


async def synthesize_user_profile(orders: list[dict], cart: dict, wishlist_products: list[dict], chat_history: list[dict]) -> dict:
    """
    Synthesize user interactions (orders, cart, wishlist, chatbot interactions) into a structured preference profile.
    """
    context_text = f"Orders:\n{json.dumps(orders, default=str)}\n\nCart:\n{json.dumps(cart, default=str)}\n\nWishlist Items:\n{json.dumps(wishlist_products, default=str)}\n\nChat History:\n{json.dumps(chat_history, default=str)}"

    system_prompt = (
        "Analyze the user's fashion preferences from their past orders, cart, wishlist, and chatbot query history.\n"
        "Return ONLY a valid JSON profile matching this schema:\n"
        "{\n"
        '  "preferred_categories": ["list", "of", "preferred", "categories"],\n'
        '  "preferred_colors": ["list", "of", "preferred", "colors"],\n'
        '  "preferred_sizes": ["list", "of", "preferred", "sizes"],\n'
        '  "preferred_occasions": ["list", "of", "preferred", "occasions"],\n'
        '  "preferred_styles": ["list", "of", "preferred", "styles"],\n'
        '  "average_price_point": float_or_null\n'
        "}"
    )

    try:
        response = await call_groq_chat_completion(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context_text}
            ],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content or ""
        return json.loads(content.strip())
    except Exception as e:
        logger.error(f"Error synthesizing profile: {e}")
        return {
            "preferred_categories": [],
            "preferred_colors": [],
            "preferred_sizes": [],
            "preferred_occasions": [],
            "preferred_styles": [],
            "average_price_point": None
        }


async def generate_personalized_recommendation_stylist_message(profile: dict, products: list[dict]) -> str:
    """
    Generate stylist description explaining why these products are recommended based on user preferences.
    """
    product_summaries = []
    for idx, p in enumerate(products):
        product_summaries.append(
            f"Product {idx+1}: {p.get('name')}, Price: INR {p.get('price')}, Category: {p.get('category')}, Colors: {p.get('colors')}"
        )
    products_text = "\n".join(product_summaries)

    system_prompt = (
        "You are an elite personal fashion stylist for Trendora.\n"
        "Explain these tailored product recommendations to the user based on their style preferences.\n"
        "Preferences:\n"
        f"{json.dumps(profile)}\n\n"
        "Address the user directly and explain why these specific items fit their ongoing wardrobe, taste, and lifestyle.\n"
        "Maintain a luxury, sophisticated tone under 100 words, in a single elegant paragraph."
    )

    try:
        response = await call_groq_chat_completion(
            model=PRIMARY_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Products:\n{products_text}"}
            ],
            temperature=0.7,
            max_tokens=150
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as e:
        logger.error(f"Error generating personalized stylist response: {e}")
        return "Based on your refined taste for minimalist styling and recent selections, these pieces have been curated to seamlessly elevate your wardrobe."
