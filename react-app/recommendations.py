import psycopg
import sys
import os
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
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
def get_topsongs(user_id):
    cursor = connection.cursor()
    cursor.execute("SELECT artist, name, spotifyid, popularity, EXTRACT('year' FROM releasedate), danceability, energy, songkey, loudness, speechiness, acousticness, instrumentalness, liveness, valence, tempo FROM songs WHERE spotifyid IN (SELECT spotifyid FROM user_topsongs WHERE userid = %s);", (user_id,))
    songs = cursor.fetchall()
    cursor.close()
    columns = ['artist_name', 'track_name', 'track_id', 'popularity', 'year', 'danceability', 'energy', 'key', 'loudness', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo']
    df = pd.DataFrame(songs, columns=columns)
    return df

def ohe_prep(df, column, new_name):
    tf_df = pd.get_dummies(df[column])
    feature_names = tf_df.columns
    tf_df.columns = [new_name + str(i) for i in feature_names]
    tf_df.reset_index(drop=True, inplace=True)
    return tf_df

def create_feature_set(df, float_cols):
    year_ohe = ohe_prep(df, 'year', 'year') * 0.5
    popularity_ohe = ohe_prep(df, 'popularity_red', 'pop') * 0.15

    floats = df[float_cols].reset_index(drop=True)
    scaler = MinMaxScaler()
    floats_scaled = pd.DataFrame(scaler.fit_transform(floats), columns=floats.columns) * 0.2

    final = pd.concat([floats_scaled, year_ohe, popularity_ohe], axis=1)
    final['id'] = df['track_id'].values
    return final



def generate_playlist_feature(complete_feature_set, playlist_df):
    complete_feature_set_playlist = complete_feature_set.iloc[0:0].copy()
    float_cols2 = playlistdf.dtypes[playlistdf.dtypes == 'float64'].index.values
    temp = create_feature_set(playlist_df, float_cols2)
    temp_aligned = temp.reindex(columns=complete_feature_set.columns, fill_value=0.0)
    complete_feature_set_playlist = pd.concat([complete_feature_set_playlist, temp_aligned], ignore_index=True)
    complete_feature_set_nonplaylist = complete_feature_set[~complete_feature_set['id'].isin(playlist_df['track_id'].values)]
    complete_feature_set_playlist_final = complete_feature_set_playlist.drop(columns = "id")

    return complete_feature_set_playlist_final.sum(axis=0), complete_feature_set_nonplaylist


def generate_recommendations(df, features, nonplaylist_features):
    non_playlist_df = df[df['track_id'].isin(nonplaylist_features['id'].values)]
    non_playlist_df['sim'] = cosine_similarity(nonplaylist_features.drop("id", axis=1).values, features.values.reshape(1, -1))[:,0]
    non_playlist_df_top40 = non_playlist_df.sort_values('sim', ascending = False).head(40)
    return non_playlist_df_top40

df = pd.read_csv('spotify_data.csv')
df2 = df.copy()
df2 = df2.drop(['Unnamed: 0', 'genre', 'mode', 'duration_ms', 'time_signature'], axis=1)
float_cols = df2.dtypes[df2.dtypes == 'float64'].index.values
ohe_cols = 'popularity'
df2['popularity_red'] = df2['popularity'].apply(lambda x: int(x/5))
complete_feature_set = create_feature_set(df2, float_cols)


playlistdf = get_topsongs(int(sys.argv[1]))
convert_dict = {'danceability': float, 'energy': float, 'loudness': float, 'speechiness': float, 'acousticness': float, 'instrumentalness': float, 'liveness': float, 'valence': float, 'tempo': float}
playlistdf = playlistdf.astype(convert_dict)
playlistdf['year'] = playlistdf['year'].astype('int64')
playlistdf['key'] = playlistdf['key'].astype('int64')
playlistdf['popularity_red'] = playlistdf['popularity'].apply(lambda x: int(x/5))

complete_feature_set_playlist_vector, complete_feature_set_nonplaylist = generate_playlist_feature(complete_feature_set, playlistdf)
recommend = generate_recommendations(df2, complete_feature_set_playlist_vector, complete_feature_set_nonplaylist)

top10songs = recommend[['artist_name', 'track_name', 'track_id', 'sim']].head(10)
cursor = connection.cursor()
cursor.execute("DELETE FROM user_recommendations WHERE userid = %s;", (int(sys.argv[1]),))
connection.commit()
for index, item in top10songs.iterrows():
    cursor.execute("INSERT INTO user_recommendations (userid, songid) VALUES (%s, %s);", (int(sys.argv[1]), item['track_id']))
connection.commit()
cursor.close()
connection.close()