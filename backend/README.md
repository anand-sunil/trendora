# 🛍️ Trendora — AI-Powered Fashion E-Commerce Backend

Production-ready backend for an AI-powered fashion e-commerce platform built with **FastAPI**, **MongoDB Atlas**, and **Motor** (async MongoDB driver).

---

## ✨ Features

| Module | Description |
|---|---|
| 🔐 **Authentication** | JWT-based auth with bcrypt password hashing, email validation, duplicate prevention |
| 👗 **Products** | Full CRUD with advanced filtering (category, color, size, brand, price range), pagination, sorting |
| 🛒 **Cart** | User-owned cart with add/view/remove, stock validation, product enrichment |
| 📦 **Orders** | Cart-to-order conversion with inventory decrement, order history |
| 🤖 **AI Chatbot** | Rule-based NLP extraction + relevance scoring recommendation engine |
| 🛡️ **Admin** | RBAC-protected product/order/user management + sales analytics |
| 📊 **Analytics** | Aggregated revenue, order counts, average order value, status breakdowns |

---

## 🏗️ Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry-point
│   ├── database.py             # Async MongoDB connection (Motor)
│   ├── config.py               # Pydantic-settings configuration
│   ├── models/                 # MongoDB document factories
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   └── order.py
│   ├── routes/                 # API endpoints
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── cart.py
│   │   ├── orders.py
│   │   ├── chatbot.py
│   │   └── admin.py
│   ├── services/               # Business logic
│   │   ├── auth_service.py
│   │   ├── product_service.py
│   │   ├── cart_service.py
│   │   ├── order_service.py
│   │   └── recommendation_service.py
│   ├── schemas/                # Pydantic V2 request/response models
│   │   ├── auth_schema.py
│   │   ├── product_schema.py
│   │   ├── cart_schema.py
│   │   └── order_schema.py
│   ├── utils/                  # Helpers
│   │   ├── jwt_handler.py
│   │   ├── password.py
│   │   └── response.py
│   └── dependencies/           # FastAPI dependencies
│       └── auth.py
├── requirements.txt
├── .env
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.12+
- MongoDB Atlas cluster (or local MongoDB)
- pip

### 1. Clone & navigate
```bash
cd backend
```

### 2. Create virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment
Edit `.env` with your MongoDB connection string:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=trendora
JWT_SECRET=your_super_secret_key_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 5. Run the server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Open API Docs
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login & get JWT | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List (with filters) | ❌ |
| GET | `/api/products/{id}` | Get by ID | ❌ |
| POST | `/api/products` | Create | ❌ |
| PUT | `/api/products/{id}` | Update | ❌ |
| DELETE | `/api/products/{id}` | Delete | ❌ |

### Cart
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/cart/add` | Add item | ✅ |
| GET | `/api/cart` | View cart | ✅ |
| DELETE | `/api/cart/remove/{product_id}` | Remove item | ✅ |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders/create` | Create from cart | ✅ |
| GET | `/api/orders/my-orders` | My order history | ✅ |
| GET | `/api/orders/{id}` | Get order by ID | ✅ |

### AI Chatbot
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chatbot/recommend` | Get AI recommendations | ❌ (rate-limited) |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/admin/products` | Create product | 🛡️ Admin |
| PUT | `/api/admin/products/{id}` | Update product | 🛡️ Admin |
| DELETE | `/api/admin/products/{id}` | Delete product | 🛡️ Admin |
| GET | `/api/admin/orders` | All orders | 🛡️ Admin |
| GET | `/api/admin/sales` | Sales analytics | 🛡️ Admin |
| GET | `/api/admin/users` | All users | 🛡️ Admin |

---

## 🤖 AI Fashion Assistant

The chatbot endpoint accepts natural-language fashion queries and returns scored product recommendations.

### Example Queries
```
"I need a black shirt under 1000 rupees"
"Show me XL blue shirts"
"Wedding outfit for men under 5000"
"Need a red dress under 2000"
```

### Extraction Capabilities
- **Category**: shirt, dress, jeans, kurta, saree, etc.
- **Color**: 30+ colors recognized
- **Size**: XS through 3XL + free size
- **Budget**: Parses ₹, Rs, INR, rupees, "under/below/within" patterns
- **Gender**: men, women, unisex
- **Occasion**: wedding, party, casual, formal, office, etc.

### Scoring Weights
| Factor | Weight |
|--------|--------|
| Category match | 30 pts |
| Color match | 25 pts |
| Price within budget | 25 pts |
| Size match | 20 pts |

---

## 🔒 Security

- ✅ JWT Bearer authentication
- ✅ Bcrypt password hashing (Passlib)
- ✅ Pydantic V2 input validation
- ✅ Environment variable configuration
- ✅ MongoDB connection pooling (50 max / 10 min)
- ✅ Centralized exception handling
- ✅ Rate limiting on chatbot endpoint (30 req/min)
- ✅ CORS middleware
- ✅ Role-based access control (user/admin)

---

## 🗄️ MongoDB Collections

| Collection | Description |
|------------|-------------|
| `users` | User accounts with roles |
| `products` | Product catalog |
| `carts` | Per-user shopping carts |
| `orders` | Order records with status tracking |
| `chat_history` | AI chatbot interaction logs |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| FastAPI | Async web framework |
| MongoDB Atlas | Cloud database |
| Motor | Async MongoDB driver |
| Pydantic V2 | Data validation |
| python-jose | JWT tokens |
| Passlib + Bcrypt | Password hashing |
| SlowAPI | Rate limiting |
| Uvicorn | ASGI server |

---

## 📝 License

MIT
