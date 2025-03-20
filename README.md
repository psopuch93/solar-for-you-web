# Solar For You - Business Management Platform

## 🌞 Project Overview

Solar For You is a comprehensive business management platform designed to streamline operations, track performance, and provide insightful analytics for solar energy businesses.

## 🚀 Features

- **Dashboard Analytics**: Real-time business performance tracking
- **Project Management**: Manage solar energy projects efficiently
- **Financial Insights**: Detailed income and expense tracking
- **Responsive Design**: Seamless experience across devices

## 🛠 Tech Stack

- **Backend**: Django
- **Frontend**: React
- **Styling**: Tailwind CSS
- **Database**: MySQL

## 📋 Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9.5+

## 🔧 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/solar-for-you.git
cd solar-for-you
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

1. Create environment configuration:
```bash
cp .env.example .env
```

2. Edit `.env` with your specific configuration:
   - Set `SECRET_KEY`
   - Configure database credentials
   - Adjust other environment-specific settings

#### Database Migrations

```bash
python manage.py migrate
```

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd frontend
npm install
```

### 4. Run Development Servers

#### Backend Server
```bash
# In the project root
python manage.py runserver
```

#### Frontend Development Server
```bash
# In the frontend directory
npm start
```

## 🌐 Deployment

### PythonAnywhere Deployment
1. Create a new web app
2. Configure static files
3. Set up virtual environment
4. Install requirements
5. Configure WSGI file

### Environment Variables
Always keep sensitive information in `.env` and never commit it to version control.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

Project Link: [https://github.com/your-username/solar-for-you](https://github.com/your-username/solar-for-you)

---

**Developed with ❤️ for Solar Energy Professionals**