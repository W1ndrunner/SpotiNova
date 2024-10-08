import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Avatar,
  HStack,
  Text,
  IconButton,
  Image,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  Spinner,
  extendTheme,
  ChakraProvider,
  VStack,
  SimpleGrid,
  Center,
} from "@chakra-ui/react";
import NavBar from "../components/NavBar";
import HomeMenu from "../components/Menu";
import {
  addTopTracks,
  getRecommendations,
} from "../services/DatabaseAPIClient";
import useAuthUser from "../stores/useAuthUser";
import {
  getToken,
  getTopTracks,
  getTrackFeatures,
  getTrackInfo,
} from "../services/SpotifyAPIClient";
import { set } from "react-hook-form";
const theme = extendTheme({
  colors: {
    brand: {
      text: "#000000",
      button: "#5A007D",
    },
    gradients: {
      blackToPurple: "linear(to-br, #000000, #5A007D)",
      salmonToPurple: "linear(to-l, #7928CA, #FF0080)",
    },
  },
});

const RecommendationsPage = () => {
  const [loading, setLoading] = useState(false);
  const [songInfo, setSongInfo] = useState(null);
  const [buttonClicked, setButtonClicked] = useState(false);
  const { authUser, setUser } = useAuthUser();
  const user = JSON.parse(localStorage.getItem("user") ?? "");
  const email = user ? user.email : null;
  class Track {
    name: string;
    id: string;
    artist: string;
    year: number;
    popularity: number;
    danceability: number;
    energy: number;
    key: number;
    loudness: number;
    speechiness: number;
    acousticness: number;
    instrumentalness: number;
    liveness: number;
    valence: number;
    tempo: number;

    constructor(
      name: string,
      id: string,
      artist: string,
      year: number,
      popularity: number,
      danceability?: number,
      energy?: number,
      key?: number,
      loudness?: number,
      speechiness?: number,
      acousticness?: number,
      instrumentalness?: number,
      liveness?: number,
      valence?: number,
      tempo?: number
    ) {
      this.name = name;
      this.id = id;
      this.artist = artist;
      this.year = year;
      this.popularity = popularity;
      this.danceability = danceability ?? 0;
      this.energy = energy ?? 0;
      this.key = key ?? 0;
      this.loudness = loudness ?? 0;
      this.speechiness = speechiness ?? 0;
      this.acousticness = acousticness ?? 0;
      this.instrumentalness = instrumentalness ?? 0;
      this.liveness = liveness ?? 0;
      this.valence = valence ?? 0;
      this.tempo = tempo ?? 0;
    }
  }
  const generateRecs = async () => {
    try {
      setLoading(true);
      setButtonClicked(true);
      const topTracks: Track[] = [];
      const token = await getToken(email);
      const tracksData = await getTopTracks(token);
      for (let i = 0; i < tracksData.length; i++) {
        const track = new Track(
          tracksData[i].name,
          tracksData[i].id,
          tracksData[i].album.artists[0].name,
          tracksData[i].album.release_date,
          tracksData[i].popularity
        );
        topTracks.push(track);
      }
      const trackIds = topTracks.map((track) => track.id);
      const trackFeatures = await getTrackFeatures(token, trackIds);
      for (let i = 0; i < trackFeatures.length; i++) {
        if (trackFeatures[i].id === topTracks[i].id) {
          topTracks[i].danceability = trackFeatures[i].danceability;
          topTracks[i].energy = trackFeatures[i].energy;
          topTracks[i].key = trackFeatures[i].key;
          topTracks[i].loudness = trackFeatures[i].loudness;
          topTracks[i].speechiness = trackFeatures[i].speechiness;
          topTracks[i].acousticness = trackFeatures[i].acousticness;
          topTracks[i].instrumentalness = trackFeatures[i].instrumentalness;
          topTracks[i].liveness = trackFeatures[i].liveness;
          topTracks[i].valence = trackFeatures[i].valence;
          topTracks[i].tempo = trackFeatures[i].tempo;
        }
      }
      const response = await addTopTracks({
        email: email,
        tracks: topTracks,
      });

      const recs = await getRecommendations({ email: email });
      const songids = recs.map((song: any) => song.songid);
      const token2 = await getToken(email);
      const songinfo = await getTrackInfo(token2, songids);
      console.log(songinfo);
      setSongInfo(songinfo);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Flex
        minHeight="100vh"
        flexDirection="column"
        width="100%"
        bgGradient={theme.colors.gradients.blackToPurple}
      >
        <Flex width="100%" justifyContent="space-between" alignItems="center">
          <Flex justifyContent="flex-start" textAlign="center">
            <Text
              bgGradient="linear(to-l, #7928CA, #FF0080)"
              bgClip="text"
              fontSize="30px"
              fontWeight="extrabold"
            >
              SpotiNova
            </Text>
          </Flex>
          <Flex justifyContent="center" marginLeft="-120px">
          <Box>
            <NavBar />
          </Box>
          </Flex>
          <Flex justifyContent="flex-end">
          <HomeMenu />
          </Flex>
        </Flex>
        {!buttonClicked && (
          <Flex justifyContent="center" alignItems="center">
            <Button colorScheme="purple" onClick={generateRecs} width="300px">
              {" "}
              Generate Recommendations
            </Button>
          </Flex>
        )}
        {loading ? (
          <Flex justifyContent="center" alignItems="center" flex="1">
            <Spinner size="xl" color="white" />
          </Flex>
        ) : (
          <SimpleGrid columns={5} spacing={5}>
            {songInfo &&
              (songInfo as any[]).map((song: any) => (
                <Box
                  maxW="200px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  textAlign="center"
                >
                  <Text fontSize="xl" color="white" fontWeight="bold">
                    {song.name}
                  </Text>
                  <Text fontSize="md" color="white">
                    {song.artists[0].name}
                  </Text>
                  <Image src={song.album.images[0].url} />
                </Box>
              ))}
          </SimpleGrid>
        )}
      </Flex>
    </ChakraProvider>
  );
};

export default RecommendationsPage;
