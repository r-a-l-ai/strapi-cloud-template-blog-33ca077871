import openai
import requests
import os
import logging
import argparse
import json
import threading

from datetime import datetime


# Set up logging
log_level = os.getenv('LOG_LEVEL', 'warning').upper()
logging.basicConfig(level=getattr(logging, log_level, logging.WARNING))
logger = logging.getLogger(__name__)

# Set your OpenAI API key from environment variable
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError("OpenAI API key not found in environment variables.")
openai.api_key = api_key

# Initialize client
client = openai.OpenAI(api_key=api_key)

# Centralized Strapi URL
STRAPI_BASE_URL = os.getenv('STRAPI_BASE_URL', "http://localhost:1337/api")

# Function to get all messages from a thread
def get_all_messages(thread_id):
    all_messages = []
    limit = 100  # Maximum number of messages per request
    after = None

    while True:
        response = client.beta.threads.messages.list(
            thread_id=thread_id,
            limit=limit,
            after=after
        )
        messages = response.data
        if not messages:
            break
        all_messages.extend(messages)
        after = messages[-1].id  # Set cursor for the next page

    return all_messages

# Function to find Strapi ID of agent
def find_strapi_agent_id(agent_id):
    url = f"{STRAPI_BASE_URL}/agents"  # Example Strapi endpoint for agents
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('STRAPI_API_TOKEN')}"  # Read from STRAPI_API_TOKEN
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        agents = response.json().get('data', [])
        for agent in agents:
            if agent['attributes']['assistant_id'] == agent_id:
                return agent['id']
    logger.error(f"Failed to find Strapi ID for agent {agent_id}: {response.text}")
    return None

# Function to send client ID to Strapi and get Strapi client ID
def send_client_to_strapi(client_id):
    url = f"{STRAPI_BASE_URL}/clients"  # Example Strapi endpoint for clients
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('STRAPI_API_TOKEN')}"  # Read from STRAPI_API_TOKEN
    }
    
    data = {
        "data": {
            "client_id": client_id
        }
    }
    if logger.isEnabledFor(logging.DEBUG):
        logger.debug(f"Sending request to {url} with payload: {data}")
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        logger.info(f"Successfully sent client {client_id} to Strapi")
        return response.json().get('data', {}).get('id')
    else:
        logger.error(f"Failed to send client {client_id} to Strapi: {response.text}")
        return None

# Function to send thread ID to Strapi and get Strapi thread ID
def send_thread_to_strapi(thread_id, strapi_client_id, strapi_agent_id):
    url = f"{STRAPI_BASE_URL}/threads"  # Example Strapi endpoint for threads
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('STRAPI_API_TOKEN')}"  # Read from STRAPI_API_TOKEN
    }
    
    thread = client.beta.threads.retrieve(thread_id=thread_id)
    timestamp = datetime.utcfromtimestamp(thread.created_at).isoformat() + 'Z'

    data = {
        "data": {
            "thread_id": thread_id,
            "client": strapi_client_id,
            "assistant": strapi_agent_id,  # Link thread to assistant using strapi agent id
            "timestamp": timestamp
        }
    }
    if logger.isEnabledFor(logging.DEBUG):
        logger.debug(f"Sending request to {url} with payload: {data}")
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        logger.info(f"Successfully sent thread {thread_id} to Strapi")
        return response.json().get('data', {}).get('id')
    else:
        logger.error(f"Failed to send thread {thread_id} to Strapi: {response.text}")
        return None

# Function to send messages to Strapi
def send_messages_to_strapi(strapi_thread_id, messages, strapi_agent_id, strapi_client_id):
    url = f"{STRAPI_BASE_URL}/messages"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('STRAPI_API_TOKEN')}"
    }
    
    for message in messages:
        try:
            content = json.dumps(message.content)
        except (TypeError, ValueError):
            content = str(message.content)

        # Convert created_at timestamp to ISO 8601 format
        timestamp = datetime.utcfromtimestamp(message.created_at).isoformat() + 'Z'

        # Cast IDs to int if needed
        data = {
            "data": {
                "thread": int(strapi_thread_id),
                "client_id": int(strapi_client_id),
                "message_id": message.id,
                "assistant_id": strapi_agent_id,
                "content": content,
                "created_at": message.created_at,
                "role": message.role,
                "timestamp": timestamp
            }
        }
        
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Sending request to {url} with payload: {data}")
        
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            logger.info(f"Successfully sent message {message.id} to Strapi")
        else:
            logger.error(f"Failed to send message {message.id} to Strapi: {response.text}, Payload: {data}")


def delete_all_threads():
    url = f"{STRAPI_BASE_URL}/threads"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('STRAPI_API_TOKEN')}"
    }

    def delete_thread(thread_id):
        delete_url = f"{url}/{thread_id}"
        delete_response = requests.delete(delete_url, headers=headers)
        if delete_response.status_code == 200:
            logger.info(f"Successfully deleted thread {thread_id} from Strapi")
        else:
            logger.error(f"Failed to delete thread {thread_id} from Strapi: {delete_response.text}")

    while True:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            threads = response.json().get('data', [])
            if not threads:
                break
            threads_to_delete = []
            for thread in threads:
                thread_id = thread['id']
                thread = threading.Thread(target=delete_thread, args=(thread_id,))
                threads_to_delete.append(thread)
                thread.start()
            for thread in threads_to_delete:
                thread.join()
        else:
            logger.error(f"Failed to retrieve threads from Strapi: {response.text}")
            break

