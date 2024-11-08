from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
import json
from groq import Groq
import logging
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Connect to MongoDB Atlas cluster
client = MongoClient('mongodb://localhost:27017/')  # Update if using MongoDB Atlas
db = client['dresses']
dresses_collection = db['dresses']

# Groq LLM client
llm_client = Groq(api_key="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")
MODEL = 'llama3-groq-70b-8192-tool-use-preview'

# Initialize FastAPI
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define Pydantic models for request
class SearchRequest(BaseModel):
    user_query: str

# MongoDB-based search_product function
def search_product(size=None, dress_type=None, budget=None):
    query = {}
    
    if size:
        query['size'] = size
    if dress_type:
        query['type'] = dress_type
    if budget:
        query['price'] = {"$lte": budget}

    results = dresses_collection.find(query)
    
    dress_list = []
    for dress in results:
        dress_list.append({
            "name": dress.get("name"),
            "type": dress.get("type"),
            "size": dress.get("size"),
            "price": dress.get("price"),
            "color": dress.get("color"),
            "brand": dress.get("brand"),
            "material": dress.get("material")
        })

    logger.debug(f"Search results: {dress_list}")

    return dress_list

# Function to interact with Groq LLM and process the tool call
def run_conversation(user_prompt: str):
    messages = [
        {
            "role": "system",
            "content": "You are a highly capable fashion assistant that helps users find, select, and retrieve information about dresses based on various attributes like size, color, type, brand, and price range. Your main task is to interpret the user's natural language query and convert it into structured parameters for querying a database of fashion products. You must use the available tools (like search_product) to fetch information from the MongoDB database and generate clear, concise, and helpful responses for the user."
        },
        {
            "role": "user",
            "content": user_prompt,
        }
    ]

    tools = [
        {
            "type": "function",
            "function": {
                "name": "search_product",
                "description": "Search for dresses based on type, size, and budget",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "size": {"type": "string", "description": "Size of the dress"},
                        "dress_type": {"type": "string", "description": "Type of the dress (e.g., formal, casual)"},
                        "budget": {"type": "number", "description": "Maximum price for the dress"}
                    },
                    "required": ["size", "dress_type", "budget"],
                },
            },
        }
    ]

    try:
        response = llm_client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=tools,
            tool_choice="auto",
            max_tokens=4096
        )
    except Exception as e:
        logger.error(f"Error during LLM call: {str(e)}")
        return "Error while generating response."

    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls

    logger.debug(f"Tool calls: {tool_calls}")

    if tool_calls:
        available_functions = {
            "search_product": search_product,
        }

        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_to_call = available_functions[function_name]
            function_args = json.loads(tool_call.function.arguments)

            function_response = function_to_call(
                size=function_args.get("size"),
                dress_type=function_args.get("dress_type"),
                budget=function_args.get("budget")
            )

            logger.debug(f"Function response: {function_response}")

            formatted_response = (
                f"I found {len(function_response)} dresses. Here are the details: {json.dumps(function_response)}"
                if function_response else "No dresses found matching your criteria."
            )

            messages.append(
                {
                    "role": "user",
                    "content": formatted_response
                }
            )

            logger.debug(f"Message passed to LLM: {formatted_response}")

            try:
                second_response = llm_client.chat.completions.create(
                    model=MODEL,
                    messages=messages
                )
                logger.debug(f"Second LLM response: {second_response.choices[0].message.content}")

                return second_response.choices[0].message.content

            except Exception as e:
                logger.error(f"Error during second LLM call: {str(e)}")
                return "Error while generating natural language response."

    return response_message.content

# API route for handling the single entry point
@app.post("/search/")
def search_dresses(request: SearchRequest):
    try:
        result = run_conversation(request.user_query)
        return {"result": result}
    except Exception as e:
        logger.error(f"Error in search_dresses: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Run the API using Uvicorn
# Command to run: uvicorn filename:app --reload
