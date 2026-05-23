from __future__ import annotations


SCORING = {
    "correctResult": 5,
    "correctTeam1Score": 2,
    "correctTeam2Score": 2,
    "correctGoalDifference": 1,
}


def calculate_prediction_points(
    predicted_team1: int,
    predicted_team2: int,
    actual_team1: int,
    actual_team2: int,
) -> int:
    points = 0

    predicted_diff = predicted_team1 - predicted_team2
    actual_diff = actual_team1 - actual_team2

    if (
        (predicted_diff > 0 and actual_diff > 0)
        or (predicted_diff < 0 and actual_diff < 0)
        or (predicted_diff == 0 and actual_diff == 0)
    ):
        points += SCORING["correctResult"]

    if predicted_team1 == actual_team1:
        points += SCORING["correctTeam1Score"]
    if predicted_team2 == actual_team2:
        points += SCORING["correctTeam2Score"]
    if abs(predicted_diff) == abs(actual_diff):
        points += SCORING["correctGoalDifference"]

    return points


def prediction_outcome(predicted_team1: int, predicted_team2: int, actual_team1: int, actual_team2: int) -> str:
    predicted_diff = predicted_team1 - predicted_team2
    actual_diff = actual_team1 - actual_team2

    if (predicted_diff > 0 and actual_diff > 0) or (predicted_diff < 0 and actual_diff < 0):
        return "win"
    if predicted_diff == 0 and actual_diff == 0:
        return "draw"
    return "loss"

