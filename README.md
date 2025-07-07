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

### 4. Configure Environment Variables
In the backend/ directory, create a .env file with the following content:

```bash
DB_NAME=<your-database-name>
DB_USER=<your-database-user>
DB_PASSWORD=<your-database-password>
DB_HOST=<your-database-host>
DB_PORT=<your-database-port>
SECRET_KEY=<your-django-secret-key>
DEBUG=<true for development/false for production>
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

### Start Database
```bash
python manage.py dbshell
```
useful psql commands:

```bash
\l              #list all databases
\c db_name      #connect to a database
\dt             #list all tables in current schema
\d table_name   #show structure of table
\q              #quit psql terminal
```
## MQTT Communication System

## Communication Prerequisites (Only for local development)
Before running this project, you must have Docker installed. Choose **one** of these installation methods:

### Option 1: Docker Desktop (Recommended)
1. Download Docker Desktop:
   - [Windows/Mac](https://www.docker.com/products/docker-desktop)
   - [Linux](https://docs.docker.com/desktop/install/linux-install/)
2. Install with default settings

### Option 2: Command Line Installation (Linux)
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
```

## Comunication Setup 
### 1. Launch Docker (Only for local development)
```bash
Launch Docker Desktop and wait for it to be "ready"
```
or

```bash
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker 
```

### 2. Start EMQX Docker Container (Only for local development)
```bash
docker-compose up -d
```

### 3. Access EMQX Dashboard as Admin
Go to http://localhost:18083 and login to EMQX Dashboard with designated credentials.

### (Additional) Add Authentication in EMQX Dashboard
```
Navigate to the sidebar > Click 'Authentication' > 'Create'-button > Choose 'JWT'> Choose "Secret-based" and enter the same secret used by Django
```

## Communication Architecture Overview

- **MQTT Broker**: EMQX running on the main server (VM).
- **Backend API**: Django REST API provides authentication and metadata (e.g., agent IDs).
- **BaseNode**: Lightweight MQTT client script running on either the server or remote device.
- **Redis**: (Optional) Used on the server side for message buffering on failure.

---

## Communication Scripts

- `base_node.py`: Abstract class used for all agent communication
- `remote_base_node.py`: Same as "base_node.py" just different ports
- `send.py`: Same as "remote_send.py" just different ports
- `remote_send.py`: Used by object to send a message
- `receiver.py`: Used by any agent to continuously listen to incoming messages


### Steps
1. Make sure the corresponding base_node script exists in the system.
2. Run the corresponsing recv script for the receiver agent before sending a message.
3. Run the corresponding send script for the sender agent. 
4. Go to the console where you run the recv script to check the received message. 

---

## Best Practices

- **Message Topics**: All direct messages are published to `comm/<destination_agent_id>`.
- **QoS**: Use `QoS=1` to ensure delivery at least once.
- **Keep Nodes Alive**: Scripts should include an infinite loop (`while True`) to keep MQTT client running and responsive.
- **Logging**: Use Python `logging` module instead of `print` for structured logs.
- **Resilience**: On the server, Redis is used to buffer messages if a publish fails.

---

## Deployment Notes

- **Server Nodes**: Spawned and managed via `CommNodeManager` inside Django. Subscribed at startup.
- **Remote Nodes**: Use `remote_send.py` or `remote_recv.py` scripts. Each node must:
  - Authenticate to backend
  - Resolve agent IDs
  - Connect to EMQX broker
  - Send or receive messages

---

## Reinitializing Database and Migrations

Use the following steps to completely reset your PostgreSQL schema and Django migrations.

> ⚠️ **Warning**
> This will delete all data and migration history. All tables will be deleted.

### 1. Drop and Recreate the Database Schema

```bash
python manage.py dbshell
```

Then in the shell:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### 2. Delete Existing Migrations

```bash
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete
```

> 💡 **Note:** On Windows, use Git Bash or WSL. PowerShell requires different syntax.

### 3. Recreate and Apply Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

Your database and migrations are now reset to a clean state.

## Create Admin-/ Agent User

In order to be able to create any users or objects through API calls, a first admin user has to exist.

#### Create an Admin User in Shell:

```bash
poetry run python manage.py shell

from users.models import CustomUser, AdminProfile

admin_user = CustomUser.objects.create_user(username='admin_user', password='admin_password', role='admin')

AdminProfile.objects.create(user=admin_user, first_name='Admin_First', last_name='Admin_Last', email='admin@email.com')
```

#### Create an Agent User in Shell:

```bash
python manage.py shell

from users.models import CustomUser, AgentProfile
from api.models import Agent

agent_obj = Agent.objects.create(name='Agent Object')

agent_user = CustomUser.objects.create_user(username='agent_user', password='agent-password', role='agent')

AgentProfile.objects.create(user=agent_user, agent_object=agent_obj)
```