# Function to delete all clients from Strapi
def delete_all_clients():
    url = f"{STRAPI_BASE_URL}/clients"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('STRAPI_API_TOKEN')}"
    }

    def delete_client(client_id):
        delete_url = f"{url}/{client_id}"
        delete_response = requests.delete(delete_url, headers=headers)
        if delete_response.status_code == 200:
            logger.info(f"Successfully deleted client {client_id} from Strapi")
        else:
            logger.error(f"Failed to delete client {client_id} from Strapi: {delete_response.text}")

    while True:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            clients = response.json().get('data', [])
            if not clients:
                break
            clients_to_delete = []
            for client in clients:
                client_id = client['id']
                thread = threading.Thread(target=delete_client, args=(client_id,))
                clients_to_delete.append(thread)
                thread.start()
            for thread in clients_to_delete:
                thread.join()
        else:
            logger.error(f"Failed to retrieve clients from Strapi: {response.text}")
            break

# Function to delete all messages from Strapi
def delete_all_messages():
    url = f"{STRAPI_BASE_URL}/messages"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('STRAPI_API_TOKEN')}"
    }

    def delete_message(message_id):
        delete_url = f"{url}/{message_id}"
        delete_response = requests.delete(delete_url, headers=headers)
        if delete_response.status_code == 200:
            logger.info(f"Successfully deleted message {message_id} from Strapi")
        else:
            logger.error(f"Failed to delete message {message_id} from Strapi: {delete_response.text}")

    while True:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            messages = response.json().get('data', [])
            if not messages:
                break
            messages_to_delete = []
            for message in messages:
                message_id = message['id']
                thread = threading.Thread(target=delete_message, args=(message_id,))
                messages_to_delete.append(thread)
                thread.start()
            for thread in messages_to_delete:
                thread.join()
        else:
            logger.error(f"Failed to retrieve messages from Strapi: {response.text}")
            break

# Function to delete all objects from Strapi
def delete_all():
    delete_all_messages()
    delete_all_threads()
    delete_all_clients()

# Function to get raw thread data from OpenAI
def get_thread_raw(thread_id):
    try:
        thread = client.beta.threads.retrieve(thread_id=thread_id)
        print("============= Thread:")
        print(thread)
    except Exception as e:
        logger.error(f"Failed to retrieve thread {thread_id} from OpenAI: {e}")
        return

    messages = get_all_messages(thread_id)
    if messages:
        for message in messages:
            print(message)
    else:
        logger.error(f"Failed to retrieve messages for thread {thread_id} from OpenAI")

# Main function to handle command line arguments
def main():
    parser = argparse.ArgumentParser(description="Manage Strapi data")
    parser.add_argument("command", choices=["import", "delete-threads", "delete-clients", "delete-messages", "delete-all", "get-thread-raw"], help="Command to execute")
    parser.add_argument("-f", "--file", help="Thread client file for import command")
    parser.add_argument("-a", "--assistant", help="Assistant ID for import command")
    parser.add_argument("-c", "--count", type=int, help="Limit the number of imported rows")
    parser.add_argument("-t", "--thread", help="OpenAI thread ID for get-thread-raw command")

    args = parser.parse_args()

    if args.command == "import":
        if not args.file:
            parser.error("The import command requires the -f/--file argument")
        if not args.assistant:
            parser.error("The import command requires the -a/--assistant argument")
        with open(args.file, 'r') as file:
            thread_client_pairs = [line.split() for line in file.readlines()]

        if args.count:
            thread_client_pairs = thread_client_pairs[:args.count]

        strapi_agent_id = find_strapi_agent_id(args.assistant)
        if strapi_agent_id:
            threads = []
            for thread_id, client_id in thread_client_pairs:
                thread = threading.Thread(target=import_thread_and_client, args=(thread_id, client_id, strapi_agent_id))
                threads.append(thread)
                thread.start()
            for thread in threads:
                thread.join()
    elif args.command == "delete-threads":
        delete_all_threads()
    elif args.command == "delete-clients":
        delete_all_clients()
    elif args.command == "delete-messages":
        delete_all_messages()
    elif args.command == "delete-all":
        delete_all()
    elif args.command == "get-thread-raw":
        if not args.thread:
            parser.error("The get-thread-raw command requires the -t/--thread argument")
        get_thread_raw(args.thread)

def import_thread_and_client(thread_id, client_id, strapi_agent_id):
    strapi_client_id = send_client_to_strapi(client_id)
    if strapi_client_id:
        strapi_thread_id = send_thread_to_strapi(thread_id, strapi_client_id, strapi_agent_id)
        if strapi_thread_id:
            messages = get_all_messages(thread_id)
            messages.reverse()  # Sort messages from oldest to newest
            send_messages_to_strapi(strapi_thread_id, messages, strapi_agent_id, strapi_client_id)

if __name__ == "__main__":
    main()
