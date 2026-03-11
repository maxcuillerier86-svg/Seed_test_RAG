"""
Seed Guide - AI-Powered Growing Assistant
A Flask backend that serves seed growing data and provides AI-generated guidance.
"""

import json
import os
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

# Load seed data
with open(os.path.join(os.path.dirname(__file__), "seed_data.json")) as f:
    SEED_DB = json.load(f)


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/seeds")
def get_seeds():
    """Return list of all available seeds with basic info."""
    seeds = []
    for s in SEED_DB["seeds"]:
        seeds.append({
            "id": s["id"],
            "name": s["name"],
            "category": s["category"],
            "difficulty": s["difficulty"],
            "days_to_harvest": s["days_to_harvest"],
        })
    return jsonify(seeds)


@app.route("/api/seeds/<seed_id>")
def get_seed(seed_id):
    """Return full details for a specific seed."""
    for s in SEED_DB["seeds"]:
        if s["id"] == seed_id:
            return jsonify(s)
    return jsonify({"error": "Seed not found"}), 404


@app.route("/api/guide", methods=["POST"])
def generate_guide():
    """Generate a personalized growing guide based on user inputs."""
    data = request.json
    seed_id = data.get("seed_id")
    zip_code = data.get("zip_code", "")
    space_type = data.get("space_type", "outdoor_garden")
    experience = data.get("experience", "beginner")
    plant_date = data.get("plant_date", "")

    # Find the seed
    seed = None
    for s in SEED_DB["seeds"]:
        if s["id"] == seed_id:
            seed = s
            break
    if not seed:
        return jsonify({"error": "Seed not found"}), 404

    # Generate personalized recommendations
    guide = build_personalized_guide(seed, space_type, experience, plant_date)
    return jsonify(guide)


@app.route("/api/schedule", methods=["POST"])
def create_schedule():
    """Create a planting schedule with reminders based on seed and plant date."""
    data = request.json
    seed_id = data.get("seed_id")
    plant_date_str = data.get("plant_date", "")

    seed = None
    for s in SEED_DB["seeds"]:
        if s["id"] == seed_id:
            seed = s
            break
    if not seed:
        return jsonify({"error": "Seed not found"}), 404

    if not plant_date_str:
        return jsonify({"error": "Plant date required"}), 400

    try:
        plant_date = datetime.strptime(plant_date_str, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Invalid date format, use YYYY-MM-DD"}), 400

    schedule = []
    for step in seed["growing_steps"]:
        step_date = plant_date + timedelta(weeks=step["week"])
        schedule.append({
            "date": step_date.strftime("%Y-%m-%d"),
            "display_date": step_date.strftime("%B %d, %Y"),
            "week": step["week"],
            "task": step["step"],
            "is_past": step_date.date() < datetime.now().date(),
            "is_today": step_date.date() == datetime.now().date(),
            "is_upcoming": (
                step_date.date() > datetime.now().date()
                and step_date.date() <= (datetime.now() + timedelta(days=7)).date()
            ),
        })
    return jsonify({
        "seed_name": seed["name"],
        "plant_date": plant_date_str,
        "schedule": schedule,
    })


@app.route("/api/library-resources")
def get_library_resources():
    """Return library resource information."""
    return jsonify(SEED_DB["library_resources"])


@app.route("/api/search", methods=["GET"])
def search_seeds():
    """Search seeds by name or category."""
    query = request.args.get("q", "").lower()
    if not query:
        return jsonify([])

    results = []
    for s in SEED_DB["seeds"]:
        if (
            query in s["name"].lower()
            or query in s["category"].lower()
            or any(query in v.lower() for v in s.get("varieties", []))
        ):
            results.append({
                "id": s["id"],
                "name": s["name"],
                "category": s["category"],
                "difficulty": s["difficulty"],
            })
    return jsonify(results)


def build_personalized_guide(seed, space_type, experience, plant_date):
    """Build a personalized growing guide with AI-style recommendations."""
    guide = {
        "seed": seed["name"],
        "overview": {
            "difficulty": seed["difficulty"],
            "time_to_harvest": seed["days_to_harvest"],
            "effort": seed["effort_level"],
        },
        "requirements": {
            "light": seed["sun"],
            "water": seed["water"],
            "soil": seed["soil"],
            "temperature": f"Min {seed['temperature_min_f']}°F, ideal {seed['temperature_ideal_f']}°F",
            "spacing": seed["spacing"],
            "planting_depth": seed["planting_depth"],
        },
        "equipment_needed": [],
        "space_recommendations": "",
        "experience_tips": [],
        "growing_steps": seed["growing_steps"],
        "pro_tips": seed["tips"],
        "library_resources": seed["library_resources"],
    }

    # Customize equipment list based on space type
    base_equipment = list(seed["equipment"])
    if space_type == "indoor":
        guide["space_recommendations"] = (
            f"Indoor growing is {'great' if seed['difficulty'] == 'Beginner' else 'possible but challenging'} "
            f"for {seed['name']}. You'll need {seed['space_needed']} near a sunny window or under grow lights."
        )
        if "Grow light or sunny window" not in " ".join(base_equipment):
            base_equipment.append("Grow light (if no south-facing window)")
        base_equipment.append("Drip tray for containers")
    elif space_type == "balcony":
        guide["space_recommendations"] = (
            f"Balcony growing works well for {seed['name']}! Use containers and make sure your "
            f"balcony gets {seed['sun']}. You'll need {seed['space_needed']}."
        )
        base_equipment.append("Wind protection (if high balcony)")
    elif space_type == "small_yard":
        guide["space_recommendations"] = (
            f"A small yard is great for {seed['name']}. Raised beds maximize space. "
            f"You'll need {seed['space_needed']} with {seed['sun']}."
        )
        base_equipment.append("Raised bed or grow bags (space-efficient)")
    else:
        guide["space_recommendations"] = (
            f"An outdoor garden is ideal for {seed['name']}! Plan for {seed['space_needed']} "
            f"in an area with {seed['sun']}."
        )

    guide["equipment_needed"] = base_equipment

    # Customize tips based on experience level
    if experience == "beginner":
        guide["experience_tips"] = [
            f"Welcome to growing {seed['name']}! This is rated '{seed['difficulty']}' difficulty.",
            "Don't worry about perfection — plants are resilient and forgiving.",
            "Start with just 1-2 plants to learn before scaling up.",
            "Your local library is a treasure trove of free gardening resources — check for seed libraries, tool lending, and workshops!",
            "Consider joining a local community garden to learn from experienced growers.",
        ]
    elif experience == "intermediate":
        guide["experience_tips"] = [
            f"Nice choice! {seed['name']} will do well with your experience level.",
            "Consider succession planting for extended harvest.",
            "Try companion planting to naturally manage pests.",
            "Check your library for advanced variety selection guides.",
        ]
    else:
        guide["experience_tips"] = [
            f"As an experienced gardener, you'll enjoy experimenting with {seed['name']} varieties: {', '.join(seed['varieties'])}.",
            "Consider seed saving from your best performers.",
            "Try grafting (for tomatoes/peppers) for disease resistance.",
        ]

    # Add planting schedule info if date provided
    if plant_date:
        guide["schedule_available"] = True
        guide["plant_date"] = plant_date
    else:
        guide["schedule_available"] = False

    return guide


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
