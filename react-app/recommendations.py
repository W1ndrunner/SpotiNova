import psycopg
import sys
import os
import pandas as pd
from dotenv import load_dotenv
load_dotenv()

connection = psycopg.connect(
    dbname=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASS'),
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    sslrootcert="ca-certificate.crt",
    sslmode="require"
)
def get_recommendations(user_id):
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM songs WHERE spotifyid IN (SELECT spotifyid FROM user_topsongs WHERE userid = %s);", (user_id,))
    songs = cursor.fetchall()
    for song in songs:
        print("song: ", song[0])
    cursor.close()
    connection.close() 
    return user_id

df = pd.read_csv('spotify_data.csv')
df2 = df.copy()
df2 = df2.drop(['genre', 'mode', 'duration_ms', 'time_signature'], axis=1)

get_recommendations(11)

