from fastapi import FastAPI
from pydantic import BaseModel,Field
from typing import Literal
import joblib
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model=joblib.load("House_Pipeline.pkl")

class user_itp(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    price: float = Field(..., gt=0, description="Price per night, must be positive")
    minimum_nights: int = Field(..., ge=1, le=365, description="Minimum nights required for booking")
    number_of_reviews: int = Field(..., ge=0, description="Total number of reviews")
    reviews_per_month: float = Field(..., ge=0, description="Average reviews per month")
    calculated_host_listings_count: int = Field(..., ge=0, description="Number of listings by this host")
    availability_365: int = Field(..., ge=0, le=365, description="Days available out of 365")
    neighbourhood_group: str = Field(..., min_length=1, description="Borough or neighbourhood group")
    neighbourhood: str = Field(..., min_length=1, description="Specific neighbourhood name")


@app.get('/')
def hello():
    return "hello"


@app.post("/predict")
def input_feature(user: user_itp):
    user_data = user.dict()
    data = pd.DataFrame([user_data],columns=user_data.keys())
    prediction = model.predict(data)
    probability=model.predict_proba(data)

    return {"Predicted_room_type":prediction[0],
            "Probability": probability.tolist()[0]}