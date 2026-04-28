
# Match (Table used for scheduling match)

| Field | Type | Description |
|-------|------|-------------|
| ID | string | Unique match identifier |
| Sequence | number | Match sequence number |
| Team1 | string | First team name |
| Team2 | string | Second team name |
| Team1 Score | number | Goals/points scored by Team1 |
| Team2 Score | number | Goals/points scored by Team2 |
| Match Time (UTC) | datetime | Scheduled match start time in UTC |
| Predictions Ending Time | datetime | Deadline for accepting predictions |
| Round | number | Tournament round number |
| Comment | string | Additional notes or context |
| Match Tag | string | Category or label for the match |

# Team   (Match)

| Field | Type | Description |
|-------|------|-------------|
| Team ID | string | Unique team identifier |
| Team Name | string | Name of the team |
| Country | string | Country where the team is based |
| Coach | string | Name of the team's head coach |
| Founded Year | number | Year the team was established |

# User   (User)

| Field | Type | Description |
|-------|------|-------------|
| User ID | string | Unique user identifier |
| Email | string | User's email address |
| First Name | string | User's first name |
| Last Name | string | User's last name |
| Status | string | Current user status |
| Creation Time | datetime | Account creation timestamp |
| WhatsApp Number | string | User's WhatsApp contact number |
| City | string | City of residence |
| State | string | State/province of residence |
| Country | string | Country of residence |
| Comment | string | Additional notes or context |
| Community ID 1 | string | Primary community identifier |
| Community ID 2 | string | Secondary community identifier |
| IsActive | boolean | Whether the user account is active |
# Community  

| Field | Type | Description |
|-------|------|-------------|
| Community ID | string | Unique community identifier |
| Name | string | Name of the community |
| State | string | State/province where the community is located |
| City | string | City where the community is located |
| Addr | string | Physical address of the community |
| Creation Time | datetime | Community creation timestamp |

# Prediction  (User Prediction and Point calculated based on Correct result : 5 , Correct Team Score : 2 , Correct Team B score : 2, Correct Goal differece : 1)

| Field | Type | Description |
|-------|------|-------------|
| User ID | string | Unique user identifier |
| Email | string | User's email address |
| Match ID | string | Unique match identifier |
| Match Tag | string | Category or label for the match |
| Team1 Score | number | Predicted goals/points for Team1 |
| Team2 Score | number | Predicted goals/points for Team2 |
| Submitted Time | datetime | Timestamp when prediction was submitted |
| Points | number | Points awarded for prediction accuracy |
| Comment | string | Additional notes or context |

# Result   ( Schedule job fetch data for completed match from Prediction table and process and inserted to Result table )

| Field | Type | Description |
|-------|------|-------------|
| Result | string | Match outcome (win/loss/draw) |
| Match ID | string | Unique match identifier |
| Match Tag | string | Category or label for the match |
| Match Points | number | Points earned from match prediction |
| Final Points | number | Total accumulated points |
| Community ID 1 | string | Primary community identifier |
| Community ID 2 | string | Secondary community identifier |
| Daily Rank | number | User's ranking for the day |
| Final Rank | number | User's overall final ranking |
| User ID | string | Unique user identifier |
| User Name | string | Name of the user |

# Community Result (same Schedule job fetch data for completed match from Prediction table and process and inserted to Community Result Table )

| Community ID | string | Unique community identifier |
| Community Weightage Point | number | Weightage multiplier for community points |
| Match ID | string | Unique match identifier |
| Match Tag | string | Category or label for the match |
| Community Match Point | number | Points earned from match prediction at community level |
| Total Community Point | number | Cumulative points for the community |
| Daily Rank | number | Community's ranking for the day |
| Final Rank | number | Community's overall final ranking |



# Top Leaders  (materialized view and same schedule job process and insert first 30 records , this result will be cached and send to ui via API )

| Rank | number | User's ranking position |
| Total Points | number | Total accumulated points |
| Name | string | Name of the user |
| State | string | State/province of residence |
| Community 1 | string | Primary community identifier |
| Community 2 | string | Secondary community identifier |

# Daily Leaders (materialized view and same schedule job process and insert first 30 records , this result will be cached and send to ui via API )

| Rank | number | User's ranking position |
| Total Points | number | Total accumulated points |
| Name | string | Name of the user |
| State | string | State/province of residence |
| Community 1 | string | Primary community identifier |
| Community 2 | string | Secondary community identifier |

# Community Leaders (materialized view and same schedule job process and insert first 30 records , this result will be cached and send to ui via API )

| Rank | number | User's ranking position |
| Total Points | number | Total accumulated points |
| Community Name | string | Name of the user |

# Daily Community Leaders (materialized view and same schedule job process and insert first 30 records , this result will be cached and send to ui via API )

| Rank | number | User's ranking position |
| Total Points | number | Total accumulated points |
| Community Name | string | Name of the user |  