# OMNI-SYS

## Setup Instructions

### 1. Create and Activate a Virtual Environment (Linux)

```bash
python3 -m venv env
source env/bin/activate
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install poetry #if not installed yet
poetry install --no-root
```
#### To add any new dependencies

```bash
poetry add <package>
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## Running the Application

### Run Django Backend
From the /backend directory:

```bash
python manage.py runserver
```

### Run React Frontend
From the /frontend directory:

```bash
npm run dev
```
